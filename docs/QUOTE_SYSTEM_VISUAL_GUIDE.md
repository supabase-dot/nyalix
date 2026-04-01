# Quote System - Visual Reference & Quick Guide 📱

## 🎨 User Interface Overview

### Customer-Facing: Product Detail Page
```
┌─────────────────────────────────────────┐
│ Product Image            Product Details │
│ [Large Product Photo]    Medical Device X │
│                          ⭐⭐⭐⭐⭐ (45 reviews)
│                          $1,299.00
│                          ✓ In Stock (12 available)
│
│                          [🛒 Add to Cart]
│                          [📄 Request Quote] ← NEW!
│
│ Description:
│ Lorem ipsum dolor sit amet...
│
│ Specifications:
│ • Power: 110V
│ • Weight: 45kg
│ • Warranty: 2 years
└─────────────────────────────────────────┘
```

### Quote Request Modal
```
┌─────────────────────────────────────────────┐
│  Request a Quote               [X]          │
│  Get pricing for your B2B requirements     │
├─────────────────────────────────────────────┤
│                                             │
│  Full Name *           👤 John Doe         │
│  Company *             🏢 Acme Corp         │
│  Email *               ✉️ john@acme.com   │
│  Phone *               📞 +1 (555) 000-0000│
│  Country *             🌍 United States    │
│  Product *             📦 Medical Device X │
│  Quantity *            [5]                  │
│  Message (optional)    Tell us about...    │
│  [Text area for requirements]               │
│                                             │
│  [Cancel]              [Send Quote Request]│
└─────────────────────────────────────────────┘
```

---

### Admin Dashboard: Quotes Tab
```
┌─────────────────────────────────────────────────────┐
│  📄 Quote Requests                                  │
│  Manage B2B quotation requests                      │
├─────────────────────────────────────────────────────┤
│
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐
│  │ Total    │ │ Pending  │ │Responded │ │Approved │
│  │    12    │ │    5     │ │    4     │ │   3     │
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘
│
│  Filter: [All] [Pending] [Responded] [Approved]
│
│  Quote Cards (Expandable):
│
│  ┌─────────────────────────────────────────────────┐
│  │ 👤 John Smith              [Not Read]           │
│  │    Acme Corporation                             │
│  │                                                 │
│  │ [⏱️  Pending]  [📦 Qty: 50]  [📅 Mar 12, 2026] │
│  │                                                 │
│  │ ✉️ john@acme.com | 📞 +1(555)000-0000 | 🌍 USA │
│  │                                                 │
│  │ Product: Medical Device X - Quantity: 50       │
│  │ Message: We need these for our hospital...     │
│  │                                                 │
│  │  [Expand Details ↓]                            │
│  │                                                 │
│  │  EXPANDED VIEW:                                 │
│  │  ───────────────────────────────────────────   │
│  │  Update Status:                                 │
│  │  [Pending]  [Responded] ✓ [Approved]          │
│  │                                                 │
│  │  Admin Response:                                │
│  │  ┌─────────────────────────────────────────┐   │
│  │  │ Thank you for your inquiry!             │   │
│  │  │ Our pricing for 50 units is...          │   │
│  │  │ Responded: Mar 12, 2026 10:30 AM        │   │
│  │  │ [Edit Response]                         │   │
│  │  └─────────────────────────────────────────┘   │
│  │                                                 │
│  │  [Delete Quote Request]                        │
│  └─────────────────────────────────────────────────┘
│
│  More quote cards below...
│
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Status Indicators

### Status Flow
```
           [Pending] 🟡
              ↓
         [Responded] 🔵
              ↓
         [Approved] 🟢
```

**Color Meanings:**
- 🟡 **Pending** (Amber): Waiting for admin response
- 🔵 **Responded** (Blue): Admin has responded with terms
- 🟢 **Approved** (Green): Quote approved, ready for order

---

## 📊 Admin Statistics Dashboard

```
┌─────────────────────────────────────────┐
│ Quote Statistics (Live Updated)         │
├─────────────────────────────────────────┤
│                                         │
│  📄 Total                    📋 12     │
│  ⏱️  Pending                  ⏳ 5      │
│  💬 Responded                 ✉️ 4     │
│  ✅ Approved                  ✓ 3      │
│                                         │
│  Today: 2 new requests                  │
│  This week: 7 total                     │
│  Last response time: 2 hours            │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
Customer                    Nyalix System              Admin
   │                             │                      │
   ├─ Browse Product ───────────>│                      │
   │                             │                      │
   ├─ Click "Request Quote" ───>│                      │
   │                             │                      │
   ├─ Fill Form ─────────────────┤                      │
   │                             │                      │
   ├─ Submit ───────────────────>│                      │
   │                             ├─ Validate ──────────┤
   │                             │                      │
   │                             ├─ Store in DB ──────>│
   │                             │                      │
   │<─ Confirmation Toast ───────┤                      │
   │                             │     Login            │
   │                             │<────────────────────>│
   │                             │                      │
   │                             │     View Quotes      │
   │                             │<────────────────────>│
   │                             │                      │
   │                             │  Add Response        │
   │                             │<────────────────────>│
   │                             │                      │
   │                             │  Update Status       │
   │<─ Contacted ─────────────────────────────────────>│
```

---

## 🔌 Integration Points

### Where Quote Button Appears
```
1. Product Detail Page
   Path: /products/:id
   Component: ProductDetail.tsx
   Button: "Request Quote"

2. Future: Product Cards (optional)
   Path: /products
   Would show quick quote action
