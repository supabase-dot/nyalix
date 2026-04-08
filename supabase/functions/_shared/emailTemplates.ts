interface ProfileRecord {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string | null
  country?: string | null
  language?: string
}

interface OrderItem {
  product_name: string
  quantity: number
  price: number
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
  order_items?: OrderItem[]
}

interface QuoteRecord {
  id: string
  created_at: string
  full_name: string
  email: string
  company: string
  products: string
  quantity: string
  budget?: string
  notes?: string
}

// Status translations
const statusTranslations = {
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

const translations = {
  en: {
    welcomeEmailSubject: 'Welcome to Nyalix Medical PVT LTD!',
    welcomeEmailTitle: 'Welcome to Our Platform!',
    welcomeEmailGreeting: 'Dear',
    welcomeEmailMessage: 'Thank you for registering with Nyalix Medical PVT LTD! We\'re excited to have you as part of our community.',
    welcomeEmailDetails: 'Your account has been successfully created with the following details:',
    welcomeEmailName: 'Name',
    welcomeEmailEmail: 'Email',
    welcomeEmailCountry: 'Country',
    welcomeEmailNotSpecified: 'Not specified',
    welcomeEmailCatalog: 'You can now browse our catalog of medical equipment and place orders.',
    welcomeEmailQuestions: 'If you have any questions, please contact us at',
    orderConfirmationSubject: 'Order Confirmation',
    orderConfirmationTitle: 'Order Invoice',
    orderConfirmationOrderId: 'Order ID',
    orderConfirmationCustomer: 'Customer',
    orderConfirmationOrderDate: 'Order Date',
    orderConfirmationShippingDetails: 'Shipping Details',
    orderConfirmationOrderItems: 'Order Items',
    orderConfirmationProduct: 'Product',
    orderConfirmationQuantity: 'Quantity',
    orderConfirmationPrice: 'Price',
    orderConfirmationTotal: 'Total',
    orderConfirmationTotalAmount: 'Total Amount',
    orderConfirmationEmail: 'Email',
    phone: 'Phone',
    orderConfirmationThankYou: 'Thank you for your business!',
    statusUpdateSubject: 'Order Status Update',
    statusUpdateTitle: 'Order Status Update',
    statusUpdateGreeting: 'Dear',
    statusUpdateStatus: 'Status',
    statusUpdateProcessing: 'Your order is being processed.',
    statusUpdatePrepared: 'Your order is being prepared for shipment.',
    statusUpdateShipped: 'Your order has been shipped.',
    statusUpdateDelivered: 'Your order has been delivered.',
    statusUpdateCancelled: 'Your order has been cancelled.',
    statusUpdateContact: 'If you have any questions, please contact our support team at',
    quoteRequestSubject: 'New Quote Request Received',
    quoteRequestTitle: 'Quote Request Confirmation',
    quoteRequestThankYou: 'Thank you for your quote request!',
    quoteRequestReceived: 'We have received your quote request and will contact you shortly.',
    quoteApprovalSubject: 'Quote Approved & Invoice Ready',
    quoteApprovalTitle: 'Your Quote Has Been Approved',
    quoteApprovalInvoiceReady: 'Your quote has been approved. Please find your invoice attached.',
    companyName: 'Nyalix Medical PVT LTD',
    copyright: '© 2026 Nyalix Medical PVT LTD. All rights reserved.',
    autoMessage: 'This is an automated message. Please do not reply to this email.',
    contactEmail: 'info@nyalix.com'
  },
  ar: {
    welcomeEmailSubject: 'مرحبا بك في Nyalix المتخصصة الطبية!',
    welcomeEmailTitle: 'مرحبا بك في منصتنا!',
    welcomeEmailGreeting: 'عزيزي',
    welcomeEmailMessage: 'شكراً لتسجيلك مع Nyalix المتخصصة الطبية! نحن متحمسون لوجودك معنا.',
    welcomeEmailDetails: 'تم إنشاء حسابك بنجاح ببيانات :',
    welcomeEmailName: 'الاسم',
    welcomeEmailEmail: 'البريد الإلكتروني',
    welcomeEmailCountry: 'الدولة',
    welcomeEmailNotSpecified: 'غير محدد',
    welcomeEmailCatalog: 'يمكنك الآن استعراض كاتالوجنا من المعدات الطبية وتقديم الطلبات.',
    welcomeEmailQuestions: 'إذا كان لديك أي أسئلة، يرجى التواصل معنا على',
    orderConfirmationSubject: 'تأكيد الطلب',
    orderConfirmationTitle: 'فاتورة الطلب',
    orderConfirmationOrderId: 'رقم الطلب',
    orderConfirmationCustomer: 'العميل',
    orderConfirmationOrderDate: 'تاريخ الطلب',
    orderConfirmationShippingDetails: 'تفاصيل الشحن',
    orderConfirmationOrderItems: 'عناصر الطلب',
    orderConfirmationProduct: 'المنتج',
    orderConfirmationQuantity: 'الكمية',
    orderConfirmationPrice: 'السعر',
    orderConfirmationTotal: 'المجموع',
    orderConfirmationTotalAmount: 'المبلغ الإجمالي',
    orderConfirmationEmail: 'البريد الإلكتروني',
    phone: 'الهاتف',
    orderConfirmationThankYou: 'شكراً لتعاملك معنا!',
    statusUpdateSubject: 'تحديث حالة الطلب',
    statusUpdateTitle: 'تحديث حالة الطلب',
    statusUpdateGreeting: 'عزيزي',
    statusUpdateStatus: 'الحالة',
    statusUpdateProcessing: 'جاري معالجة طلبك.',
    statusUpdatePrepared: 'جاري تحضير طلبك للشحن.',
    statusUpdateShipped: 'تم شحن طلبك.',
    statusUpdateDelivered: 'تم تسليم طلبك.',
    statusUpdateCancelled: 'تم إلغاء طلبك.',
    statusUpdateContact: 'إذا كان لديك أي أسئلة، يرجى التواصل مع فريق الدعم لدينا على',
    quoteRequestSubject: 'تم استقبال طلب عرض أسعار جديد',
    quoteRequestTitle: 'تأكيد طلب العرض',
    quoteRequestThankYou: 'شكراً لطلبك عرض السعر!',
    quoteRequestReceived: 'تم استقبال طلب عرض السعر الخاص بك وسنتصل بك قريباً.',
    quoteApprovalSubject: 'تم الموافقة على العرض والفاتورة جاهزة',
    quoteApprovalTitle: 'تمت الموافقة على عرضك',
    quoteApprovalInvoiceReady: 'تمت الموافقة على عرضك. يرجى العثور على فاتورتك في المرفق.',
    companyName: 'Nyalix المتخصصة الطبية',
    copyright: '© 2026 Nyalix المتخصصة الطبية. جميع الحقوق محفوظة.',
    autoMessage: 'هذه رسالة آلية. يرجى عدم الرد على هذا البريد الإلكتروني.',
    contactEmail: 'info@nyalix.com'
  }
}

function getTranslation(language: string, key: string): string {
  const lang = language === 'ar' ? 'ar' : 'en'
  return (translations[lang as keyof typeof translations] as any)[key] || key
}

function getStatusTranslation(language: string, status: string): string {
  const lang = language === 'ar' ? 'ar' : 'en'
  return statusTranslations[lang as keyof typeof statusTranslations][status as keyof typeof statusTranslations.en] || status
}

function getHTMLDirection(language: string): string {
  return language === 'ar' ? 'rtl' : 'ltr'
}

function getTextAlign(language: string): string {
  return language === 'ar' ? 'right' : 'left'
}

function getTableAlign(language: string): string {
  return language === 'ar' ? 'text-align: right;' : 'text-align: left;'
}

export function generateWelcomeEmail(profile: ProfileRecord): string {
  const lang = profile.language || 'en'
  const direction = getHTMLDirection(lang)
  const textAlign = getTextAlign(lang)

  return `
    <!DOCTYPE html>
    <html dir="${direction}">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; direction: ${direction}; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: ${textAlign}; }
        .content { padding: 20px; direction: ${direction}; }
        .footer { background-color: #f8f9fa; padding: 10px; text-align: ${textAlign}; font-size: 12px; }
        ul { text-align: ${textAlign}; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="color: #17455a; margin: 0;">${getTranslation(lang, 'companyName')}</h1>
        <h2 style="color: #666; margin: 5px 0 0 0; font-size: 16px;">${getTranslation(lang, 'welcomeEmailTitle')}</h2>
      </div>
      <div class="content">
        <h2>${getTranslation(lang, 'welcomeEmailGreeting')} ${profile.full_name},</h2>
        <p>${getTranslation(lang, 'welcomeEmailMessage')}</p>
        <p>${getTranslation(lang, 'welcomeEmailDetails')}</p>
        <ul>
          <li><strong>${getTranslation(lang, 'welcomeEmailName')}:</strong> ${profile.full_name}</li>
          <li><strong>${getTranslation(lang, 'welcomeEmailEmail')}:</strong> ${profile.email}</li>
          <li><strong>${getTranslation(lang, 'welcomeEmailCountry')}:</strong> ${profile.country || getTranslation(lang, 'welcomeEmailNotSpecified')}</li>
        </ul>
        <p>${getTranslation(lang, 'welcomeEmailCatalog')}</p>
        <p>${getTranslation(lang, 'welcomeEmailQuestions')} ${getTranslation(lang, 'contactEmail')}</p>
      </div>
      <div class="footer">
        <p>${getTranslation(lang, 'copyright')}</p>
        <p>${getTranslation(lang, 'autoMessage')}</p>
      </div>
    </body>
    </html>
  `
}

export function generateInvoiceEmail(profile: ProfileRecord, order: OrderRecord): string {
  const lang = profile.language || 'en'
  const direction = getHTMLDirection(lang)
  const textAlign = getTextAlign(lang)
  
  const itemsHtml = order.order_items?.map((item: OrderItem) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px; ${getTableAlign(lang)}">${item.product_name}</td>
      <td style="border: 1px solid #ddd; padding: 8px; ${getTableAlign(lang)}">${item.quantity}</td>
      <td style="border: 1px solid #ddd; padding: 8px; ${getTableAlign(lang)}">$${item.price}</td>
      <td style="border: 1px solid #ddd; padding: 8px; ${getTableAlign(lang)}">$${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `).join('') ?? ''

  return `
    <!DOCTYPE html>
    <html dir="${direction}">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; direction: ${direction}; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: ${textAlign}; }
        .content { padding: 20px; direction: ${direction}; }
        .invoice-table { width: 100%; border-collapse: collapse; }
        .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; }
        .invoice-table th { background-color: #f2f2f2; text-align: ${textAlign}; }
        .total { font-weight: bold; text-align: ${textAlign}; }
        .footer { background-color: #f8f9fa; padding: 10px; text-align: ${textAlign}; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="color: #17455a; margin: 0;">${getTranslation(lang, 'companyName')}</h1>
        <h2 style="color: #666; margin: 5px 0 0 0; font-size: 16px;">${getTranslation(lang, 'orderConfirmationTitle')}</h2>
      </div>
      <div class="content">
        <h2>${getTranslation(lang, 'orderConfirmationOrderId')}: ${order.id}</h2>
        <p><strong>${getTranslation(lang, 'orderConfirmationCustomer')}:</strong> ${profile.full_name}</p>
        <p><strong>${getTranslation(lang, 'orderConfirmationEmail')}:</strong> ${profile.email}</p>
        <p><strong>${getTranslation(lang, 'orderConfirmationOrderDate')}:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
        
        <h3>${getTranslation(lang, 'orderConfirmationShippingDetails')}:</h3>
        <p>${order.shipping_name}<br>
        ${order.shipping_address}<br>
        ${order.shipping_city}, ${order.shipping_country}<br>
        ${getTranslation(lang, 'phone')}: ${order.shipping_phone}</p>
        
        <h3>${getTranslation(lang, 'orderConfirmationOrderItems')}:</h3>
        <table class="invoice-table">
          <thead>
            <tr>
              <th>${getTranslation(lang, 'orderConfirmationProduct')}</th>
              <th>${getTranslation(lang, 'orderConfirmationQuantity')}</th>
              <th>${getTranslation(lang, 'orderConfirmationPrice')}</th>
              <th>${getTranslation(lang, 'orderConfirmationTotal')}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="3" style="border: 1px solid #ddd; padding: 8px;">${getTranslation(lang, 'orderConfirmationTotalAmount')}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">$${order.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        
        <p>${getTranslation(lang, 'orderConfirmationThankYou')}</p>
        <p>${getTranslation(lang, 'welcomeEmailQuestions')} ${getTranslation(lang, 'contactEmail')}</p>
      </div>
      <div class="footer">
        <p>${getTranslation(lang, 'copyright')}</p>
        <p>${getTranslation(lang, 'autoMessage')}</p>
      </div>
    </body>
    </html>
  `
}

export function generateStatusUpdateEmail(profile: ProfileRecord, order: OrderRecord): string {
  const lang = profile.language || 'en'
  const direction = getHTMLDirection(lang)
  const textAlign = getTextAlign(lang)

  const statusMessageMap = {
    en: {
      pending: getTranslation(lang, 'statusUpdateProcessing'),
      processing: getTranslation(lang, 'statusUpdatePrepared'),
      shipped: getTranslation(lang, 'statusUpdateShipped'),
      delivered: getTranslation(lang, 'statusUpdateDelivered'),
      cancelled: getTranslation(lang, 'statusUpdateCancelled')
    },
    ar: {
      pending: getTranslation(lang, 'statusUpdateProcessing'),
      processing: getTranslation(lang, 'statusUpdatePrepared'),
      shipped: getTranslation(lang, 'statusUpdateShipped'),
      delivered: getTranslation(lang, 'statusUpdateDelivered'),
      cancelled: getTranslation(lang, 'statusUpdateCancelled')
    }
  }

  return `
    <!DOCTYPE html>
    <html dir="${direction}">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; direction: ${direction}; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: ${textAlign}; }
        .content { padding: 20px; direction: ${direction}; }
        .status { font-size: 18px; font-weight: bold; color: #007bff; text-align: ${textAlign}; }
        .footer { background-color: #f8f9fa; padding: 10px; text-align: ${textAlign}; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="color: #17455a; margin: 0;">${getTranslation(lang, 'companyName')}</h1>
        <h2 style="color: #666; margin: 5px 0 0 0; font-size: 16px;">${getTranslation(lang, 'statusUpdateTitle')}</h2>
      </div>
      <div class="content">
        <h2>${getTranslation(lang, 'orderConfirmationOrderId')}: ${order.id}</h2>
        <p>${getTranslation(lang, 'statusUpdateGreeting')} ${profile.full_name},</p>
        <p class="status">${getTranslation(lang, 'statusUpdateStatus')}: ${getStatusTranslation(lang, order.status)}</p>
        <p>${statusMessageMap[lang as keyof typeof statusMessageMap][order.status as keyof typeof statusMessageMap.en] || ''}</p>
        <p>${getTranslation(lang, 'statusUpdateContact')} ${getTranslation(lang, 'contactEmail')}</p>
      </div>
      <div class="footer">
        <p>${getTranslation(lang, 'copyright')}</p>
        <p>${getTranslation(lang, 'autoMessage')}</p>
      </div>
    </body>
    </html>
  `
}

export function generateQuoteRequestEmail(profile: ProfileRecord, quote: QuoteRecord): string {
  const lang = profile.language || 'en'
  const direction = getHTMLDirection(lang)
  const textAlign = getTextAlign(lang)

  return `
    <!DOCTYPE html>
    <html dir="${direction}">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; direction: ${direction}; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: ${textAlign}; }
        .content { padding: 20px; direction: ${direction}; }
        .footer { background-color: #f8f9fa; padding: 10px; text-align: ${textAlign}; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="color: #17455a; margin: 0;">${getTranslation(lang, 'companyName')}</h1>
        <h2 style="color: #666; margin: 5px 0 0 0; font-size: 16px;">${getTranslation(lang, 'quoteRequestTitle')}</h2>
      </div>
      <div class="content">
        <h2>${getTranslation(lang, 'quoteRequestThankYou')}</h2>
        <p>${getTranslation(lang, 'quoteRequestReceived')}</p>
        <p>${getTranslation(lang, 'welcomeEmailQuestions')} ${getTranslation(lang, 'contactEmail')}</p>
      </div>
      <div class="footer">
        <p>${getTranslation(lang, 'copyright')}</p>
        <p>${getTranslation(lang, 'autoMessage')}</p>
      </div>
    </body>
    </html>
  `
}

export function generateQuoteApprovalEmail(profile: ProfileRecord, quote: QuoteRecord): string {
  const lang = profile.language || 'en'
  const direction = getHTMLDirection(lang)
  const textAlign = getTextAlign(lang)

  return `
    <!DOCTYPE html>
    <html dir="${direction}">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; direction: ${direction}; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: ${textAlign}; }
        .content { padding: 20px; direction: ${direction}; }
        .footer { background-color: #f8f9fa; padding: 10px; text-align: ${textAlign}; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="color: #17455a; margin: 0;">${getTranslation(lang, 'companyName')}</h1>
        <h2 style="color: #666; margin: 5px 0 0 0; font-size: 16px;">${getTranslation(lang, 'quoteApprovalTitle')}</h2>
      </div>
      <div class="content">
        <h2>${getTranslation(lang, 'quoteApprovalInvoiceReady')}</h2>
        <p>${getTranslation(lang, 'welcomeEmailQuestions')} ${getTranslation(lang, 'contactEmail')}</p>
      </div>
      <div class="footer">
        <p>${getTranslation(lang, 'copyright')}</p>
        <p>${getTranslation(lang, 'autoMessage')}</p>
      </div>
    </body>
    </html>
  `
}

export function generateInvoiceWhatsApp(profile: ProfileRecord, order: OrderRecord): string {
  const lang = profile.language || 'en'
  const itemsText = order.order_items?.map((item: OrderItem) => 
    `${item.product_name} x${item.quantity} - $${(item.quantity * item.price).toFixed(2)}`
  ).join('\n') ?? ''

  if (lang === 'ar') {
    return `🛍️ *تأكيد الطلب*\n\nرقم الطلب: ${order.id}\n\nالعناصر:\n${itemsText}\n\nالإجمالي: $${order.total.toFixed(2)}\n\nالشحن إلى: ${order.shipping_name}, ${order.shipping_address}, ${order.shipping_city}\n\nشكراً لتسوقك معنا!`
  }

  return `🛍️ *Order Confirmation*\n\nOrder ID: ${order.id}\n\nItems:\n${itemsText}\n\nTotal: $${order.total.toFixed(2)}\n\nShipping to: ${order.shipping_name}, ${order.shipping_address}, ${order.shipping_city}\n\nThank you for shopping with Nyalix Global Care!`
}

export function generateStatusUpdateWhatsApp(profile: ProfileRecord, order: OrderRecord): string {
  const lang = profile.language || 'en'
  const translatedStatus = getStatusTranslation(lang, order.status)

  const statusMessages = {
    en: {
      pending: 'Your order is being processed.',
      processing: 'Your order is being prepared for shipment.',
      shipped: 'Your order has been shipped.',
      delivered: 'Your order has been delivered.',
      cancelled: 'Your order has been cancelled.'
    },
    ar: {
      pending: 'جاري معالجة طلبك.',
      processing: 'جاري تحضير طلبك للشحن.',
      shipped: 'تم شحن طلبك.',
      delivered: 'تم تسليم طلبك.',
      cancelled: 'تم إلغاء طلبك.'
    }
  }

  const message = statusMessages[lang as keyof typeof statusMessages][order.status as keyof typeof statusMessages.en] || ''
  
  if (lang === 'ar') {
    return `📦 *تحديث حالة الطلب*\n\nرقم الطلب: ${order.id}\n\nالحالة: ${translatedStatus}\n\n${message}\n\nشكراً لاختيارك Nyalix!`
  }

  return `📦 *Order Status Update*\n\nOrder ID: ${order.id}\n\nStatus: ${translatedStatus}\n\n${message}\n\nThank you for choosing Nyalix Global Care!`
}

export function generateQuoteRequestWhatsApp(quote: QuoteRecord): string {
  return `📋 *Quote Request Received*\n\nCompany: ${quote.company}\n\nProducts: ${quote.products}\n\nQuantity: ${quote.quantity}\n\nWe will contact you shortly!`
}

export function generateQuoteRequestWhatsAppArabic(quote: QuoteRecord): string {
  return `📋 *تم استقبال طلب العرض*\n\nالشركة: ${quote.company}\n\nالمنتجات: ${quote.products}\n\nالكمية: ${quote.quantity}\n\nسنتصل بك قريباً!`
}

export { getTranslation, getStatusTranslation, getHTMLDirection, getTextAlign }
