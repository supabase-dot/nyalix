/**
 * Bilingual Invoice Generator with RTL Support
 * Generates PDF or HTML invoices in English (LTR) and Arabic (RTL)
 */

interface InvoiceItem {
  product_name: string
  quantity: number
  price: number
}

interface InvoiceData {
  id: string
  created_at: string
  total: number
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

const invoiceTranslations = {
  en: {
    invoice: 'Invoice',
    invoiceNumber: 'Invoice Number',
    invoiceDate: 'Invoice Date',
    billTo: 'Bill To',
    shipTo: 'Ship To',
    description: 'Description',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Tax (if applicable)',
    shippingFee: 'Shipping Fee',
    totalAmount: 'Total Amount',
    currency: 'USD',
    thankyouMessage: 'Thank you for your business!',
    paymentTerms: 'Payment Terms',
    dueDate: 'Due Date',
    notes: 'Notes',
    companyName: 'Nyalix Medical PVT LTD',
    companyEmail: 'info@nyalix.com',
    companyPhone: '+1234567890',
    paymentMethodDue: 'Due upon receipt',
    footer: '© 2026 Nyalix Medical PVT LTD. All rights reserved.'
  },
  ar: {
    invoice: 'الفاتورة',
    invoiceNumber: 'رقم الفاتورة',
    invoiceDate: 'تاريخ الفاتورة',
    billTo: 'الفاتورة إلى',
    shipTo: 'الشحن إلى',
    description: 'الوصف',
    quantity: 'الكمية',
    unitPrice: 'سعر الوحدة',
    total: 'المجموع',
    subtotal: 'الإجمالي الفرعي',
    tax: 'الضريبة (إن وجدت)',
    shippingFee: 'رسوم الشحن',
    totalAmount: 'المبلغ الإجمالي',
    currency: 'دولار أمريكي',
    thankyouMessage: 'شكراً لتعاملك معنا!',
    paymentTerms: 'شروط الدفع',
    dueDate: 'تاريخ الاستحقاق',
    notes: 'ملاحظات',
    companyName: 'Nyalix المتخصصة الطبية',
    companyEmail: 'info@nyalix.com',
    companyPhone: '+1234567890',
    paymentMethodDue: 'الدفع عند الاستلام',
    footer: '© 2026 Nyalix المتخصصة الطبية. جميع الحقوق محفوظة.'
  }
}

/**
 * Generate HTML invoice with language and RTL/LTR support
 */
export function generateHTMLInvoice(data: InvoiceData): string {
  const lang = data.language || 'en'
  const isRTL = lang === 'ar'
  const t = invoiceTranslations[lang]
  const direction = isRTL ? 'rtl' : 'ltr'
  const textAlign = isRTL ? 'right' : 'left'
  const tableAlign = isRTL ? 'right' : 'left'

  const subtotal = data.order_items?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0
  const formattedDate = new Date(data.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')

  const itemsHtml = (data.order_items || []).map(item => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 12px; text-align: ${tableAlign};">${item.product_name}</td>
      <td style="border: 1px solid #ddd; padding: 12px; text-align: ${tableAlign};">${item.quantity}</td>
      <td style="border: 1px solid #ddd; padding: 12px; text-align: ${tableAlign};">$${item.price.toFixed(2)}</td>
      <td style="border: 1px solid #ddd; padding: 12px; text-align: ${tableAlign}; font-weight: bold;">$${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html dir="${direction}" lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.invoice} #${data.id}</title>
      <style>
        body {
          font-family: 'Arial', 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #333;
          direction: ${direction};
          text-align: ${textAlign};
        }
        .invoice-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px;
          background: #fff;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #17455a;
          flex-direction: ${isRTL ? 'row-reverse' : 'row'};
        }
        .company-info h1 {
          color: #17455a;
          margin: 0;
          font-size: 28px;
        }
        .invoice-title {
          text-align: ${textAlign};
        }
        .invoice-title h2 {
          color: #17455a;
          margin: 0;
          font-size: 24px;
        }
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .detail-section h3 {
          color: #17455a;
          margin: 0 0 10px 0;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .detail-section p {
          margin: 5px 0;
          font-size: 14px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .items-table th {
          background-color: #f2f2f2;
          color: #17455a;
          padding: 12px;
          border: 1px solid #ddd;
          text-align: ${tableAlign};
          font-weight: bold;
        }
        .items-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: ${tableAlign};
        }
        .summary {
          width: 50%;
          margin-left: auto;
          margin-bottom: 30px;
          ${isRTL ? 'margin-right: auto; margin-left: 0;' : ''}
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
          flex-direction: ${isRTL ? 'row-reverse' : 'row'};
        }
        .summary-row.total {
          border-top: 2px solid #17455a;
          border-bottom: 2px solid #17455a;
          font-weight: bold;
          font-size: 16px;
          padding: 15px 0;
          color: #17455a;
        }
        .notes {
          background-color: #f9f9f9;
          padding: 20px;
          border-left: 3px solid #17455a;
          margin-bottom: 30px;
          ${isRTL ? 'border-left: none; border-right: 3px solid #17455a;' : ''}
        }
        .footer {
          text-align: center;
          border-top: 1px solid #ddd;
          padding-top: 20px;
          margin-top: 40px;
          font-size: 12px;
          color: #666;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .invoice-container { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
          <div class="company-info">
            <h1>${t.companyName}</h1>
            <p style="margin: 5px 0; font-size: 12px;">
              ${t.companyEmail}<br>
              ${t.companyPhone}
            </p>
          </div>
          <div class="invoice-title">
            <h2>${t.invoice}</h2>
          </div>
        </div>

        <!-- Invoice Details -->
        <div class="invoice-details">
          <div class="detail-section">
            <h3>${t.billTo}</h3>
            <p><strong>${data.customerName}</strong></p>
            <p>${data.customerEmail}</p>
          </div>
          <div class="detail-section">
            <h3>${t.shipTo}</h3>
            <p><strong>${data.shipping_name}</strong></p>
            <p>${data.shipping_address || ''}</p>
            <p>${data.shipping_city || ''}, ${data.shipping_country}</p>
            ${data.shipping_phone ? `<p>${t.companyPhone}: ${data.shipping_phone}</p>` : ''}
          </div>
          <div class="detail-section">
            <h3>${t.invoiceNumber}</h3>
            <p>${data.id}</p>
          </div>
          <div class="detail-section">
            <h3>${t.invoiceDate}</h3>
            <p>${formattedDate}</p>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>${t.description}</th>
              <th>${t.quantity}</th>
              <th>${t.unitPrice}</th>
              <th>${t.total}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Summary -->
        <div class="summary">
          <div class="summary-row">
            <span>${t.subtotal}:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>${t.tax}:</span>
            <span>$0.00</span>
          </div>
          <div class="summary-row">
            <span>${t.shippingFee}:</span>
            <span>$0.00</span>
          </div>
          <div class="summary-row total">
            <span>${t.totalAmount}:</span>
            <span>$${data.total.toFixed(2)}</span>
          </div>
        </div>

        <!-- Payment Terms -->
        <div class="notes">
          <h3>${t.paymentTerms}</h3>
          <p>${t.paymentMethodDue}</p>
        </div>

        <!-- Thank You Message -->
        <p style="text-align: ${textAlign}; font-size: 14px; color: #666;">
          ${t.thankyouMessage}
        </p>

        <!-- Footer -->
        <div class="footer">
          <p>${t.footer}</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate invoice as PDF (requires external PDF library)
 * This is a preview - actual PDF generation would use a library like jsPDF or pdfkit
 */
export function generatePDFInvoice(data: InvoiceData): Promise<Blob> {
  // This would typically use a library like jsPDF or html2pdf
  // For now, we return the HTML that can be printed to PDF
  const html = generateHTMLInvoice(data)
  const blob = new Blob([html], { type: 'text/html' })
  return Promise.resolve(blob)
}

/**
 * Download invoice as HTML file
 */
export function downloadInvoiceAsHTML(data: InvoiceData): void {
  const html = generateHTMLInvoice(data)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `invoice-${data.id}-${data.language}.html`
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * Get invoice language from user preference or URL parameter
 */
export function getInvoiceLanguage(): 'en' | 'ar' {
  const params = new URLSearchParams(window.location.search)
  const lang = params.get('lang')
  if (lang === 'ar' || lang === 'en') {
    return lang
  }
  // Fallback to browser language or English
  const browserLang = navigator.language.split('-')[0]
  return browserLang === 'ar' ? 'ar' : 'en'
}
