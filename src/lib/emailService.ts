import { supabase } from '@/integrations/supabase/client'

/**
 * Service for sending notifications with language support
 * Automatically detects user language from their profile
 */

export interface NotificationRequest {
  event: 'registration' | 'order_placed' | 'order_status_update' | 'quote_request' | 'quote_approved'
  userId: string
  orderId?: string
  quoteId?: string
}

/**
 * Detect user language from profile or localStorage
 */
export async function getUserLanguage(userId: string): Promise<string> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('language')
      .eq('user_id', userId)
      .single()

    if (error || !profile) {
      // Fallback to localStorage
      return localStorage.getItem('userLanguage') || 'en'
    }

    return profile.language || 'en'
  } catch (error) {
    console.error('Error fetching user language:', error)
    return localStorage.getItem('userLanguage') || 'en'
  }
}

/**
 * Set user language preference
 */
export async function setUserLanguage(userId: string, language: 'en' | 'ar'): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ language })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating language preference:', error)
      throw error
    }

    // Also save to localStorage as backup
    localStorage.setItem('userLanguage', language)
  } catch (error) {
    console.error('Error in setUserLanguage:', error)
    throw error
  }
}

/**
 * Send notification via Supabase Edge Function with language support
 */
export async function sendNotification(request: NotificationRequest): Promise<any> {
  try {
    // Get user language
    const language = await getUserLanguage(request.userId)

    // Call the edge function with language parameter
    const response = await supabase.functions.invoke('generate-notification', {
      body: {
        ...request,
        language
      }
    })

    if (response.error) {
      throw new Error(response.error.message || 'Failed to send notification')
    }

    return response.data
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}

/**
 * Send order confirmation email (automatically in user's language)
 */
export async function sendOrderConfirmation(userId: string, orderId: string): Promise<void> {
  return sendNotification({
    event: 'order_placed',
    userId,
    orderId
  })
}

/**
 * Send order status update email (automatically in user's language)
 */
export async function sendOrderStatusUpdate(userId: string, orderId: string): Promise<void> {
  return sendNotification({
    event: 'order_status_update',
    userId,
    orderId
  })
}

/**
 * Send quote request confirmation (automatically in user's language)
 */
export async function sendQuoteRequestConfirmation(userId: string, quoteId: string): Promise<void> {
  return sendNotification({
    event: 'quote_request',
    userId,
    quoteId
  })
}

/**
 * Send quote approval notification (automatically in user's language)
 */
export async function sendQuoteApproval(userId: string, quoteId: string): Promise<void> {
  return sendNotification({
    event: 'quote_approved',
    userId,
    quoteId
  })
}

/**
 * Get localized status text
 */
export const localizedStatuses = {
  en: {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    responded: 'Responded',
    approved: 'Approved'
  },
  ar: {
    pending: 'قيد الانتظار',
    processing: 'قيد المعالجة',
    shipped: 'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
    responded: 'تم الرد',
    approved: 'تم الموافقة'
  }
}

/**
 * Translate status text based on language
 */
export function translateStatus(status: string, language: 'en' | 'ar' = 'en'): string {
  return localizedStatuses[language][status as keyof typeof localizedStatuses.en] || status
}
