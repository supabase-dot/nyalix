# Medical Equipment E-Commerce Website

## Project Overview

This project is a modern **medical equipment e-commerce website** designed to showcase and sell hospital furniture and medical devices online. The platform allows users to browse products, view detailed specifications, place orders, and manage their accounts.

An **admin dashboard** is also included to manage products, orders, exhibitions, newsletters, and users.

The goal of this project is to provide a **professional digital storefront for hospital equipment suppliers** with a clean UI, responsive design, and scalable backend integration.

---


## User Features

* Browse hospital furniture and medical equipment
* View product images, specifications, and descriptions
* Add products to cart and place orders
* Order tracking through **My Orders**
* Product reviews and ratings after delivery
* User profile management
* Newsletter subscription

## Admin Features

* Admin dashboard for complete store management
* Add, edit, and delete products
* Manage product images and specifications
* View and manage customer orders
* Delete order history if necessary
* Manage exhibition section with images and videos
* Newsletter subscriber management
* Admin profile settings (name, email, password)
* Notification indicators for new orders and subscriptions

---

# Automated Notification System

This project includes a comprehensive automated notification system for user registration, order placement, and order status updates via Email and WhatsApp.

## Features

### User Registration Notifications
- **Welcome Email**: Automatically sent upon user registration with account details and company branding.

### Order Notifications
- **Invoice Email**: Sent immediately after order placement with complete order details.
- **WhatsApp Message**: Order confirmation sent to the user's registered phone number.

### Order Status Updates
- **Status Update Email**: Sent whenever the admin changes order status (Pending, Processing, Shipped, Delivered, Cancelled).
- **WhatsApp Notification**: Real-time status updates via WhatsApp.

## Technology Stack

- **Email Service**: Resend API for reliable email delivery
- **WhatsApp Service**: Twilio WhatsApp API for messaging
- **Backend**: Supabase Edge Functions for serverless processing
- **Database**: PostgreSQL with notification logs

## Admin Setup

### Making a User Admin

For development/demo purposes, users can grant themselves admin privileges:

1. **Log in** to the application
2. **Navigate** to `/admin`
3. **Click** the "Make Me Admin" button on the dashboard
4. **Refresh** the page to gain full admin access

This creates an admin role entry in the `user_roles` table using a secure server-side function.

### Admin Features

Once admin privileges are granted, you can:

- Manage products (add, edit, delete)
- View and update order statuses
- Manage exhibitions and media
- View user profiles and messages
- Access all administrative functions

## Setup Instructions

### 1. Environment Variables

Add the following secrets to your Supabase project:

```bash
# Resend API Key (for email notifications)
RESEND_API_KEY=your_resend_api_key_here

# Twilio Credentials (for WhatsApp notifications)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number
```

### 2. Get API Keys

