# Supabase Password Reset Flow Implementation

## Overview

This document describes the complete password reset flow implemented in the Nyalix application. The system allows users to securely reset their passwords through an email link provided by Supabase.

## Architecture

### 1. Password Reset Request Flow

**Location:** `src/pages/Auth.tsx`

Users initiate password reset from the Auth page:

```
User clicks "Forgot password?" → Auth page switches to 'forgot' mode → 
User enters email → Supabase sends reset email → Email contains reset link
```

**Implementation:**
```typescript
if (mode === 'forgot') {
  const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
}
```

**Key Features:**
- Redirects to `/reset-password` page after user clicks email link
- Email link contains Supabase tokens in URL hash or query parameters
- Security: Email is only sent if account exists (rate-limited by Supabase)

---

### 2. Token Verification

**Location:** `src/pages/ResetPassword.tsx` (useEffect hook)

When user opens the reset link, the application:

1. **Extracts Parameters**
   - Checks URL hash for `access_token` and `type` parameters
   - Falls back to query parameters `token_hash` and `type`
   - Validates both parameters exist

2. **Verifies Token**
   - Uses `supabase.auth.verifyOtp()` with extracted parameters
   - `token_hash`: The reset token provided by Supabase
   - `type`: Always `'recovery'` for password reset flows
   - Error = Invalid/Expired link

3. **Sets Verification State**
   - `loading` → Initial state while verifying
   - `verified` → Token is valid, show reset form
   - `invalid` → Token not found or malformed
   - `expired` → Token has expired
   - `error` → Unexpected error occurred

**Code:**
```typescript
const { error: exchangeError } = await supabase.auth.verifyOtp({
  token_hash: tokenHashParam,
  type: 'recovery'
});

if (exchangeError) {
  setVerificationState('invalid');
  return;
}

setVerificationState('verified');
```

---

## User Interface

### Reset Password Page (`src/pages/ResetPassword.tsx`)

#### States:

**1. Loading State**
- Shows spinner while verifying token
- Message: "Verifying reset link..."

**2. Verified State** (Main Reset Form)
- Two password inputs:
  - New Password
  - Confirm Password
- Password visibility toggle buttons
- Real-time validation feedback
- Password requirements checklist

**3. Invalid/Expired State**
- Shows error icon and message
- Option to return to login and request new reset link

**4. Success State**
- Shows success checkmark animation
- Confirmation message
- Auto-redirects to login after 2 seconds
- Manual "Go to Login" button

---

## Password Validation

**Location:** `src/lib/validation.ts`

Password must meet the following requirements:

```
✓ Between 8-15 characters
✓ At least one uppercase letter (A-Z)
✓ At least one lowercase letter (a-z)
✓ At least one number (0-9)
✓ At least one special character (!@#$%^&*)
```

**Validation Function:**
```typescript
export const validatePassword = (password: string): { 
  isValid: boolean; 
  message?: string 
} => {
  // Returns detailed error message if any requirement fails
}
```

**Real-time Validation:**
- Validates on every keystroke
- Shows error message immediately
- Disables submit button until form is valid

---

## Password Update

**Location:** `src/pages/ResetPassword.tsx` (handleSubmit function)

### Process:

1. **Form Validation**
   - Validate password meets security requirements
   - Validate passwords match
   - Show specific error messages if not

2. **Update User Password**
   ```typescript
   const { error } = await supabase.auth.updateUser({ password });
   ```

3. **Handle Response**
   - Success → Show success state, redirect to login
   - Error → Show toast error message, allow retry
   - Loading → Show spinner, disable form

### Error Handling:
- Network errors caught and displayed
- Supabase errors converted to user-friendly messages
- Form remains enabled for retry

---

## Security Features

### 1. Token Verification
- Tokens extracted from Supabase-generated URLs
- Never stored in localStorage
- Verified on page load before showing form
- Expired/invalid tokens rejected immediately

### 2. Password Masking
- Password fields use `type="password"` by default
- Toggle button to reveal password
- Confirm password field also masked

