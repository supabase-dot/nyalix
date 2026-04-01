# Advanced Quotation System Implementation Guide 💼

## Overview

The Advanced Quotation System allows B2B customers to request quotes for products instead of making direct purchases. This feature includes a complete workflow from quote request submission to admin management with status tracking.

## Features

### Customer-Facing Features
✅ **Request Quote Form**
- Customer clicks "Request Quote" button on any product page
- Professional modal form with the following fields:
  - Full Name *
  - Company *
  - Email *
  - Phone *
  - Country *
  - Product Name (pre-filled) *
  - Quantity *
  - Additional Message (optional)

✅ **Easy Access**
- "Request Quote" button available on:
  - Product detail page (next to "Add to Cart")
  - Product listing cards (future enhancement)

### Admin Dashboard Features
✅ **Quote Management Tab**
- Dedicated "Quotes" tab in admin sidebar
- Real-time quote request list with automatic refresh (every 10 seconds)

✅ **Quote Statistics**
- Total quote requests count
- Pending quotes count
- Responded quotes count
- Approved quotes count

✅ **Status Management**
- View all quote requests
- Filter by status: All, Pending, Responded, Approved
- Update quote status from Pending → Responded → Approved
- Mark quotes as read/unread

✅ **Admin Response System**
- Add professional responses to quote requests
- Edit responses at any time
- Auto-timestamp responses
- Response visibility in the quote details

✅ **Quote Details View**
- Expandable quote cards showing:
  - Customer name and company
  - Email (clickable mailto link)
  - Phone (clickable tel link)
  - Country
  - Product name and quantity
  - Customer's message
  - Status badges
  - Admin response (if any)
  - Timestamps

✅ **Actions**
- Delete quote requests
- Mark as read
- Update status
- Add/edit admin responses

## Database Schema

### Table: `quote_requests`

```sql
CREATE TABLE quote_requests (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  product_id UUID NOT NULL, -- foreign key link to products
  product_name TEXT NOT NULL, -- snapshot of product name at time of quote
  quantity INTEGER NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Responded', 'Approved')),
  admin_response TEXT,
  admin_responded_at TIMESTAMP WITH TIME ZONE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
- `idx_quote_requests_status` - for fast filtering by status
- `idx_quote_requests_email` - for searching quotes by customer email
- `idx_quote_requests_created_at` - for sorting by date

## File Structure

```
src/
├── components/
│   ├── QuoteRequestModal.tsx          # Customer-facing quote form modal
│   └── AdminQuotesTab.tsx             # Admin dashboard quote management
├── hooks/
│   └── useQuoteNotifications.ts       # Hook for fetching pending quote counts
├── pages/
│   ├── ProductDetail.tsx              # Updated with quote button
│   ├── Products.tsx                   # Product listing (quote access)
│   └── Admin.tsx                      # Updated with quotes tab
└── supabase/
    └── migrations/
        └── 20260312025816_create_quote_requests_table.sql
```

## Component Documentation

### QuoteRequestModal Component

**Props:**
```typescript
interface QuoteRequestModalProps {
  isOpen: boolean;           // Controls modal visibility
  onClose: () => void;       // Callback when modal is closed
  productId?: string;        // Pre-fill product for this quote
  productName?: string;      // Pre-fill product name
}
```

**Features:**
- Form validation for required fields
- Toast notifications for success/error
- Loading state during submission
- Automatic form reset after successful submission
- Responsive design (mobile + desktop)
- Icon-enhanced form fields for better UX

**Usage Example:**
```typescript
import QuoteRequestModal from '@/components/QuoteRequestModal';
import { useState } from 'react';

export function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Request Quote
      </button>
      
      <QuoteRequestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        productId="product-123"
        productName="Medical Device X"
      />
    </>
  );
}
```

### AdminQuotesTab Component

**Features:**
- Automatic 10-second refresh of quote list
- Real-time status statistics
- Filter quotes by status
- Expandable quote details
- Rich admin response management
- One-click actions (email, phone)
- Visual status indicators with color coding

**Status Colors:**
- 🟡 **Pending**: Amber (awaiting response)
- 🔵 **Responded**: Blue (response sent)
- 🟢 **Approved**: Green (approved)

**Expanding Quote Card Shows:**
- Full customer details
- Product information
- Current admin response or button to add one
- Response edit capability
- Delete option

## Integration Points

### Product Detail Page
The "Request Quote" button appears next to "Add to Cart":

```typescript
<button 
  onClick={() => setShowQuoteModal(true)}
  className="w-full sm:w-auto ml-2 inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-semibold transition-all"