#### Resend (Email Service)
1. Sign up at [resend.com](https://resend.com)
2. Create an API key from your dashboard
3. Verify your domain for sending emails

#### Twilio (WhatsApp Service)
1. Sign up at [twilio.com](https://twilio.com)
2. Get your Account SID and Auth Token
3. Enable WhatsApp sandbox or apply for production access
4. Get your WhatsApp-enabled phone number

### 3. Deploy Edge Functions

```bash
# Deploy all notification functions
npx supabase functions deploy send-notification
npx supabase functions deploy generate-notification
npx supabase functions deploy send-email
npx supabase functions deploy make-admin
```

### 4. Database Setup

The notification system uses the following database components:

- **notifications table**: Logs all sent notifications
- **Database triggers**: Automatically trigger notifications on events

Run the migrations to set up the database:

```bash
npx supabase db push
```

## Notification Templates

### Email Templates
- **Welcome Email**: Includes user details, account info, and company branding
- **Order Invoice**: Professional invoice with order details, items, pricing, and shipping info
- **Status Updates**: Clean status notifications with order summary

### WhatsApp Templates
- **Order Confirmation**: Formatted message with order ID, items, and total
- **Status Updates**: Real-time status notifications with order details

## Reliability Features

- **Duplicate Prevention**: Notifications are only sent once per event
- **Logging**: All notifications are logged in the database for tracking
- **Error Handling**: Failed notifications are logged with error details
- **Real-time**: Admin status changes trigger immediate notifications

## Admin Integration

The admin dashboard automatically sends notifications when:
- Order status is updated via the dropdown
- No manual intervention required
- Notifications are sent in real-time

## Testing

To test the notification system:

1. **Registration**: Create a new user account
2. **Order Placement**: Complete a purchase in the cart
3. **Status Updates**: Change order status in admin panel

Check the notifications table in Supabase to view sent notifications.

---

# Comprehensive Email System

This project now includes a comprehensive email system using Supabase Edge Functions and Resend API.

### Features

- **User Invitations**: Send beautifully designed invitation emails
- **Welcome Emails**: Automated welcome messages for new users
- **Order Invoices**: Professional invoice emails with order details
- **Order Status Updates**: Real-time status notifications
- **Password Reset**: Secure password reset emails
- **Email Logging**: Track all sent emails in the database

### Email Types Supported

1. **invitation**: User invitation emails with accept links
2. **welcome**: Welcome emails for new registrations
3. **order_invoice**: Complete order invoices with item details
4. **order_status**: Order status update notifications
5. **password_reset**: Password reset emails with secure links

### Usage Examples

#### Send an Invitation Email
```typescript
import { sendEmail } from '@/lib/notifications'

await sendEmail('invitation', 'user@example.com', {
  email: 'user@example.com',
  invitation_url: 'https://nyalix.com/accept-invite?token=abc123'
})
```

#### Send Order Invoice
```typescript
await sendEmail('order_invoice', 'customer@example.com', null, userId, orderId)
```

#### Send Welcome Email
```typescript
await sendEmail('welcome', 'newuser@example.com', null, userId)
```

### Email Templates

All emails use responsive HTML templates with:
- Professional branding
- Mobile-friendly design
- Gradient headers
- Clear call-to-action buttons
- Proper contact information

### Database Logging

All emails are automatically logged in the `email_logs` table with:
- Email type and recipient
- User and order associations
- Send status and timestamp
- Full audit trail

### Setup Requirements

1. **Resend API Key**: Set `RESEND_API_KEY` in Supabase Edge Functions environment
2. **Domain Verification**: Verify `nyalix.com` in Resend dashboard
3. **Database Migration**: Run the email logs table migration

### Deployment

```bash
# Deploy the new email function
npx supabase functions deploy send-email

# Run database migrations
npx supabase db push
```

### Integration with Supabase Auth

For user invitations through Supabase Auth dashboard, configure SMTP settings as described in the main setup section. For custom invitation flows, use the Edge Function method above.

---

# Technologies Used

This project was built using modern web technologies:

* **React.js** – Frontend UI development
* **TypeScript** – Type-safe JavaScript
* **Vite** – Fast development environment
* **Tailwind CSS** – Responsive styling
* **shadcn/ui** – UI components
* **Supabase** – Database and storage
* **Resend** – Email service
* **Twilio** – WhatsApp messaging
* **Node.js & npm** – Development environment

---

# Project Structure

```
src/
 ├── components
 ├── pages
 ├── hooks
 ├── layouts
 ├── lib
 ├── styles
 └── assets
```

* **components** – Reusable UI components
* **pages** – Main application pages
* **hooks** – Custom React hooks
* **layouts** – Layout structures
* **lib** – Utility functions and integrations

---

# Installation & Setup

To run the project locally:

```bash
# Clone the repository
git clone <your_repository_url>

# Navigate to project directory
cd project-name

# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start and you can preview the application in your browser.

---

# Deployment

The project can be deployed using platforms such as:

* Vercel
* Netlify

Deployment builds the production version of the application for live hosting.

---

# Future Improvements

Planned improvements for the project include:

* Online payment integration
* Advanced product filtering
* Inventory management system
* Customer support chat
* Order analytics for admin

---

# Author

Developed and maintained by **[Shrif Sulaiman Osman]**.

This project demonstrates skills in **modern web development, UI/UX design, and full-stack integration for e-commerce platforms**.
