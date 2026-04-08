# Contact System Quick Start & API Reference

## Quick Start for Developers

### 1. Database Setup
```bash
# Apply the migration
supabase migration add 20260408_enhance_contact_messages_system

# Or if using local development
supabase db push
```

### 2. Key Tables
```sql
-- Main contact messages table (enhanced)
SELECT * FROM contact_messages;

-- Admin replies
SELECT * FROM contact_message_replies;

-- Join them for conversation view
SELECT cm.*, cmr.id as reply_id, cmr.reply_text 
FROM contact_messages cm
LEFT JOIN contact_message_replies cmr ON cm.id = cmr.message_id
ORDER BY cm.created_at DESC, cmr.created_at ASC;
```

### 3. Status Lifecycle
```
User submits message → status = 'new'
                    ↓
Admin writes reply   → status = 'replied' (automatic)
                    ↓
Admin marks done     → status = 'resolved' (manual, in Admin tab)
```

---

## Component Usage

### Admin Dashboard
```tsx
import AdminMessagesTab from '@/components/AdminMessagesTab';

// Component automatically handles:
// - Fetching all messages
// - Displaying with search/filter
// - Message expansion
// - Reply functionality
// - Status management
// - Email notifications

<AdminMessagesTab />
```

### User Dashboard Messages Section
```tsx
// In Profile.tsx - automatically included
// Shows:
// - User's messages
// - Status indicators
// - Reply count
// - Edit/Delete options
// - Conversation history
```

---

## API Reference

### Email Notifications
```tsx
import { sendEmail } from '@/lib/notifications';

// Send message submission confirmation
await sendEmail('contact_submitted', userEmail, {
  name: 'John Doe',
  messageId: 'uuid-here',
});

// Send admin reply notification
await sendEmail('contact_replied', userEmail, {
  messageId: 'uuid-here',
  reply: 'Your reply text here...',
});

// Send resolution notification
await sendEmail('contact_resolved', userEmail, {
  messageId: 'uuid-here',
  status: 'resolved',
});
```

### Database Queries

#### Get all messages for a user
```tsx
const { data } = await supabase
  .from('contact_messages')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

#### Get message with replies
```tsx
const { data: message } = await supabase
  .from('contact_messages')
  .select('*')
  .eq('id', messageId)
  .single();

const { data: replies } = await supabase
  .from('contact_message_replies')
  .select('*')
  .eq('message_id', messageId)
  .order('created_at', { ascending: true });
```

#### Update message status
```tsx
await supabase
  .from('contact_messages')
  .update({ status: 'replied' })
  .eq('id', messageId);
```

#### Add admin reply
```tsx
await supabase
  .from('contact_message_replies')
  .insert({
    message_id: messageId,
    admin_user_id: adminUserId,
    reply_text: 'Admin response text here',
    read_by_user: false,
  });
```

#### Edit user message
```tsx
await supabase
  .from('contact_messages')
  .update({
    message: 'Updated message text',
    is_edited: true,
    edited_at: new Date().toISOString(),
    edit_count: currentEditCount + 1,
  })
  .eq('id', messageId)
  .eq('user_id', userId)
  .eq('status', 'new');  // Only if status is 'new'
```

---

## Translations Needed

Add these translation keys to your i18n files:

```json
{
  "user.profile": {
    "myMessages": "My Messages",
    "noMessages": "No messages sent yet.",
    "editMessage": "Edit Message",
    "deleteMessage": "Delete Message",
    "adminResponse": "Admin Response",
    "adminResponses": "Admin Responses",
    "yourReply": "Your Reply"
  },
  "admin": {
    "messagesTitle": "Contact Messages",
    "noMessages": "No messages yet.",
    "statusNew": "New",
    "statusReplied": "Replied",
    "statusResolved": "Resolved",
    "reply": "Reply",
    "status": "Status",
    "markAsRead": "Mark as read",
    "deleteMessage": "Delete message",
    "conversationHistory": "Conversation History"
  },
  "contact": {
    "loginRequired": "Login Required to Send Message"
  }
}
```

---

## Email Templates

The email templates are handled by Supabase Edge Functions. Ensure your email function supports:

### 1. contact_submitted
```text
Subject: "We received your message!"
Body: Include name, message preview, link to profile
```

### 2. contact_replied
```text
Subject: "[Company] - New reply to your message"
Body: Include reply text, link to view full conversation
```

### 3. contact_resolved
```text
Subject: "Your message has been resolved"
Body: Include summary, thank you message
```

---

## Security Considerations

### RLS Policies in Place:
1. ✓ Users can only view their own messages
2. ✓ Users can only edit messages with status 'new'
3. ✓ Admins can view/edit all messages
4. ✓ Admins can manage all replies
5. ✓ Public can insert but not view immediately

### Best Practices:
- Always check authentication before allowing edits
- Validate user_id matches before updating
- Log admin actions for audit trail
- Sanitize email content for display
- Rate limit message submission if needed

---

## Performance Optimization

### Indexes Created:
- `idx_contact_messages_user_id` - User message lookup
- `idx_contact_messages_status` - Status filtering
- `idx_contact_message_replies_message_id` - Reply lookup
- `idx_contact_message_replies_created_at` - Sorting

### Query Tips:
- Use `.select('*')` to pre-filter columns when possible
- Join with replies only when needed
- Use pagination for large message lists
- Cache user profile details (name, email)

---

## Troubleshooting

### Messages not showing in admin dashboard
- Check if migration was applied
- Verify RLS policies allow admin access
- Check auth context for admin role

### Edits not working
- Ensure status is 'new'
- Verify user_id matches
- Check RLS policies on update

### Emails not sending
- Verify email type strings ('contact_submitted', etc.)
- Check email function configuration
- Look at function logs in Supabase

### Real-time updates not working
- Ensure WebSocket connection is open
- Check browser console for errors
- Verify table is NOT using RLS restrictions on subscription

---

## Version Info
- Created: April 8, 2026
- Last Updated: April 8, 2026
- Status: Production Ready
- Test Coverage: See CONTACT_SYSTEM_IMPLEMENTATION.md

---
