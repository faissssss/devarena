# HomePage Horizontal Scroll Implementation

## Summary

Successfully implemented a Netflix-style horizontal scrollable home page with three sections: Featured, Newest, and Popular competitions.

## Implementation Details

### 1. HomePage Component (`frontend/src/pages/HomePage.jsx`)

**Three Sections:**
- **Featured**: Shows upcoming competitions (limit: 50)
- **Newest**: Shows most recent competitions (limit: 50)
- **Popular**: Shows ongoing competitions (limit: 50)

**Key Features:**
- Horizontal scrollable layout with fixed 320px card width
- "View all →" links redirect to Explore page with appropriate filters
- Bookmarking support for authenticated users
- Loading skeletons and empty states
- Hidden scrollbars with smooth scrolling

**Horizontal Scroll Implementation:**
```jsx
<div style={{ 
  display: 'flex', 
  gap: 16, 
  overflowX: 'auto',
  overflowY: 'hidden',
  paddingBottom: 16,
  marginBottom: -16,
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  WebkitOverflowScrolling: 'touch',
}}
className="hide-scrollbar"
>
  {competitions.map((comp) => (
    <div key={comp.id} style={{ minWidth: 320, width: 320, flexShrink: 0 }}>
      <CompetitionCard ... />
    </div>
  ))}
</div>
```

### 2. CSS Updates (`frontend/src/index.css`)

Added `.hide-scrollbar` class to hide webkit scrollbars:
```css
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
```

This works in combination with:
- `scrollbarWidth: 'none'` (Firefox)
- `msOverflowStyle: 'none'` (IE/Edge)

### 3. Routing (`frontend/src/App.jsx`)

- `/` route shows HomePage (with sidebar)
- `/landing` route shows LandingPage (marketing page)
- HomePage is the new default authenticated home page

### 4. Logout Button (`frontend/src/pages/ProfilePage.jsx`)

Added "Account actions" section at bottom with logout button that:
- Signs out the user
- Redirects to `/landing` page

## Data Fetching Strategy

### API Limits
- Backend supports up to 100 competitions per request
- HomePage fetches 50 competitions per section for optimal performance
- Horizontal scroll allows users to browse many competitions without pagination

### Section Queries
1. **Featured**: `{ status: 'upcoming', limit: 50 }`
2. **Newest**: `{ limit: 50, page: 1 }` (sorted by start_date DESC)
3. **Popular**: `{ status: 'ongoing', limit: 50 }`

### View All Links
- Featured → `/explore?status=upcoming`
- Newest → `/explore`
- Popular → `/explore?status=ongoing`

## User Experience

### Scrolling Behavior
- Horizontal scroll within each section (one row per category)
- Scrollbars hidden but scroll functionality preserved
- Smooth touch scrolling on mobile devices
- Page doesn't move horizontally when scrolling sections

### Card Display
- Fixed 320px width per card
- 16px gap between cards
- Cards maintain full height and proper proportions
- Hover effects work correctly

### Loading States
- Skeleton cards shown while loading (6 per section)
- Empty state message if no competitions available
- Error handling with user-friendly messages

## Browser Compatibility

The horizontal scroll implementation works across all modern browsers:
- **Chrome/Edge**: `.hide-scrollbar::-webkit-scrollbar { display: none; }`
- **Firefox**: `scrollbarWidth: 'none'`
- **Safari**: `.hide-scrollbar::-webkit-scrollbar { display: none; }`
- **IE/Old Edge**: `msOverflowStyle: 'none'`

## Files Modified

1. `frontend/src/pages/HomePage.jsx` - Main implementation
2. `frontend/src/index.css` - Added `.hide-scrollbar` class
3. `frontend/src/App.jsx` - Updated routing (already done)
4. `frontend/src/pages/ProfilePage.jsx` - Added logout button (already done)

## Testing Recommendations

1. Test horizontal scroll on different screen sizes
2. Verify scrollbars are hidden but scroll works
3. Test with different numbers of competitions (0, 1, 5, 50)
4. Verify "View all" links navigate with correct filters
5. Test bookmarking functionality
6. Verify logout button redirects correctly
