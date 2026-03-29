import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface EmailRequest {
  type: 'invitation' | 'welcome' | 'order_invoice' | 'order_status' | 'password_reset'
  to: string
  subject?: string
  data?: any
  userId?: string
  orderId?: string
}

interface UserProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string | null
  country?: string | null
}

interface OrderRecord {
  id: string
  created_at: string
  status: string
  total: number
  shipping_name: string
  shipping_country: string
  shipping_address?: string
  shipping_city?: string
  shipping_phone?: string
  order_items?: Array<{
    product_name: string
    quantity: number
    price: number
  }>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { type, to, subject, data, userId, orderId }: EmailRequest = await req.json()

    // Generate email content based on type
    const emailContent = await generateEmailContent(supabaseClient, type, data, userId, orderId)

    if (!emailContent) {
      throw new Error('Failed to generate email content')
    }

    // Send email via Resend
    const success = await sendEmail(to, emailContent.subject, emailContent.html)

    // Log the email
    await supabaseClient
      .from('email_logs')
      .insert({
        type,
        recipient: to,
        subject: emailContent.subject,
        user_id: userId,
        order_id: orderId,
        status: success ? 'sent' : 'failed',
        sent_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ success }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: success ? 200 : 500
      }
    )
  } catch (error) {
    console.error('Error in send-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function generateEmailContent(
  supabaseClient: any,
  type: string,
  data: any,
  userId?: string,
  orderId?: string
): Promise<{ subject: string; html: string } | null> {
  switch (type) {
    case 'invitation':
      return generateInvitationEmail(data)

    case 'welcome':
      return await generateWelcomeEmail(supabaseClient, userId!)

    case 'order_invoice':
      return await generateOrderInvoiceEmail(supabaseClient, userId!, orderId!)

    case 'order_status':
      return await generateOrderStatusEmail(supabaseClient, userId!, orderId!, data?.status)

    case 'password_reset':
      return generatePasswordResetEmail(data)

    default:
      return null
  }
}

function generateInvitationEmail(data: any): { subject: string; html: string } {
  const { email, invitation_url } = data

  return {
    subject: 'You\'re invited to join Nyalix Medical PVT LTD',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited to join Nyalix Global Care</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #17455a, #2d6a8a); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; color: #333; }
          .button { display: inline-block; background: linear-gradient(135deg, #17455a, #2d6a8a); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyalix Global Care</h1>
            <p>Medical Equipment Excellence</p>
          </div>
          <div class="content">
            <h2>You've been invited!</h2>
            <p>Hello,</p>
            <p>You've been invited to join Nyalix Medical PVT LTD platform. Click the button below to accept your invitation and set up your account.</p>
            <a href="${invitation_url}" class="button">Accept Invitation</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${invitation_url}">${invitation_url}</a></p>
            <p>This invitation will expire in 7 days.</p>
            <p>Best regards,<br>The Nyalix Medical PVT LTD Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nyalix Medical PVT LTD. All rights reserved.</p>
            <p>This is an automated invitation. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

async function generateWelcomeEmail(supabaseClient: any, userId: string): Promise<{ subject: string; html: string } | null> {
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !profile) return null

  return {
    subject: 'Welcome to Nyalix Medical PVT LTD!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Nyalix Medical PVT LTD</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #17455a, #2d6a8a); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; color: #333; }
          .button { display: inline-block; background: linear-gradient(135deg, #17455a, #2d6a8a); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyalix Medical PVT LTD</h1>
            <p>Welcome to Our Platform</p>
          </div>
          <div class="content">
            <h2>Welcome, ${profile.full_name}!</h2>
            <p>Thank you for joining Nyalix Medical PVT LTD! We're excited to have you as part of our community.</p>
            <p>Your account has been successfully created with the following details:</p>
            <ul>
              <li><strong>Name:</strong> ${profile.full_name}</li>
              <li><strong>Email:</strong> ${profile.email}</li>
              <li><strong>Country:</strong> ${profile.country || 'Not specified'}</li>
            </ul>
            <p>You can now browse our catalog of medical equipment and place orders.</p>
            <a href="https://nyalix.com" class="button">Start Shopping</a>
            <p>If you have any questions, please contact us at info@nyalix.com</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nyalix Medical PVT LTD. All rights reserved.</p>
            <p>This is an automated welcome message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

async function generateOrderInvoiceEmail(supabaseClient: any, userId: string, orderId: string): Promise<{ subject: string; html: string } | null> {
  // Get user profile
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (profileError || !profile) return null

  // Get order details
  const { data: order, error: orderError } = await supabaseClient
    .from('orders')
    .select(`
      *,
      order_items (
        product_name,
        quantity,
        price
      )
    `)
    .eq('id', orderId)
    .single()

  if (orderError || !order) return null

  const itemsHtml = order.order_items?.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product_name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `).join('') || ''

  return {
    subject: `Order Confirmation - ${orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Invoice - ${orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #17455a, #2d6a8a); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; color: #333; }
          .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .invoice-table th { background-color: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #17455a; }
          .invoice-table td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total-row { background-color: #f8f9fa; font-weight: bold; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyalix Global Care</h1>
            <h2>Order Invoice</h2>
          </div>
          <div class="content">
            <h3>Order ID: ${order.id}</h3>
            <p><strong>Customer:</strong> ${profile.full_name}</p>
            <p><strong>Email:</strong> ${profile.email}</p>
            <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>

            <h4>Shipping Details:</h4>
            <p>${order.shipping_name}<br>
            ${order.shipping_address || ''}<br>
            ${order.shipping_city || ''}, ${order.shipping_country}<br>
            Phone: ${order.shipping_phone || ''}</p>

            <h4>Order Items:</h4>
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;">Total Amount:</td>
                  <td style="text-align: right;">$${order.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <p>Thank you for your business!</p>
            <p>If you have any questions, please contact us at info@nyalix.com</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nyalix Medical PVT LTD. All rights reserved.</p>
            <p>This is an automated invoice. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

async function generateOrderStatusEmail(supabaseClient: any, userId: string, orderId: string, status: string): Promise<{ subject: string; html: string } | null> {
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (profileError || !profile) return null

  const statusMessages: { [key: string]: string } = {
    pending: 'Your order is being processed.',
    processing: 'Your order is being prepared for shipment.',
    shipped: 'Your order has been shipped.',
    delivered: 'Your order has been delivered.',
    cancelled: 'Your order has been cancelled.'
  }

  const statusColors: { [key: string]: string } = {
    pending: '#ffc107',
    processing: '#17a2b8',
    shipped: '#007bff',
    delivered: '#28a745',
    cancelled: '#dc3545'
  }

  return {
    subject: `Order Status Update - ${orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update - ${orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #17455a, #2d6a8a); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; color: #333; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; margin: 10px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyalix Medical PVT LTD</h1>
            <h2>Order Status Update</h2>
          </div>
          <div class="content">
            <h3>Order ID: ${orderId}</h3>
            <p>Dear ${profile.full_name},</p>
            <div class="status-badge" style="background-color: ${statusColors[status] || '#6c757d'};">Status: ${status.charAt(0).toUpperCase() + status.slice(1)}</div>
            <p>${statusMessages[status] || 'Your order status has been updated.'}</p>
            <p>If you have any questions, please contact our support team at info@nyalix.com</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nyalix Medical PVT LTD. All rights reserved.</p>
            <p>This is an automated status update. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

function generatePasswordResetEmail(data: any): { subject: string; html: string } {
  const { reset_url } = data

  return {
    subject: 'Reset your Nyalix Medical PVT LTD password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your password</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #17455a, #2d6a8a); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; color: #333; }
          .button { display: inline-block; background: linear-gradient(135deg, #17455a, #2d6a8a); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyalix Medical PVT LTD</h1>
            <p>Password Reset</p>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>You requested a password reset for your Nyalix Medical PVT LTD account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${reset_url}" class="button">Reset Password</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${reset_url}">${reset_url}</a></p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nyalix Medical PVT LTD. All rights reserved.</p>
            <p>This is an automated password reset email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not set')
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Nyalix Medical PVT LTD <info@nyalix.com>',
        to: [to],
        subject,
        html
      })
    })

    return response.ok
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}