# Admin Sidebar & Categories - Troubleshooting Guide

## Issue: Sidebar is Blank and Categories Not Available

### Step 1: Check Browser Console for Errors
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to the **Console** tab
3. Look for error messages starting with `[Categories]`
4. Check for any red error messages

### Step 2: Verify Categories Table Exists in Supabase

1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Run this query:
```sql
SELECT * FROM public.categories;
```

**Expected Result:** Should show 5 rows with categories like "Diagnostic", "Surgical", etc.

**If error occurs:** The migration hasn't been applied yet.

### Step 3: Apply the Migration

If the categories table doesn't exist, you need to run the migration manually:

1. In Supabase **SQL Editor**, copy and paste the entire content from:
   ```
   supabase/migrations/20260310_create_categories_table.sql
   ```

2. Click **Execute** (or Cmd+Enter)

3. Verify the table was created by running the query from Step 2

### Step 4: Check RLS Policies

1. In Supabase, go to **Authentication** → **Policies** (in left menu)
2. Look for `categories` table in the policies list
3. Verify these policies exist:
   - ✅ "Categories are viewable by everyone" (SELECT)
   - ✅ "Admins can manage categories" (ALL)

### Step 5: Check Admin Debugger

When you navigate to the admin page, you should see a debug panel in the bottom-right corner (only in development mode):

- **Categories Table:** Should show ✅ Exists
- **Categories Count:** Should show 5 (or number of categories added)
- **Error:** Should be empty (no red errors)

### Step 6: Check Browser Local Storage

1. Open DevTools → **Storage** or **Application** tab
2. Look for Supabase session data
3. If empty, user is not authenticated - need to log in first

### Step 7: Verify Sidebar CSS Classes

If sidebar exists but is invisible:

1. Open DevTools → **Inspector** (Elements tab)
2. Look for `<aside>` element with class `w-64`
3. Check if it has proper styling:
   - Background color should not be transparent
   - Width should be 256px (w-64)
   - Position should be fixed on desktop

### Step 8: Clear Cache and Restart

Sometimes the issue is cached data:

```bash
# Clear Bun cache
bun clean

# Restart dev server
bun run dev
```

## Quick Fixes

### Fix 1: Sidebar Not Showing on Desktop
- Check if your screen width is >= 1024px (lg: breakpoint)
- On smaller screens, use the hamburger menu to toggle sidebar

### Fix 2: Categories Dropdown Empty
- Make sure you ran the migration (Step 3)
- Check browser console for fetch errors
- Verify you're logged in as admin

### Fix 3: Console Shows "Table Does Not Exist"
- This means the migration didn't run
- Go to Supabase SQL Editor and manually run the migration file

## Database Check Commands

Run these in Supabase **SQL Editor** to verify everything:

```sql
-- Check if categories table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'categories';

-- Check RLS is enabled
SELECT * FROM information_schema.table_privileges 
WHERE table_name = 'categories';

-- Check categories count
SELECT COUNT(*) FROM public.categories;

-- List all categories
SELECT id, name, name_ar, order_index FROM public.categories ORDER BY order_index;

-- Check if admin role exists
SELECT * FROM public.user_roles WHERE role = 'admin';
```

## Expected Behavior

**Desktop (1024px and wider):**
- Sidebar should be **always visible** on the left
- Width: 256px
- Contains 9 menu items (Dashboard, Products, Orders, etc.)
- Active item highlighted in gold
- Can click items to navigate

**Mobile (under 1024px):**
- Sidebar **hidden by default**
- Hamburger menu icon in top-left
- Click menu to slide sidebar in from left
- Click item or menu icon again to close

**Categories Dropdown (Products tab):**
- Should show all 5 categories
- Selecting a category auto-populates Arabic name
- Arabic field is disabled (read-only)

## Still Having Issues?

Check these files for common problems:

1. **Migration File:** `supabase/migrations/20260310_create_categories_table.sql`
   - Ensure no syntax errors
   - All CREATE statements are present

2. **Categories Hook:** `src/hooks/useCategories.ts`
   - Check console for `[Categories]` logs
   - Verify real-time subscription connects

3. **Sidebar Component:** `src/components/AdminSidebar.tsx`
   - Check if desktop/mobile versions render
   - Verify CSS classes are applied

4. **Admin Page:** `src/pages/Admin.tsx`
   - Check if sidebar is being passed correct props
   - Verify `isOpen` state starts as `true`

## Debug Mode

To enable maximum logging:

1. Open `src/hooks/useCategories.ts`
2. Look for `console.log` statements with `[Categories]` prefix
3. These will log in browser console to help diagnose issues

## Verification Checklist

- [ ] Migration file exists: `supabase/migrations/20260310_create_categories_table.sql`
- [ ] Database shows categories table when queried
- [ ] Categories table has 5 rows (or your added categories)
- [ ] RLS policies are set on categories table
- [ ] Browser console shows no red errors
- [ ] Admin debugger shows: ✅ Exists and ✅ Categories Count > 0
- [ ] Sidebar appears on left (desktop) or toggle with menu (mobile)
- [ ] Products dropdown shows categories

## Need More Help?

Check the browser console logs for specific error messages. The debug info in bottom-right corner should help identify the exact issue.
