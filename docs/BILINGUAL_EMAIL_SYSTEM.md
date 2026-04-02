# Bilingual Email & Invoice System Documentation

## Overview

The Nyalix system now includes comprehensive bilingual support for all emails and invoices in English and Arabic. The system automatically detects the user's language preference and sends all communications (emails, WhatsApp messages, and invoices) in the appropriate language with proper RTL/LTR formatting.

## Features

✅ **Language-Based Email Sending**
- Automatically detects user's selected language (English or Arabic)
- Default to English if no preference is set
- Language stored in user profile

✅ **Dynamic Email Templates**
- Separate bilingual templates for each email type
- Centralized translation system using `emailTemplates.ts`
- Automatic template selection based on user language

✅ **Full Arabic Translation**
- Complete Arabic translation of all email content:
  - Subject lines
  - Headings and body text
  - Buttons and status labels
- Native Arabic formatting

✅ **RTL/LTR Support**
- Arabic emails automatically use:
  - `dir="rtl"` HTML attribute
  - Right-aligned text
  - Proper table and layout formatting
- English emails use LTR (left-to-right) formatting

✅ **Invoice Localization**
- English invoices: LTR layout
- Arabic invoices: RTL layout
- All labels and headings translated
- Proper number and date formatting by locale

✅ **Multiple Communication Channels**
- Email: HTML formatted with translations
- WhatsApp: Text messages with emoji indicators
- Invoices: HTML/PDF with bilingual support

## Architecture

### Files & Structure

```
/workspaces/nyalix/
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   │   └── emailTemplates.ts          # Bilingual email templates
│   │   └── generate-notification/
│   │       └── index.ts                   # Updated to use new templates
│   └── migrations/
│       └── 20260402_add_language_to_profiles.sql
├── src/
│   └── lib/
│       ├── emailService.ts                # Frontend email service
│       └── invoiceGenerator.ts            # Bilingual invoice generator
└── docs/
    └── BILINGUAL_EMAIL_SYSTEM.md          # This file
```

### Database Schema

**Profiles Table** - Added language field:
```sql
ALTER TABLE profiles ADD COLUMN language TEXT DEFAULT 'en' NOT NULL;
ALTER TABLE profiles ADD CONSTRAINT valid_language CHECK (language IN ('en', 'ar'));
```

## Usage Guide

### 1. Setting User Language

```typescript
import { setUserLanguage, getUserLanguage } from '@/lib/emailService'

// Set user language to Arabic
await setUserLanguage(userId, 'ar')

// Set user language to English
await setUserLanguage(userId, 'en')

// Get user's current language
const language = await getUserLanguage(userId)
```

### 2. Sending Email Notifications

```typescript
import { 
  sendOrderConfirmation, 
  sendOrderStatusUpdate,
  sendNotification 
} from '@/lib/emailService'

// Send order confirmation (automatically in user's language)
await sendOrderConfirmation(userId, orderId)

// Send order status update
await sendOrderStatusUpdate(userId, orderId)

// Send custom notification with any event type
await sendNotification({
  event: 'order_placed',
  userId: userId,
  orderId: orderId
})
```

### 3. Working with Invoices

```typescript
import { generateHTMLInvoice, downloadInvoiceAsHTML } from '@/lib/invoiceGenerator'

const invoiceData = {
  id: 'INV-001',
  created_at: new Date().toISOString(),
  total: 1500.00,
  shipping_name: 'John Doe',
  shipping_address: '123 Main St',
  shipping_city: 'Cairo',
  shipping_country: 'Egypt',
  shipping_phone: '+20123456789',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  language: 'ar', // or 'en'
  order_items: [
    {
      product_name: 'Medical Equipment X',
      quantity: 2,
      price: 750.00
    }
  ]
}

// Generate HTML invoice
const html = generateHTMLInvoice(invoiceData)

// Download invoice
downloadInvoiceAsHTML(invoiceData)
```

### 4. Translating Status Text

```typescript
import { translateStatus } from '@/lib/emailService'

// Translate status to user's language
const userLanguage = await getUserLanguage(userId)
const translatedStatus = translateStatus('pending', userLanguage)
// Output: "قيد الانتظار" (if Arabic) or "Pending" (if English)
```

## Email Templates

### Available Email Types

#### 1. **Welcome Email** (`registration` event)
- Sent when user registers
- Contains account confirmation and catalog introduction
- **EN Subject:** "Welcome to Nyalix Medical PVT LTD!"
- **AR Subject:** "مرحبا بك في Nyalix المتخصصة الطبية!"

#### 2. **Order Confirmation Email** (`order_placed` event)
- Sent when order is placed
- Includes invoice details and item breakdown
- **EN Subject:** "Order Confirmation - [Order ID]"
- **AR Subject:** "تأكيد الطلب - [Order ID]"

#### 3. **Order Status Update Email** (`order_status_update` event)
- Sent when order status changes
- Updated status with explanatory message
- **EN Subject:** "Order Status Update - [Order ID]"
- **AR Subject:** "تحديث حالة الطلب - [Order ID]"

#### 4. **Quote Request Confirmation** (`quote_request` event)
- Confirmation that quote request was received
- **EN Subject:** "New Quote Request Received"
- **AR Subject:** "تم استقبال طلب عرض أسعار جديد"

#### 5. **Quote Approval & Invoice** (`quote_approved` event)
- Sent when quote is approved
- Invoice is ready for download
- **EN Subject:** "Quote Approved & Invoice Ready"
- **AR Subject:** "تم الموافقة على العرض والفاتورة جاهزة"

