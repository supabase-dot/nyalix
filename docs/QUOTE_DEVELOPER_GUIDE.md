# Quote Request Form - Developer Integration Guide

## Quick Reference

### Adding a New UI String to Quote Form

1. **Add translation key to `src/lib/i18n.ts`:**

```typescript
// In English section (quote.form or quote.admin)
{
  quote: {
    newLabel: "New Label Text",
    newLabelAr: "نص التسمية الجديدة", // or in Arabic section
  }
}

// In Arabic section (parallel structure)
{
  quote: {
    admin: {
      newLabel: "تسمية جديدة",
    }
  }
}
```

2. **Use in component:**

```tsx
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

export const MyComponent = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  
  return (
    <label className={isRTL ? 'text-right' : ''}>
      {t('quote.newLabel')}
    </label>
  );
};
```

## Common Patterns

### Pattern 1: Label with Icon (RTL-Safe)
```tsx
<label className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
  <IconComponent className="w-4 h-4 flex-shrink-0" />
  {t('quote.labelKey')}
</label>
```

### Pattern 2: Text Input (RTL-Safe)
```tsx
<input
  type="text"
  placeholder={t('quote.placeholderKey')}
  dir={isRTL ? 'rtl' : 'ltr'}
  className={`${isRTL ? 'text-right' : ''}`}
/>
```

### Pattern 3: Button Group (RTL-Safe)
```tsx
<div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
  <button>{t('quote.cancelKey')}</button>
  <button>{t('quote.submitKey')}</button>
</div>
```

### Pattern 4: Status Display (Dynamic Translation)
```tsx
{status === 'Pending' ? t('quote.admin.stats.pending') :
 status === 'Responded' ? t('quote.admin.stats.responded') :
 status === 'Approved' ? t('quote.admin.stats.approved') :
 status}
```

## Event Handling

### Translation-Aware Error Messages
```tsx
const handleSubmit = async (e) => {
  if (!isValidEmail(email)) {
    toast.error(t('quote.emailValidationError')); // Changes with language
    return;
  }
};
```

### Confirmation Dialogs
```tsx
const handleDelete = (id) => {
  if (!confirm(t('quote.admin.deleteConfirm'))) return;
  // proceed with deletion
};
```

## RTL Considerations

### Never Manually Write Direction Strings
❌ Bad: `className="text-right"`  
✅ Good: `className={isRTL ? 'text-right' : ''}`

### Icon Positioning
Always use `flex-shrink-0` to prevent icon scaling:
```tsx
<Mail className="w-4 h-4 flex-shrink-0" />
```

### Email/Phone Fields
Always use `dir="ltr"` for email and phone inputs:
```tsx
<input type="email" dir="ltr" /> {/* Never RTL */}
<input type="tel" dir="ltr" />    {/* Never RTL */}
```

### Regular Text Input
Use dynamic direction:
```tsx
<input type="text" dir={isRTL ? 'rtl' : 'ltr'} />
<textarea dir={isRTL ? 'rtl' : 'ltr'} />
```

## Testing Translations

### 1. Test English Display
- Set browser language to English
- All text should appear in English
- LTR layout applied
- Text aligned left

### 2. Test Arabic Display
- Set browser language to Arabic (or use language switcher)
- All text should appear in Arabic
- RTL layout applied
- Text aligned right
- Icons positioned on left side

### 3. Test Language Switching
- Start in English
- Switch to Arabic → UI should update
- Switch back to English → UI should revert
- Form data should persist

### 4. Test Validation Messages
- Submit with empty fields
- Error message should appear in current language
- Invalid email → language-specific message

## Database Access

### Querying Quotes (No Language Filter)
```typescript
const { data } = await supabase
  .from('quote_requests')
  .select('*')
  .order('created_at', { ascending: false });
  
// Returns all quotes regardless of submission language
```

### Storing Quote (Language-Agnostic)
```typescript
await supabase.from('quote_requests').insert({
  name: formData.name,              // Stored as-is
  email: formData.email,            // Stored as-is
  message: formData.message,        // Stored as-is (may be in any language)
  status: 'Pending',
  // ... more fields
});
```

### Admin Response (Can Be Any Language)
```typescript
await supabase
  .from('quote_requests')
  .update({
    admin_response: responseText,  // Can be in any language
    admin_responded_at: new Date().toISOString(),
    status: 'Responded',
  })
  .eq('id', quoteId);
```

## Extending to More Languages

### Adding French (Example)
1. Add French section to `resources` in `src/lib/i18n.ts`:
```typescript
fr: {
  translation: {
    quote: {
      title: "Demander un devis",
      fullName: "Nom complet",
      // ... add all keys
    }
  }
}
```

2. Add RTL handling if needed:
```tsx
const { language, isRTL } = useLanguage(); // Add 'ar' to RTL check
```

3. Update language selector to include French option

## Troubleshooting

### Issue: Text Not Translating
**Solution:** Verify translation key exists in both language sections
```typescript
// Check /src/lib/i18n.ts - should have entries in both 'en' and 'ar'
t('quote.admin.stats.pending') // Must exist in both languages
```

### Issue: RTL Layout Broken
**Solution:** Check `isRTL` is imported and used correctly
```tsx
import { useLanguage } from '@/contexts/LanguageContext';
const { isRTL } = useLanguage(); // Must be inside component
```

### Issue: Icons Misaligned in RTL
**Solution:** Add `flex-shrink-0` to prevent scaling
```tsx
<MailIcon className="w-4 h-4 flex-shrink-0" /> ✅
<MailIcon className="w-4 h-4" /> ❌
```

### Issue: Email Input Shows RTL
**Solution:** Always use `dir="ltr"` for email/phone
```tsx
<input type="email" dir="ltr" /> ✅ Always LTR
<input type="email" dir={isRTL ? 'rtl' : 'ltr'} /> ❌ Wrong
```

## Performance Notes

- Translations are cached by react-i18next
- Language switching is near-instantaneous
- No database queries for translations
- All text stored in memory after initial load

## Security Notes

- User input stored as-is (no sanitization by language)
- Always validate email format regardless of language
- RLS policies enforce access control, not language
- Admin responses not auto-translated

## Related Files

- **Translations:** `src/lib/i18n.ts` (600+ lines)
- **Language Context:** `src/contexts/LanguageContext.tsx`
- **Quote Form:** `src/components/QuoteRequestModal.tsx`
- **Quote Admin:** `src/components/AdminQuotesTab.tsx`
- **Database:** `supabase/migrations/20260312025816_create_quote_requests_table.sql`
- **Integration:** `src/pages/ProductDetail.tsx`

## Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [Tailwind RTL Support](https://tailwindcss.com/docs/rtl)
- [WebRTC Internationalization](https://w3c.github.io/string-meta/)

---

**Last Updated:** March 12, 2026