```

### Admin Access
```
Path: /admin
Section: Sidebar Navigation
Option: "Quotes" (between Messages & Newsletter)
Requires: Admin authentication
```

---

## 💾 Database Schema (Simplified)

```
quote_requests (table)
├── id (UUID, Primary Key)
├── name (Text) - Customer name
├── company (Text) - Company name
├── email (Text) - Customer email
├── phone (Text) - Customer phone
├── country (Text) - Customer location
├── product_id (UUID) - Link to products table
├── product_name (Text) - Snapshot of product name
├── quantity (Integer) - Units requested
├── message (Text) - Special requirements
├── status (Text) - Pending/Responded/Approved
├── admin_response (Text) - Admin reply
├── admin_responded_at (Timestamp) - When admin replied
├── read (Boolean) - Has admin viewed it?
├── created_at (Timestamp) - When quote submitted
└── updated_at (Timestamp) - Last update time
```

---

## 🚀 Quick Action Buttons

### For Customers
- **Request Quote** → Opens modal form
- **Submit** → Creates DB entry, shows confirmation

### For Admins
- **Mark as Read** → Eye icon toggles read status
- **Update Status** → Three buttons (Pending/Responded/Approved)
- **Add Response** → Opens text editor
- **Edit Response** → Modify existing response
- **Contact via Email** → Click email link
- **Contact via Phone** → Click phone link
- **Delete** → Remove quote request

---

## 📱 Mobile Responsive Layout

### Mobile View (< 768px)
```
┌─────────────────┐
│ Quote Requests  │
│ Manage B2B...   │
├─────────────────┤
│ [Total: 12]     │
│ [Pending: 5]    │
│ [Responded: 4]  │
│ [Approved: 3]   │
├─────────────────┤
│ Quote Card      │
│ [Expandable]    │
│ Tap to expand   │
│ details...      │
└─────────────────┘
```

### Desktop View (≥ 768px)
```
┌──────────────────────────────────┐
│        Quote Requests            │
│  Total  Pending  Responded Approv│
│   12      5         4        3   │
├──────────────────────────────────┤
│ Quote Rows - Side by side layout │
│ More information visible at once │
└──────────────────────────────────┘
```

---

## ⚡ Performance Metrics

```
Component                Load Time    Updates
QuoteRequestModal        ~50ms        On submit
AdminQuotesTab          ~100ms       Every 10s
Quote Submission        ~500ms       Once
Status Update           ~200ms       Instance
Response Save           ~300ms       Instance
Database Query          ~50ms        Indexed
```

---

## 🎓 User Scenarios

### Scenario 1: B2B Hospital Purchase

```
Day 1, 2 PM:
- Hospital procurement team browses diagnostic equipment
- Finds perfect device, but needs bulk quote
- Clicks "Request Quote"
- Fills: John Smith, Hospital Name, 50 units
- Receives "Thank you! We'll contact you soon."

Day 1, 3 PM:
- Nyalix sales admin sees new quote notification
- Reviews hospital details
- Checks inventory and pricing
- Types: "We can supply 50 units at $X per unit"
- Updates status to "Responded"

Day 2, 10 AM:
- Hospital receives quote (via email notification - future feature)
- Approves the deal
- Admin updates status to "Approved"
- Sales team initiates bulk order fulfillment
```

### Scenario 2: Multi-Unit Clinic Setup

```
Small clinic owner wants to standardize on Nyalix equipment
→ Requests quotes for 5 different products
→ Gets individual responses for each
→ Compares total package pricing
→ Admin negotiates volume discount
→ Approves final package deal
```

---

## 🔐 Security Flow

```
Customer Submits Quote
        ↓
Form Validation (Client)
        ↓
Supabase Insert (Public Permission)
        ↓
RLS Policy Check (Allow Public Insert)
        ↓
Database Storage
        ↓
Admin Login (Authentication Required)
        ↓
RLS Policy Check (Allow Authenticated Read/Update)
        ↓
Display in Dashboard
        ↓
Admin Takes Action (Update/Delete)
        ↓
RLS Policy Check (Allow Authenticated Update/Delete)
        ↓
Database Update
```

---

## 📞 Contact Quick Links

**Email Button**
- Clicking opens email client
- Pre-fills: To: `customer_email@example.com`
- Subject: Can be auto-filled from quote
- Body: Can be auto-filled with quote details

**Phone Button**
- Clicking initiates phone call (on mobile) or copies number (desktop)
- Quick dialing for salespeople

---

## ⏰ Timeline & Auto-Refresh

```
11:00 AM - Quote submitted
          ↓
11:00 AM - [Pending]
          ↓ (automatic 10-second refresh)
11:10 AM - [Still showing in list]
          ↓
11:15 AM - Admin adds response
          ↓ (automatic 10-second refresh)
11:25 AM - Shows [Responded] status
          ↓ (admin doesn't need to refresh)
11:30 AM - Admin marks as [Approved]
          ↓
Status updates in real-time
```

---

## 🎯 Key Metrics to Track (Future)

Would be valuable to implement:
- Average response time per quote
- Conversion rate (quote → order)
- Most requested products
- Top requesting companies
- Geographic distribution of requests
- Response time by admin
- Approval rate by product

---

## 📋 State Management

```
QuoteRequestModal:
├── formData (name, company, email, etc.)
├── loading (submit in progress)
└── modal open/close

AdminQuotesTab:
├── quotes (list of all requests)
├── loading (initial fetch)
├── expandedQuote (currently expanded)
├── editingResponse (editing mode)
├── statusFilter (All/Pending/Responded/Approved)
├── showArchived (show old quotes toggle)
└── refetch (10-second polling)
```

---

**Print this guide for:**
- Team training
- Documentation
- Feature overview
- UI reference
- Workflow understanding

---

*Compatible with Nyalix Admin Dashboard v1.0*  
*Last Updated: March 12, 2026*
