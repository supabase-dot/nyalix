# Password Reset Flow - Quick Reference

## Quick Overview

Users can reset their forgotten passwords through a secure email link. The flow involves:

1. **Request Reset** (Auth Page) → User enters email
2. **Verify Token** (Reset Page) → System validates reset link
3. **Reset Password** (Reset Form) → User sets new password
4. **Success** (Redirect) → User is redirected to login

---

## User Journey

### As a User:

```
1. Click "Forgot password?" on login page
2. Enter your email address
3. Check your email for reset link (check spam folder!)
4. Click the reset link in the email
5. Enter your new password (must meet security requirements)
6. Confirm your new password
7. Click "Update Password"
8. You'll be redirected to login with your new password
```

### Password Requirements:
- Between 8-15 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)

---

## Developer Integration Points

### 1. Forgot Password Request
**File:** `src/pages/Auth.tsx`

Send reset email:
```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
});
```

### 2. Password Reset Page
**File:** `src/pages/ResetPassword.tsx`

Automatically:
- Extracts token from URL
- Verifies token validity
- Shows reset form if valid
- Updates password via Supabase

### 3. Password Validation
**File:** `src/lib/validation.ts`

Check password requirements:
```typescript
const result = validatePassword(password);
if (!result.isValid) {
  console.log(result.message); // Show to user
}
```

---

## Common Tasks

### Test Password Reset Locally

```bash
# 1. Start the app
npm run dev

# 2. Go to http://localhost:5173/auth
# 3. Click "Forgot password?"
# 4. For testing, use Supabase local development
#    or test account email
```

### Check Supabase Settings

Go to Supabase Dashboard:
1. Authentication → Providers → Email
2. Verify reset email is enabled
3. Check email templates
4. Configure token expiration (default 1 hour)

### Add Custom Email Template

In Supabase Dashboard:
1. Authentication → Email Templates
2. Select "Reset Email"
3. Customize design
4. Save changes

---

## URL Patterns

### Supabase-Generated Reset Links

**Hash Fragment (Secure):**
```
https://nyalix.com/reset-password#access_token=...&type=recovery
```

**Query Parameters (Fallback):**
```
https://nyalix.com/reset-password?token_hash=...&type=recovery
```

Both are supported in the implementation.

---

## Error Messages & Solutions

### "Invalid or expired reset link"
- Token has expired (after ~1 hour)
- **Solution:** Request a new password reset email

### "Password must include..."
- Password doesn't meet security requirements
- **Solution:** Check the requirements list and try again

### "Passwords do not match"
- Confirm password doesn't match new password
- **Solution:** Make sure both password fields are identical

### "Failed to update password"
- Network issue or Supabase error
- **Solution:** Check internet connection, try again, or request new reset link

---

## Security Features Implemented

✅ **Token Verification**
- Tokens verified immediately on page load
- Expired tokens rejected
- Invalid tokens show error

✅ **Password Security**
- Strong password requirements enforced
- Passwords masked in inputs
- Password visibility toggle included

✅ **Session Security**
- Uses authenticated Supabase session
- Session automatically created after token verification
- No tokens stored in localStorage

✅ **Rate Limiting**
- Supabase limits reset email requests
- Prevents abuse
- User can retry after rate limit window

✅ **Safe Redirect**
- Redirects to /auth after successful reset
- No sensitive data in URL after reset

---

## Troubleshooting Checklist

- [ ] Reset email sent successfully (check email + spam)
- [ ] Reset link clicked within 1 hour of email receipt
- [ ] Browser allows localhost URLs (for testing)
- [ ] Supabase project is accessible and configured
- [ ] Password meets all security requirements
- [ ] Passwords are typed correctly and match
- [ ] Network connection is stable
- [ ] Browser console shows no JavaScript errors

---

## File Locations

| Purpose | File | Key Function |
|---------|------|--------------|
| Forgot Password | `src/pages/Auth.tsx` | `resetPasswordForEmail()` |
| Reset Page | `src/pages/ResetPassword.tsx` | Complete reset flow |
| Validation | `src/lib/validation.ts` | `validatePassword()` |
| Auth Context | `src/contexts/AuthContext.tsx` | Session management |
| Supabase Client | `src/integrations/supabase/client.ts` | API client |
| Documentation | `docs/PASSWORD_RESET_IMPLEMENTATION.md` | Full guide |

---

## Related Features

- ✅ Email-based password recovery
- ✅ Real-time password validation
- ✅ Token expiration handling
- ✅ Loading and success states
- ✅ Error messages and recovery
- ✅ Responsive design
- ✅ Accessibility (labels, ARIA)
- ✅ Bilingual support (English/Arabic)

---

## Environment Setup

Required in `.env` for Supabase:
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
```

---

## Testing Scenarios

### Scenario 1: Normal Flow
- [ ] Request reset for valid email
- [ ] Receive email within seconds
- [ ] Click reset link
- [ ] See verification spinner then form
- [ ] Enter valid password
- [ ] Confirm password
- [ ] See success message
- [ ] Redirected to login

### Scenario 2: Expired Token
- [ ] Request reset
- [ ] Wait 1+ hours
- [ ] Try to use reset link
- [ ] See "Invalid or expired reset link" error
- [ ] Click "Back to Login"
- [ ] Can request new reset email

### Scenario 3: Invalid Password
- [ ] Complete token verification
- [ ] Try password without uppercase
- [ ] See specific error message
- [ ] Try password too short
- [ ] See specific error message
- [ ] Fix issues and resubmit

### Scenario 4: Mismatched Passwords
- [ ] Complete token verification
- [ ] Enter password in first field
- [ ] Enter different password in second field
- [ ] See "Passwords do not match" error
- [ ] Fix and resubmit

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Authentication Guide:** https://supabase.com/docs/guides/auth
- **Password Reset:** https://supabase.com/docs/guides/auth/auth-password-reset
- **Issues:** Contact the development team or check GitHub Issues

---

## Changelog

### Version 1.0 (2026-04-09)
- ✨ Complete password reset flow
- ✨ Token verification with hash and query parameter support
- ✨ Real-time password validation
- ✨ Loading and error states
- ✨ Success confirmation and redirect
- 📚 Comprehensive documentation
- 📝 Quick reference guide

---

**Last Updated:** April 9, 2026
