# Navigation System Documentation

## Overview

The application now uses a unified navigation system (`MainNav`) that provides consistent navigation across all pages with proper authentication state handling.

## Navigation States

### 🔓 **Logged Out State**
**Available on:** Homepage, Marketplace, Pricing, App Detail pages

**Navigation Items:**
- Home (/)
- Marketplace (/marketplace)
- Pricing (/pricing)

**Auth Section:**
- Sign In button → `/auth/signin`
- Sign Up button → `/auth/signup`
- Install Rube button (with dropdown icon)

### 🔐 **Logged In State**
**Available on:** All pages when authenticated

**Navigation Items:**
- Home (/)
- Marketplace (/marketplace)
- Dashboard (/dashboard) - *only when logged in*
- Workspaces (/workspaces) - *only when logged in*
- Pricing (/pricing)

**Auth Section:**
- User Menu (dropdown with avatar)
  - Dashboard
  - Workspaces
  - Settings
  - Sign out

## Navigation Variants

### Default Variant
Used on public pages (Homepage, Marketplace, Pricing, App Details)
- Clean Rube-style design
- Underline active state
- Horizontal layout

### Dashboard Variant
Used on authenticated pages (Dashboard, Workspaces, Workspace Details)
- More compact design
- Button-style active state with primary color
- Integrated with authentication system

## Mobile Responsiveness

Both variants include:
- Hamburger menu on mobile devices
- Collapsible navigation items
- Mobile-optimized auth section
- Touch-friendly interactions

## Implementation

### Usage
```tsx
// For public pages
<MainNav />

// For dashboard/authenticated pages
<MainNav variant="dashboard" />
```

### Key Features
- **Automatic auth detection**: Shows different nav items based on login state
- **Active state highlighting**: Current page is visually highlighted
- **Mobile responsive**: Hamburger menu on small screens
- **Consistent branding**: Rube logo and styling throughout
- **Loading states**: Spinner while auth is loading

## Page Integration

### ✅ Updated Pages
- [x] Homepage (`/`)
- [x] Marketplace (`/marketplace`)
- [x] App Detail (`/marketplace/[id]`)
- [x] Pricing (`/pricing`)
- [x] Dashboard (`/dashboard`)
- [x] Workspaces (`/workspaces`)
- [x] Workspace Detail (`/workspaces/[id]`)

### Legacy Support
- `/tools` automatically redirects to `/marketplace`
- Old `DashboardNav` component replaced with unified `MainNav`

## Benefits

1. **Consistency**: Same navigation behavior across all pages
2. **Authentication Aware**: Automatically adapts to user login state
3. **Mobile Friendly**: Responsive design works on all devices
4. **Maintainable**: Single component to update for navigation changes
5. **Accessible**: Proper ARIA labels and keyboard navigation

## Navigation Logic

```
If user is NOT logged in:
  Show: Home, Marketplace, Pricing
  Auth: Sign In, Sign Up, Install Rube buttons

If user IS logged in:
  Show: Home, Marketplace, Dashboard, Workspaces, Pricing
  Auth: User menu with profile options

Active page is highlighted with:
  - Default variant: Underline + bold text
  - Dashboard variant: Primary background color
```

This system ensures users always know where they are and can easily navigate between sections regardless of their authentication state.