### 3. Form Validation
- Both password matches checked
- Security requirements enforced
- Submit button disabled until form valid
- Real-time feedback

### 4. Rate Limiting (Supabase)
- Supabase limits reset email requests
- User can only request reset once every 60 seconds
- Tokens expire after 24 hours (configurable)

### 5. Session Security
- Uses Supabase authenticated session for update
- updateUser() only works with valid session
- Session automatically created after token verification

---

## UX Enhancements

### 1. Loading States
- Spinner during token verification
- Spinner button during password update
- Disabled form inputs during submission

### 2. Feedback Messages
- Toast notifications for success/error
- Inline validation error messages
- Password requirements checklist
- Clear state-specific messages

### 3. Navigation
- "Back to Login" button on reset form
- "Back to Login" button on error states
- Auto-redirect after success
- Maintains navigation context

### 4. Accessibility
- Proper label elements for inputs
- ARIA labels for toggle buttons
- Focus states on buttons
- Clear error messages

---

## Email Configuration (Supabase)

### Email Template Setup

In Supabase Dashboard:
1. Go to **Authentication** → **Email Templates**
2. Select **Reset Email**
3. Customize email design (optional)
4. Default link includes:
   - `redirectTo` parameter
   - `type=recovery` parameter
   - `access_token` (in hash)

### Example Reset Link:
```
https://nyalix.com/reset-password#access_token=eyJ0eXAiOiJKV1QiLCJhbGc...&type=recovery&expires_in=3600
```

### Token Expiration
- Default: 1 hour (3600 seconds)
- Configurable in Supabase project settings
- Expired tokens show "Link Expired" message

---

## Query Parameter/Hash Fragment Handling

### Method 1: Hash Fragment (Recommended by Supabase)
```
#access_token=<token>&type=recovery
```
- More secure (not sent to server)
- Default Supabase behavior
- Extracted via `window.location.hash`

### Method 2: Query Parameters (Fallback)
```
?token_hash=<token>&type=recovery
```
- Used if hash method doesn't work
- Less secure but supported
- Extracted via `useLocation().search`

**Implementation supports both methods:**
```typescript
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const queryParams = new URLSearchParams(location.search);

const tokenHashParam = queryParams.get('token_hash') || 
                       hashParams.get('access_token');
```

---

## Complete User Flow

### Step 1: Request Reset
```
User → Auth Page (Forgot Password)
     → Enter Email
     → Click "Send Reset Link"
     → Supabase sends email
     → Toast: "Password reset link sent"
```

### Step 2: Verify Token
```
User clicks email link
     → Redirected to /reset-password?token=... (or #access_token=...)
     → ResetPassword component loads
     → Token verification starts
     → Shows loading spinner
```

### Step 3: Verify Success/Failure
```
Token Valid:
  → Show Reset Form
  → Enable password inputs
  
Token Invalid/Expired:
  → Show Error Message
  → Offer to request new link
```

### Step 4: Reset Password
```
Token Valid → User enters password
           → Confirms password
           → Form validates in real-time
           → Clicks "Update Password"
           → Supabase updateUser() called
```

### Step 5: Success
```
Password Updated Successfully
  → Show success checkmark
  → Toast: "Password updated successfully!"
  → Auto-redirect to login after 2 seconds
  → User can also click "Go to Login"
```

---

## Testing the Flow

### Manual Testing Steps:

1. **Test Reset Request**
   - Go to http://localhost:5173/auth
   - Click "Forgot password?"
   - Enter valid email
   - Should see success toast
   - Check email for reset link

2. **Test Token Verification**
   - Copy reset link from email
   - Paste in browser
   - Should show loading spinner
   - Should verify and show reset form

3. **Test Invalid/Expired Token**
   - Use expired token
   - Should show "Invalid Reset Link" error
   - Should not show password form

4. **Test Password Reset**
   - After verification succeeds
   - Enter valid password matching requirements
   - Confirm password
   - Click "Update Password"
   - Should pass and redirect to login

