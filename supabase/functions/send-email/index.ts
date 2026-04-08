import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface EmailRequest {
  type: 'invitation' | 'welcome' | 'order_invoice' | 'order_status' | 'password_reset' | 'quote_pending' | 'quote_responded' | 'quote_approved' | 'contact_submitted' | 'contact_replied' | 'contact_resolved'
  to: string
  subject?: string
  data?: Record<string, unknown>
  userId?: string
  orderId?: string
  quoteId?: string
  messageId?: string
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { 
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` 
          },
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
    const logStatus = success ? 'sent' : 'failed'
    await supabaseClient
      .from('email_logs')
      .insert({
        type,
        recipient: to,
        subject: emailContent.subject,
        user_id: userId,
        order_id: orderId,
        status: logStatus,
        sent_at: new Date().toISOString()
      })

    if (!success) {
      const errorMessage = 'send-email function: email send failed (Resend request failed). Ensure RESEND_API_KEY is configured and the recipient email is valid.'
      console.error(errorMessage)
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
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
  supabaseClient: ReturnType<typeof createClient>,
  type: string,
  data: Record<string, unknown>,
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

    case 'quote_pending':
      return await generateQuotePendingEmail(supabaseClient, data?.quoteId)

    case 'quote_responded':
      return await generateQuoteRespondedEmail(supabaseClient, data?.quoteId)

    case 'quote_approved':
      return await generateQuoteApprovedEmail(supabaseClient, data?.quoteId)

    case 'contact_submitted':
      return generateContactSubmittedEmail(data)

    case 'contact_replied':
      return generateContactRepliedEmail(data)

    case 'contact_resolved':
      return generateContactResolvedEmail(data)

    case 'password_reset':
      return generatePasswordResetEmail(data)

    default:
      return null
  }
}

function generateInvitationEmail(data: { email: string; invitation_url: string }): { subject: string; html: string } {
  const { email, invitation_url } = data

  return {
    subject: 'You\'re invited to join Nyalix Medical PVT LTD',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited to join Nyalix Medical PVT LTD</title>
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
            <p>&copy; 2026 Nyalix Medical PVT LTD. All rights reserved.</p>
            <p>This is an automated invitation. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

async function generateWelcomeEmail(supabaseClient: ReturnType<typeof createClient>, userId: string): Promise<{ subject: string; html: string } | null> {
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
            <p>&copy; 2026 Nyalix Medical PVT LTD. All rights reserved.</p>
            <p>This is an automated welcome message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

async function generateOrderInvoiceEmail(supabaseClient: ReturnType<typeof createClient>, userId: string, orderId: string): Promise<{ subject: string; html: string } | null> {
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

  const itemsHtml = order.order_items?.map((item: { product_name: string; quantity: number; price: number }) => `
    <tr>
      <td class="product-name">${item.product_name}</td>
      <td class="quantity">${item.quantity}</td>
      <td class="price">$${item.price.toFixed(2)}</td>
      <td class="total">$${(item.quantity * item.price).toFixed(2)}</td>
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
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f6f6f6;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #17455a 0%, #2d6a8a 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
            letter-spacing: 1px;
          }
          .header h2 {
            margin: 10px 0 0 0;
            font-size: 16px;
            font-weight: 400;
            opacity: 0.9;
          }
          .content {
            padding: 0;
          }
          .order-info {
            background-color: #f8f9fa;
            padding: 25px 30px;
            border-bottom: 1px solid #e9ecef;
          }
          .order-id {
            font-size: 18px;
            font-weight: bold;
            color: #17455a;
            margin: 0 0 15px 0;
          }
          .order-date {
            color: #6c757d;
            font-size: 14px;
            margin: 0;
          }
          .customer-section {
            padding: 30px;
            background-color: #ffffff;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #17455a;
            margin: 0 0 15px 0;
            border-bottom: 2px solid #17455a;
            padding-bottom: 5px;
          }
          .customer-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
          }
          .detail-row {
            display: flex;
            margin-bottom: 8px;
          }
          .detail-label {
            font-weight: bold;
            color: #495057;
            min-width: 80px;
            flex-shrink: 0;
          }
          .detail-value {
            color: #212529;
          }
          .order-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          .order-table th {
            background-color: #17455a;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
          }
          .order-table td {
            padding: 15px;
            border-bottom: 1px solid #e9ecef;
            background-color: #ffffff;
          }
          .order-table tbody tr:hover {
            background-color: #f8f9fa;
          }
          .product-name {
            font-weight: 500;
            color: #212529;
          }
          .quantity, .price, .total {
            text-align: center;
            font-weight: 500;
          }
          .pricing-section {
            background-color: #f8f9fa;
            padding: 25px 30px;
            border-top: 1px solid #e9ecef;
          }
          .pricing-breakdown {
            max-width: 300px;
            margin-left: auto;
          }
          .pricing-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .pricing-row:last-child {
            border-bottom: none;
            border-top: 2px solid #17455a;
            margin-top: 10px;
            padding-top: 15px;
            font-size: 18px;
            font-weight: bold;
            color: #17455a;
          }
          .pricing-label {
            color: #495057;
          }
          .pricing-value {
            font-weight: 500;
            color: #212529;
          }
          .cta-section {
            padding: 30px;
            text-align: center;
            background-color: #ffffff;
          }
          .cta-button {
            display: inline-block;
            background-color: #17455a;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-weight: 500;
            margin: 0 10px 10px 0;
            transition: background-color 0.3s ease;
          }
          .cta-button:hover {
            background-color: #0d3445;
          }
          .footer {
            background-color: #17455a;
            color: white;
            padding: 30px;
            text-align: center;
          }
          .footer-content {
            max-width: 400px;
            margin: 0 auto;
          }
          .footer h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: 400;
          }
          .footer p {
            margin: 5px 0;
            font-size: 13px;
            opacity: 0.9;
          }
          .footer a {
            color: #4dabf7;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          @media only screen and (max-width: 600px) {
            .email-container {
              margin: 0;
              box-shadow: none;
            }
            .header, .customer-section, .cta-section, .footer {
              padding-left: 20px;
              padding-right: 20px;
            }
            .order-table {
              font-size: 14px;
            }
            .order-table th, .order-table td {
              padding: 10px 8px;
            }
            .detail-row {
              flex-direction: column;
            }
            .detail-label {
              margin-bottom: 2px;
            }
            .cta-button {
              display: block;
              margin: 0 0 10px 0;
              width: 100%;
              box-sizing: border-box;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <!-- Header -->
          <div class="header">
            <h1>Nyalix Medical PVT LTD</h1>
            <h2>Order Confirmation</h2>
          </div>

          <!-- Order Info -->
          <div class="order-info">
            <p class="order-id">Order #${order.id}</p>
            <p class="order-date">Order Date: ${new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>

          <!-- Customer Details -->
          <div class="customer-section">
            <h3 class="section-title">Customer Details</h3>
            <div class="customer-details">
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${profile.full_name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${profile.email}</span>
              </div>
              ${profile.phone ? `
              <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${profile.phone}</span>
              </div>
              ` : ''}
              ${profile.country ? `
              <div class="detail-row">
                <span class="detail-label">Country:</span>
                <span class="detail-value">${profile.country}</span>
              </div>
              ` : ''}
            </div>

            <h3 class="section-title">Shipping Address</h3>
            <div class="customer-details">
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${order.shipping_name}</span>
              </div>
              ${order.shipping_address ? `
              <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${order.shipping_address}</span>
              </div>
              ` : ''}
              ${order.shipping_city ? `
              <div class="detail-row">
                <span class="detail-label">City:</span>
                <span class="detail-value">${order.shipping_city}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Country:</span>
                <span class="detail-value">${order.shipping_country}</span>
              </div>
              ${order.shipping_phone ? `
              <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${order.shipping_phone}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Order Items -->
          <div class="customer-section">
            <h3 class="section-title">Order Summary</h3>
            <table class="order-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: center;">Price</th>
                  <th style="text-align: center;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Pricing Breakdown -->
          <div class="pricing-section">
            <div class="pricing-breakdown">
              <div class="pricing-row">
                <span class="pricing-label">Subtotal:</span>
                <span class="pricing-value">$${order.total.toFixed(2)}</span>
              </div>
              <div class="pricing-row">
                <span class="pricing-label">Shipping:</span>
                <span class="pricing-value">Free</span>
              </div>
              <div class="pricing-row">
                <span class="pricing-label">Tax:</span>
                <span class="pricing-value">$0.00</span>
              </div>
              <div class="pricing-row">
                <span class="pricing-label">Grand Total:</span>
                <span class="pricing-value">$${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Call to Action -->
          <div class="cta-section">
            <a href="https://nyalix.com/orders/${order.id}" class="cta-button">View Order Details</a>
            <a href="https://nyalix.com/track-order" class="cta-button">Track Your Order</a>
            <p style="margin-top: 20px; color: #6c757d; font-size: 14px;">
              Thank you for choosing Nyalix Medical PVT LTD for your medical equipment needs!
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-content">
              <h3>Need Help?</h3>
              <p><a href="mailto: info@nyalix.com"> info@nyalix.com</a></p>
              <p><a href="tel:+917339700569">+917339700569</a></p>
              <p>24/7 Customer Support Available</p>
              <p>&copy; 2026 Nyalix Medical PVT LTD. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

async function generateOrderStatusEmail(supabaseClient: ReturnType<typeof createClient>, userId: string, orderId: string, status: string): Promise<{ subject: string; html: string } | null> {
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
            <p>&copy; 2026 Nyalix Medical PVT LTD. All rights reserved.</p>
            <p>This is an automated status update. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

function generatePasswordResetEmail(data: { reset_url: string }): { subject: string; html: string } {
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
            <p>&copy; 2026 Nyalix Medical PVT LTD. All rights reserved.</p>
            <p>This is an automated password reset email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

async function generateQuotePendingEmail(supabaseClient: ReturnType<typeof createClient>, quoteId: string): Promise<{ subject: string; html: string } | null> {
  const { data: quote, error } = await supabaseClient
    .from('quote_requests')
    .select('*')
    .eq('id', quoteId)
    .single()

  if (error || !quote) return null

  return {
    subject: 'Quote Request Received - Nyalix Medical PVT LTD',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quote Request Received</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #17455a, #2d6a8a); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; color: #333; }
          .quote-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyalix Medical PVT LTD</h1>
            <h2>Quote Request Received</h2>
          </div>
          <div class="content">
            <h3>Dear ${quote.name},</h3>
            <p>Thank you for your interest in our medical equipment. We have received your quote request and our team is reviewing it.</p>
            
            <div class="quote-details">
              <h4>Quote Request Details:</h4>
              <p><strong>Product:</strong> ${quote.product_name}</p>
              <p><strong>Quantity:</strong> ${quote.quantity}</p>
              <p><strong>Company:</strong> ${quote.company}</p>
              <p><strong>Request ID:</strong> ${quote.id}</p>
            </div>

            <p>Our sales team will respond to your request within 24-48 hours with pricing and availability information.</p>
            <p>If you have any urgent questions, please contact us at info@nyalix.com or call +917339700569 / +249116648870.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Nyalix Medical PVT LTD. All rights reserved.</p>
            <p>This is an automated confirmation. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

async function generateQuoteRespondedEmail(supabaseClient: ReturnType<typeof createClient>, quoteId: string): Promise<{ subject: string; html: string } | null> {
  const { data: quote, error } = await supabaseClient
    .from('quote_requests')
    .select('*')
    .eq('id', quoteId)
    .single()

  if (error || !quote) return null

  return {
    subject: 'Quote Response - Nyalix Medical PVT LTD',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quote Response</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #17455a, #2d6a8a); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; color: #333; }
          .quote-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .response-box { background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17455a; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyalix Medical PVT LTD</h1>
            <h2>Quote Response</h2>
          </div>
          <div class="content">
            <h3>Dear ${quote.name},</h3>
            <p>Thank you for your quote request. Our sales team has reviewed your requirements and prepared a quotation for you.</p>
            
            <div class="quote-details">
              <h4>Quote Request Details:</h4>
              <p><strong>Product:</strong> ${quote.product_name}</p>
              <p><strong>Quantity:</strong> ${quote.quantity}</p>
              <p><strong>Company:</strong> ${quote.company}</p>
              <p><strong>Request ID:</strong> ${quote.id}</p>
            </div>

            <div class="response-box">
              <h4>Our Response:</h4>
              <p>${quote.admin_response || 'Please contact us for detailed pricing and availability.'}</p>
            </div>

            <p>If this quotation meets your requirements, please let us know and we can proceed with the order.</p>
            <p>For any questions or to discuss this further, please contact our sales team at info@nyalix.com or call +917339700569 / +249116648870.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Nyalix Medical PVT LTD. All rights reserved.</p>
            <p>This is an automated response. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

async function generateQuoteApprovedEmail(supabaseClient: ReturnType<typeof createClient>, quoteId: string): Promise<{ subject: string; html: string } | null> {
  const { data: quote, error } = await supabaseClient
    .from('quote_requests')
    .select('*')
    .eq('id', quoteId)
    .single()

  if (error || !quote) return null

  // Use actual pricing from the quote record
  const unitPrice = quote.unit_price || 100.00;
  const taxRate = quote.tax_rate || 0.08;
  const quantity = quote.quantity;
  const subtotal = unitPrice * quantity;
  const taxAmount = quote.tax_amount || (subtotal * taxRate);
  const total = quote.total_amount || (subtotal + taxAmount);

  return {
    subject: `Invoice - Quote Approved - ${quote.id}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - Quote Approved</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f6f6; }
          .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #17455a 0%, #2d6a8a 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px; }
          .header h2 { margin: 10px 0 0 0; font-size: 16px; font-weight: 400; opacity: 0.9; }
          .content { padding: 0; }
          .invoice-info { background-color: #f8f9fa; padding: 25px 30px; border-bottom: 1px solid #e9ecef; }
          .invoice-id { font-size: 18px; font-weight: bold; color: #17455a; margin: 0 0 15px 0; }
          .invoice-date { color: #6c757d; font-size: 14px; margin: 0; }
          .customer-section { padding: 30px; background-color: #ffffff; }
          .section-title { font-size: 16px; font-weight: bold; color: #17455a; margin: 0 0 15px 0; border-bottom: 2px solid #17455a; padding-bottom: 5px; }
          .customer-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
          .detail-row { display: flex; margin-bottom: 8px; }
          .detail-label { font-weight: bold; color: #495057; min-width: 80px; flex-shrink: 0; }
          .detail-value { color: #212529; }
          .order-table { width: 100%; border-collapse: collapse; margin: 25px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
          .order-table th { background-color: #17455a; color: white; padding: 15px; text-align: left; font-weight: 600; font-size: 14px; }
          .order-table td { padding: 15px; border-bottom: 1px solid #e9ecef; background-color: #ffffff; }
          .product-name { font-weight: 500; color: #212529; }
          .quantity, .price, .total { text-align: center; font-weight: 500; }
          .pricing-section { background-color: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e9ecef; }
          .pricing-breakdown { max-width: 300px; margin-left: auto; }
          .pricing-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
          .pricing-row:last-child { border-bottom: none; border-top: 2px solid #17455a; margin-top: 10px; padding-top: 15px; font-size: 18px; font-weight: bold; color: #17455a; }
          .pricing-label { color: #495057; }
          .pricing-value { font-weight: 500; color: #212529; }
          .cta-section { padding: 30px; text-align: center; background-color: #ffffff; }
          .cta-button { display: inline-block; background-color: #17455a; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500; margin: 0 10px 10px 0; transition: background-color 0.3s ease; }
          .cta-button:hover { background-color: #0d3445; }
          .footer { background-color: #17455a; color: white; padding: 30px; text-align: center; }
          .footer-content { max-width: 400px; margin: 0 auto; }
          .footer h3 { margin: 0 0 15px 0; font-size: 16px; font-weight: 400; }
          .footer p { margin: 5px 0; font-size: 13px; opacity: 0.9; }
          .footer a { color: #4dabf7; text-decoration: none; }
          .footer a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <!-- Header -->
          <div class="header">
            <h1>Nyalix Medical PVT LTD</h1>
            <h2>Invoice</h2>
          </div>

          <!-- Invoice Info -->
          <div class="invoice-info">
            <p class="invoice-id">Invoice #${quote.id}</p>
            <p class="invoice-date">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <!-- Customer Details -->
          <div class="customer-section">
            <h3 class="section-title">Bill To</h3>
            <div class="customer-details">
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${quote.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Company:</span>
                <span class="detail-value">${quote.company}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${quote.email}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${quote.phone}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Country:</span>
                <span class="detail-value">${quote.country}</span>
              </div>
            </div>
          </div>

          <!-- Order Items -->
          <div class="customer-section">
            <h3 class="section-title">Order Summary</h3>
            <table class="order-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: center;">Unit Price</th>
                  <th style="text-align: center;">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="product-name">${quote.product_name}</td>
                  <td class="quantity">${quantity}</td>
                  <td class="price">$${unitPrice.toFixed(2)}</td>
                  <td class="total">$${subtotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pricing Breakdown -->
          <div class="pricing-section">
            <div class="pricing-breakdown">
              <div class="pricing-row">
                <span class="pricing-label">Subtotal:</span>
                <span class="pricing-value">$${subtotal.toFixed(2)}</span>
              </div>
              <div class="pricing-row">
                <span class="pricing-label">Tax (${(taxRate * 100).toFixed(1)}%):</span>
                <span class="pricing-value">$${taxAmount.toFixed(2)}</span>
              </div>
              <div class="pricing-row">
                <span class="pricing-label">Total:</span>
                <span class="pricing-value">$${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Call to Action -->
          <div class="cta-section">
            <a href="https://nyalix.com/checkout?quote=${quote.id}" class="cta-button">Complete Purchase</a>
            <a href="https://nyalix.com/contact" class="cta-button">Contact Support</a>
            <p style="margin-top: 20px; color: #6c757d; font-size: 14px;">
              Thank you for choosing Nyalix Medical PVT LTD for your medical equipment needs!
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-content">
              <h3>Need Help?</h3>
              <p><a href="mailto:info@nyalix.com">info@nyalix.com</a></p>
              <p><a href="tel:+917339700569">+917339700569</a> / <a href="tel:+249116648870">+249116648870</a></p>
              <p>24/7 Customer Support Available</p>
              <p>&copy; 2026 Nyalix Medical PVT LTD. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

function generateContactSubmittedEmail(data: Record<string, unknown>): { subject: string; html: string } {
  const name = (data?.name as string) || 'Valued Customer'

  return {
    subject: 'Message Received - Nyalix Medical PVT LTD',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message Received</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #17455a, #2d6a8a); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; color: #333; }
          .message-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17455a; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyalix Medical PVT LTD</h1>
            <h2>Thank You for Contacting Us</h2>
          </div>
          <div class="content">
            <h3>Dear ${name},</h3>
            <p>We have received your message and appreciate you taking the time to contact Nyalix Medical PVT LTD.</p>
            
            <div class="message-info">
              <p><strong>What happens next?</strong></p>
              <p>Our team will review your message and respond as soon as possible, typically within 24-48 hours.</p>
              <p>You can view your message status and our response in your profile dashboard.</p>
            </div>

            <p>If you need immediate assistance, please contact us directly:</p>
            <ul>
              <li>Email: <a href="mailto:info@nyalix.com">info@nyalix.com</a></li>
              <li>India: <a href="tel:+917339700569">+917339700569</a></li>
              <li>Sudan: <a href="tel:+249116648870">+249116648870</a></li>
            </ul>

            <p>Thank you for your patience!</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Nyalix Medical PVT LTD. All rights reserved.</p>
            <p>This is an automated confirmation. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

function generateContactRepliedEmail(data: Record<string, unknown>): { subject: string; html: string } {
  const reply = ((data?.reply || '') as string).substring(0, 200) || 'Thank you for reaching out.'

  return {
    subject: 'We\'ve Replied to Your Message - Nyalix Medical PVT LTD',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Reply to Your Message</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #17455a, #2d6a8a); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; color: #333; }
          .reply-box { background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17455a; }
          .button { display: inline-block; background: linear-gradient(135deg, #17455a, #2d6a8a); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyalix Medical PVT LTD</h1>
            <h2>New Reply to Your Message</h2>
          </div>
          <div class="content">
            <h3>We Have Replied!</h3>
            <p>Our team has responded to your message. Here's a preview of their response:</p>
            
            <div class="reply-box">
              <p>${reply}</p>
            </div>

            <p>To view the full reply and continue the conversation, please visit your profile dashboard:</p>
            <a href="https://nyalix.com/profile" class="button">View Full Reply</a>

            <p>If you have any follow-up questions, feel free to reply directly through your dashboard.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Nyalix Medical PVT LTD. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

function generateContactResolvedEmail(data: Record<string, unknown>): { subject: string; html: string } {
  return {
    subject: 'Your Message Has Been Resolved - Nyalix Medical PVT LTD',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message Resolved</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #17455a, #2d6a8a); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; color: #333; }
          .resolved-box { background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyalix Medical PVT LTD</h1>
            <h2>Message Resolved</h2>
          </div>
          <div class="content">
            <h3>Your Inquiry Has Been Resolved</h3>
            
            <div class="resolved-box">
              <p><strong style="color: #28a745;">✓ Status: Resolved</strong></p>
              <p>Thank you for contacting Nyalix Medical PVT LTD. Our team has successfully addressed your inquiry.</p>
            </div>

            <p>You can view the complete conversation history in your profile dashboard, where all messages and replies are maintained for your reference.</p>

            <p>If you have any additional questions or concerns, please don't hesitate to contact us:</p>
            <ul>
              <li>Email: <a href="mailto:info@nyalix.com">info@nyalix.com</a></li>
              <li>India: <a href="tel:+917339700569">+917339700569</a></li>
              <li>Sudan: <a href="tel:+249116648870">+249116648870</a></li>
            </ul>

            <p>We appreciate your business and look forward to serving you again!</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Nyalix Medical PVT LTD. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
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
    console.error('RESEND_API_KEY not set - cannot send email')
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

    if (!response.ok) {
      const bodyText = await response.text()
      console.error('Resend API error', response.status, bodyText)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}