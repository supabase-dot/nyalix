import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface NotificationRequest {
  type: 'email' | 'whatsapp'
  event: 'registration' | 'order_placed' | 'order_status_update'
  recipient: string
  subject?: string
  message: string
  orderId?: string
  userId?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? undefined
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      authHeader
        ? {
            global: {
              headers: { Authorization: authHeader },
            },
          }
        : undefined
    )

    const { type, event, recipient, subject, message, orderId, userId }: NotificationRequest = await req.json()

    let success = false
    let errorMessage = ''

    if (type === 'email') {
      if (!subject) {
        throw new Error('Missing "subject" for email notification')
      }
      success = await sendEmail(recipient, subject, message)
    } else if (type === 'whatsapp') {
      success = await sendWhatsApp(recipient, message)
    }

    if (!success) {
      errorMessage = 'Failed to send notification'
    }

    // Log the notification
    const { error } = await supabaseClient
      .from('notifications')
      .insert({
        type,
        event,
        recipient,
        subject,
        message,
        order_id: orderId,
        user_id: userId,
        status: success ? 'sent' : 'failed',
        error_message: errorMessage
      })

    if (error) {
      console.error('Error logging notification:', error)
    }

    return new Response(
      JSON.stringify({ success }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: success ? 200 : 500
      }
    )
  } catch (error) {
    console.error('Error in send-notification function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

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
        from: 'Nyalix Medical PVT LTD <info@nyalixmed.com>',
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

async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

  if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
    console.error('Twilio credentials not set')
    return false
  }

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: `whatsapp:${twilioWhatsAppNumber}`,
        To: `whatsapp:${to}`,
        Body: message
      })
    })

    return response.ok
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return false
  }
}