5. **Test Error Handling**
   - Try to submit with mismatched passwords
   - Try to submit with invalid password
   - Form should prevent submission

### Automated Testing

```typescript
// Example test case
describe('ResetPassword', () => {
  it('should verify token on mount', () => {
    // Extract mock token from URL
    // Call verifyOtp with token
    // Expect state to be 'verified'
  });

  it('should validate password requirements', () => {
    // Type invalid password
    // Expect error message
    // Expect button disabled
  });

  it('should update password successfully', () => {
    // Mock supabase.auth.updateUser
    // Submit form with valid data
    // Expect redirect to login
  });
});
```

---

## Troubleshooting

### Issue: "Invalid or expired reset link"
**Causes:**
- Token has expired (default: 1 hour)
- Token is malformed or missing
- Wrong URL parameters
- Browser cleared session

**Solution:**
- Request new password reset email
- Click link immediately after receiving email
- Check email timestamp (may be in spam)
- Clear browser cache and try again

### Issue: "Password update failed"
**Causes:**
- Session expired during reset
- Network connectivity issue
- Supabase service error
- Invalid password format

**Solution:**
- Verify password meets requirements
- Check network connection
- Request new reset link if session expired
- Check Supabase status page

### Issue: "Token verification stuck on loading"
**Causes:**
- Network issue during verification
- Supabase API timeout
- Invalid token hash format

**Solution:**
- Refresh the page
- Request new reset link
- Check browser console for errors
- Verify correct URL parameters

---

## Configuration

### Environment Variables
Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

### Supabase Settings
1. Go to Authentication → Policies
2. Ensure password reset is enabled
3. Configure token expiration time
4. Customize email template (optional)

---

## Security Best Practices

### What NOT to Do:
- ❌ Don't store tokens in localStorage
- ❌ Don't expose tokens in URLs (use hash)
- ❌ Don't validate password on backend only
- ❌ Don't auto-login after reset without confirmation

### What TO Do:
- ✅ Use secure hash fragments for tokens
- ✅ Validate passwords on frontend + backend
- ✅ Show clear verification states
- ✅ Expire tokens quickly
- ✅ Redirect to login after reset
- ✅ Log password reset attempts (audit trail)

---

## Future Enhancements

### Possible Improvements:

1. **Auto-Login After Reset**
   ```typescript
   await supabase.auth.setSession(...)
   navigate('/dashboard')
   ```

2. **Password Reset Confirmation Email**
   - Send confirmation after successful reset
   - Include timestamp and IP address
   - Allow reverting if unauthorized

3. **Security Questions**
   - Add optional security questions
   - Verify identity before sending reset link

4. **Multi-Factor Authentication**
   - Require MFA verification during reset
   - SMS or authenticator app verification

5. **Reset Link Expiration Notification**
   - Alert users when reset link is about to expire
   - Offer to resend link

6. **Admin Password Reset**
   - Allow admins to reset user passwords
   - Notification to user about reset attempt

---

## Files Modified/Created

1. **`src/pages/ResetPassword.tsx`** (Modified)
   - Complete implementation of password reset flow
   - Token verification logic
   - Password reset form
   - Error states and loading states

2. **`src/pages/Auth.tsx`** (No changes needed)
   - Already has forgot password functionality
   - Calls `resetPasswordForEmail()` correctly

3. **`src/lib/validation.ts`** (No changes needed)
   - Already has `validatePassword()` function
   - Meets security requirements

4. **`docs/PASSWORD_RESET_IMPLEMENTATION.md`** (Created)
   - This comprehensive documentation file

---

## Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Password Reset Guide](https://supabase.com/docs/guides/auth/auth-password-reset)
- [Authentication Context](src/contexts/AuthContext.tsx)
- [Validation Utilities](src/lib/validation.ts)

---

## Version History

- **v1.0** (2026-04-09)
  - Complete password reset flow implementation
  - Token verification with hash and query parameter support
  - Password validation and confirmation
  - Error handling and loading states
  - Success redirect to login
  - Comprehensive documentation
