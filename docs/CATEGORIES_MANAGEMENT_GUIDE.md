# Admin Dashboard - Categories Management

## Overview

The Categories Management section allows admins to create, read, update, and delete product categories directly from the Admin Dashboard without touching the code. All categories are stored in the database and automatically synchronized across the application.

## Features

✅ **Add Categories** - Create new categories with English and Arabic names
✅ **Edit Categories** - Modify existing category details
✅ **Delete Categories** - Remove categories (products remain unaffected)
✅ **Bilingual Support** - Full English and Arabic translations
✅ **Real-time Sync** - Changes appear instantly in Products dropdown
✅ **Display Order** - Control category order in dropdowns
✅ **Descriptions** - Optional bilingual descriptions for each category
✅ **Responsive UI** - Clean, modern admin interface

## Database Schema

The `categories` table includes:

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key, auto-generated |
| name | TEXT | Category name in English |
| name_ar | TEXT | Category name in Arabic |
| description | TEXT | Optional English description |
| description_ar | TEXT | Optional Arabic description |
| icon | TEXT | Optional icon identifier |
| order_index | INT | Display order (1 = first) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## How to Use

### 1. Access Categories Management

1. Go to Admin Dashboard
2. Click **Categories** in left sidebar (or look for the tag icon)
3. You'll see the Categories Management page

### 2. Add a New Category

**Method A: Using the Form**

1. Click **"+ Add Category"** button (top right)
2. Fill in the form:
   - **Category Name (English)**: e.g., "Diagnostic"
   - **Category Name (Arabic)**: e.g., "تشخيصي"
   - **Description (English)**: Optional details
   - **Description (Arabic)**: Optional Arabic details
   - **Display Order**: Position in dropdown (1, 2, 3, etc.)
3. Click **"Create Category"**
4. Category appears immediately in the list and in Products dropdown

### 3. Edit an Existing Category

1. Find the category in the list
2. Click **"Edit"** button
3. Modify the values
4. Click **"Update Category"**
5. Changes sync automatically across the app

### 4. Delete a Category

1. Find the category in the list
2. Click **"Delete"** button
3. Confirm the deletion
4. Category is removed (products are NOT deleted)

## Integration with Products

### Automatic Appearance in Products Dropdown

When you create a new category:

1. It automatically appears in the **Products** tab → **Add/Edit Product** form
2. The dropdown is pre-populated with all categories from the database
3. When you select a category, the Arabic name auto-populates

### Product-Category Relationship

- Each product can have ONE category
- Products reference categories by `category_id`
- Deleting a category doesn't delete products
- Products' `category` and `category_ar` fields remain as fallback

## UI Components

### Category Form Modal

The form includes:
- English name input (required)
- Arabic name input (required)
- English description (optional)
- Arabic description (optional)
- Display order number
- Create/Update button

**Form Validation:**
- Both name fields are required
- Arabic input has RTL (right-to-left) text direction
- Display order defaults to auto-increment

### Categories Table

Displays all categories with columns:
- **Name (EN)** - English category name
- **Name (AR)** - Arabic category name
- **Description** - Truncated for readability
- **Order** - Display position
- **Actions** - Edit and Delete buttons

**Table Features:**
- Hover effects for better UX
- Empty state message when no categories exist
- Responsive scrolling on mobile
- Color-coded action buttons (blue for edit, red for delete)

## Real-time Synchronization

The Categories Management uses Supabase real-time subscriptions:

### How It Works

1. When you add/edit/delete a category, the change is sent to the database
2. Supabase broadcasts the change in real-time
3. The `useCategoriesRealtime()` hook receives the update
4. All components using that hook update automatically
5. The Products dropdown instantly shows the new category

### No Page Refresh Required

- Changes appear immediately
- Multiple admins can work simultaneously
- Conflicts are handled by database timestamps

## Default Categories (Pre-loaded)

When the migration runs, these categories are automatically created:

| English | Arabic | Order |
|---------|--------|-------|
| Diagnostic | تشخيصي | 1 |
| Surgical | جراحي | 2 |
| ICU Equipment | معدات العناية المركزة | 3 |
| Laboratory | مختبري | 4 |
| Imaging | التصوير | 5 |

You can edit or delete these and replace them with your own.

## API Operations

### Add Category

```typescript
const saveCategory = async (e: React.FormEvent) => {
  const { error } = await supabase
    .from('categories')
    .insert({
      name: 'Your Category',
      name_ar: 'فئتك'
    });
};
```

### Update Category

```typescript
const { error } = await supabase
  .from('categories')
  .update({
    name: 'Updated Name',
    name_ar: 'الاسم المحدث'
  })
  .eq('id', categoryId);
```

### Delete Category

```typescript
const { error } = await supabase
  .from('categories')
  .delete()
  .eq('id', categoryId);
```

### Fetch Categories

```typescript
const { categories } = useCategoriesRealtime();
// Returns Category[] with real-time updates
```

## Access Control

### Who Can Access

- **Admins**: Full access (add, edit, delete)
- **Non-admins**: Read-only visibility

### Security Policies (RLS)

```sql
-- Anyone can view categories
SELECT: true (no authentication needed)

-- Only admins can modify
INSERT/UPDATE/DELETE: has_role(auth.uid(), 'admin')
```

## Troubleshooting

### Categories Not Appearing

1. **Check migration**: Ensure `20260310_create_categories_table.sql` was executed
2. **Check browser console**: Look for errors
3. **Check database**: Run `SELECT * FROM categories;` in Supabase SQL editor
4. **Clear cache**: Refresh the page (Ctrl+F5 or Cmd+Shift+R)

### Can't Add/Edit Categories

1. Verify you're logged in as admin
2. Check console for error messages (F12 → Console)
3. Ensure all required fields are filled
4. Check Supabase RLS policies are enabled

### Arabic Text Not Displaying

1. Ensure the category was saved with Arabic text
2. Check browser font supports Arabic characters
3. Verify database stored the text correctly in Supabase

### Categories Not in Products Dropdown

1. Refresh the Products tab
2. Check if categories hook is loading (look for debug panel)
3. Verify real-time subscription is connected
4. The dropdown filters may be active - clear any filters

## Performance Considerations

### Caching

- Categories are cached for 5 minutes
- Real-time updates bypass cache
- Multiple fetches don't hit database if data is fresh

### Database Impact

- Minimal: Categories table is small (typically < 100 rows)
- One index on `order_index` for fast sorting
- No performance issues expected with hundreds of categories

## File Locations

| File | Purpose |
|------|---------|
| `src/pages/Admin.tsx` | Main admin page with categories section |
| `src/components/AdminSidebar.tsx` | Sidebar with categories navigation |
| `src/hooks/useCategories.ts` | Category data fetching and real-time sync |
| `supabase/migrations/20260310_create_categories_table.sql` | Database schema |

## Future Enhancements (Possible)

- [ ] Bulk import/export categories from CSV
- [ ] Category icons/images
- [ ] Category visibility toggles
- [ ] Drag-and-drop reordering
- [ ] Category analytics (products per category)
- [ ] Bulk category assignment to products
- [ ] Category hierarchy (parent/child)

## Support

For issues or questions:
1. Check the browser console (F12)
2. Look for debug panel in bottom-right corner
3. Verify migration was applied: `SELECT * FROM categories;`
4. Check RLS policies in Supabase Dashboard

---

**Implementation Date:** March 10, 2026
**Status:** ✅ Complete and Production Ready