## Status Translations

All order statuses are automatically translated:

| English | Arabic |
|---------|--------|
| Pending | قيد الانتظار |
| Processing | قيد المعالجة |
| Shipped | تم الشحن |
| Delivered | تم التسليم |
| Cancelled | ملغي |
| Responded | تم الرد |
| Approved | تم الموافقة |

## WhatsApp Messages

WhatsApp notifications are also bilingual with emoji indicators:

**English:**
```
🛍️ *Order Confirmation*

Order ID: ORD-123
Items: Product x2, Product x1
Total: $1,500.00
Thank you for shopping with Nyalix Global Care!
```

**Arabic:**
```
🛍️ *تأكيد الطلب*

رقم الطلب: ORD-123
العناصر: المنتج x2, المنتج x1
الإجمالي: $1,500.00
شكراً لتسوقك معنا!
```

## Invoice Features

### RTL Layout for Arabic
- All text and numbers align to the right
- Table columns properly ordered
- Date formatting according to locale
- Proper direction for company information

### Customizable Invoice Data
```typescript
interface InvoiceData {
  id: string                    // Invoice/Order ID
  created_at: string           // ISO date string
  total: number                // Total amount
  shipping_name: string
  shipping_address?: string
  shipping_city?: string
  shipping_country: string
  shipping_phone?: string
  shipping_email?: string
  order_items?: InvoiceItem[]
  customerName: string
  customerEmail: string
  language: 'en' | 'ar'
}
```

## Backend Integration

### Supabase Edge Function

The `generate-notification` edge function automatically:
1. Retrieves user's language from profile
2. Selects appropriate email template
3. Generates HTML email with correct direction (RTL/LTR)
4. Queues for email service

**Example Call:**
```typescript
const response = await supabase.functions.invoke('generate-notification', {
  body: {
    event: 'order_placed',
    userId: user.id,
    orderId: orderId,
    language: 'ar'  // Automatically detected from profile
  }
})
```

## Fallback Handling

The system implements smart fallback strategies:

1. **No Language Set:** Defaults to English
2. **Invalid Language:** Falls back to English
3. **Profile Not Found:** Uses localStorage or browser language
4. **Email Generation Failure:** Logs error and retry available

```typescript
// Example: Smart fallback in emailService
try {
  const language = await getUserLanguage(userId)
  return language || 'en'
} catch (error) {
  console.error('Error fetching language:', error)
  return localStorage.getItem('userLanguage') || 'en'
}
```

## Adding New Translations

To add new email content or translations:

1. **Update `emailTemplates.ts`:**
```typescript
const translations = {
  en: {
    newKey: 'English text',
    // ... other translations
  },
  ar: {
    newKey: 'النص العربي',
    // ... other translations
  }
}
```

2. **Use in Template:**
```typescript
const text = getTranslation(lang, 'newKey')
```

## Testing

### Test Checklist

- [ ] User can set language preference
- [ ] Welcome email reads language from profile
- [ ] Order confirmation email displays correct language
- [ ] Status update email in user's language
- [ ] Arabic emails render with RTL layout
- [ ] Invoice displays in correct language
- [ ] WhatsApp messages translated correctly
- [ ] All status values translated
- [ ] Fallback to English when no language set
- [ ] Email templates render without errors

### Manual Testing Steps

1. **Create test user with Arabic:**
```typescript
// Set language to Arabic
await setUserLanguage(testUserId, 'ar')

// Trigger order confirmation
await sendOrderConfirmation(testUserId, testOrderId)
```

2. **Verify email contains:**
   - Arabic subject line
   - RTL direction in HTML
   - Arabic text in all fields
   - Right-aligned table content

3. **Check invoice:**
```typescript
const invoice = {
  ...invoiceData,
  language: 'ar'
}
const html = generateHTMLInvoice(invoice)
// Verify dir="rtl" and text-align: right
```

## Performance Considerations

- Templates are cached at function load time
- Language detection uses simple string comparison
- No additional API calls beyond user profile fetch
- Email generation is synchronous (< 100ms)

## Security Considerations

- User language stored in profiles (PII - encrypted at rest)
- Email templates don't contain sensitive data
- Invoice generation happens server-side before sending
- All user input in emails is sanitized

## Troubleshooting

### Issue: Emails in Wrong Language

**Solution:** Verify user language in profiles table
```sql
SELECT user_id, language FROM profiles WHERE user_id = 'USER_ID';
```

### Issue: Arabic Text Not RTL

**Solution:** Check HTML includes `dir="rtl"` attribute
```html
<html dir="rtl">
```

### Issue: Invoice Table Misaligned

**Solution:** Ensure `text-align: right` for Arabic invoices
```css
.items-table td { text-align: right; } /* for Arabic */
```

### Issue: Special Characters Not Displaying

**Solution:** Verify `<meta charset="UTF-8">` in email templates

## Future Enhancements

- [ ] Support for additional languages (French, Spanish, etc.)
- [ ] PDF invoice generation with proper font support for Arabic
- [ ] Email template customization per company
- [ ] A/B testing for email variations
- [ ] Email delivery tracking and analytics
- [ ] SMS notifications with translation
- [ ] Email signature localization
- [ ] Currency localization (not just USD)

## Support

For issues or questions:
1. Check email templates in `_shared/emailTemplates.ts`
2. Review user language in profiles table
3. Check browser console for errors
4. Verify Supabase Edge Function logs
5. Test with hardcoded language values

---

**Last Updated:** April 2, 2026
**Version:** 1.0
**Maintainer:** Development Team