>
  <FileText className="w-5 h-5" />
  Request Quote
</button>

<QuoteRequestModal 
  isOpen={showQuoteModal}
  onClose={() => setShowQuoteModal(false)}
  productId={product.id}
  productName={name}
/>
```

### Admin Sidebar
The quotes tab is added to the admin navigation:

```typescript
export type AdminTab = '...' | 'quotes' | '...';

const items: SidebarItem[] = [
  // ... other items
  { key: 'quotes', icon: FileText, label: 'Quotes' },
  // ... other items
];
```

### Admin Dashboard
The quotes tab is rendered in the main content area:

```typescript
{tab === 'quotes' && <AdminQuotesTab />}
```

## User Flow

### Customer Journey
1. Browse products
2. Find interesting product
3. Click "Request Quote" button
4. Fill in business details in modal
5. Specify quantity and any special requirements
6. Submit form
7. Receive confirmation toast
8. Account admin will contact them

### Admin Journey
1. Login to admin dashboard
2. Navigate to "Quotes" tab in sidebar
3. View all quote requests with status overview
4. Click on a quote to expand details
5. Review customer information
6. Add a response with pricing/terms
7. Update status to "Responded"
8. Later, update to "Approved" when deal is finalized
9. Contact customer via email/phone buttons

## API Integration

### Supabase Policies
- **Public Insert**: Anyone can submit quote requests (no auth required)
- **Admin Select/Update/Delete**: Only authenticated users (admins) can manage quotes
- Row-level security (RLS) is enabled for security

## Notifications & Polling

### Real-time Updates
- Quote lists refresh every 10 seconds
- Admin can see new incoming quotes without page refresh
- Status changes reflected immediately in the UI

### Future Enhancements (Optional)
- Email notification to admin when new quote received
- Email response to customer when admin responds
- SMS notification option
- Webhook integration for third-party CRM systems

## Troubleshooting

### Quote Not Submitting
- Check browser console for error messages
- Verify all required fields are filled
- Ensure email is valid format
- Check Supabase connection status

### Admin Can't See Quotes
- Verify user is logged in as admin
- Check user role in `user_roles` table
- Refresh the page
- Check browser console for network errors

### Quotes Tab Not Showing
- Verify migration was applied: `supabase db push`
- Clear browser cache and reload
- Check that `AdminQuotesTab` import is correct
- Rebuild the project: `npm run build`

## Performance Considerations

- Indexes on `status` and `created_at` columns for fast queries
- Pagination can be added if quote list grows very large
- Consider archiving old quotes to maintain performance
- Real-time subscriptions can be added for instant updates

## Security Notes

- Quotes table has RLS enabled
- Public can insert but not see other quotes
- Only authenticated admins can view/update quotes
- Email and phone fields are not indexed/searchable by non-admins
- Consider adding rate limiting if abuse occurs

## Future Enhancements

1. **Automated Responses**: Template-based automatic responses
2. **Quote History**: Track changes to quotes over time
3. **Quote Expiry**: Set expiration dates on quote validities
4. **Bulk Operations**: Export quotes to CSV/PDF
5. **Email Integration**: Send response directly from dashboard
6. **Payment Integration**: Convert approved quotes to orders
7. **Multi-currency**: Support pricing in different currencies
8. **Lead Scoring**: Prioritize high-value quote requests
9. **Audit Trail**: Log all changes to quotes
10. **Mobile App**: Quote management on mobile devices

## Support & Maintenance

For issues or questions:
1. Check the troubleshooting section
2. Review component code comments
3. Check Supabase logs for database errors
4. Verify migration was applied correctly
5. Test with browser developer tools

---

**Version**: 1.0  
**Date Created**: March 12, 2026  
**Last Updated**: March 12, 2026
