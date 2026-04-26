# Redesign Implementation Plan

This plan outlines the steps required to redesign the application using the provided sharp, monochrome theme while preserving existing functionality.

## Goal
Migrate the entire frontend to a new minimal, high-contrast, zero-border-radius design system (Tailwind/Shadcn-inspired format). We will update global CSS, Tailwind config, and refactor inline styles across pages and components to fully embrace the new theme (dropdowns, cards, navigation, etc.).

## Proposed Changes

### 1. Global CSS & Theme System (`index.css` & `tailwind.config.js`)
- **[MODIFY] `index.css`**: 
  - Overwrite the existing "Cursor-inspired warm minimalism" variables with the newly provided `:root` and `.dark` blocks.
  - Remove all rounded corner utilities (`border-radius`, `borderRadius: 10px`) in components like `.card`, `.btn`, and `.input` to enforce the new `--radius: 0rem` aesthetic.
  - Remap core CSS classes (`.btn-primary`, `.btn-dark`, `.btn-ghost`, `.card`, `.input`, `.skeleton`) to explicitly use the new design tokens (e.g., `--primary`, `--secondary`, `--muted`, `--border`, `--background`).
- **[MODIFY] `tailwind.config.js`**:
  - Extend the Tailwind theme plugin to register the new CSS variables in the `colors` object (`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`).
  - This allows developers (and our updates) to use standard Tailwind utility classes like `bg-background`, `text-foreground`, `border-border`.

### 2. Components Refactoring
Many components currently use hardcoded inline styles referencing legacy variables (e.g., `var(--surface-100)`). They will be updated to standard Tailwind classes to adopt the new theme.

- **[MODIFY] `PlatformMultiSelect.jsx` (Dropdown)**:
  - Migrate inline surface colors (`var(--surface-200)`) and manual padding/borders to use Tailwind utilities (`bg-popover text-popover-foreground border-border`).
  - Remove explicit `borderRadius: 8` and `borderRadius: 4`.
  - Use the new `--primary` and `--destructive` variables for selections.
- **[MODIFY] `DatePicker.jsx` (Dropdown)**:
  - Update calendar popup surfaces and date selection states to use `bg-popover`, hover states with `bg-accent`, and selected dates with `bg-primary text-primary-foreground`.
- **[MODIFY] `CompetitionCard.jsx`**:
  - Replace `--surface-400` and `--shadow-card` with minimal brutalist card styles: `bg-card text-card-foreground border-border ring-ring shadow-none`.
  - Make bookmark icons use `--muted-foreground` and `--foreground` on hover.
- **[MODIFY] `Sidebar.jsx` & `AppShell.jsx`**:
  - Update navigations to use the new `--sidebar` background variables and corresponding text/accent values per the theme.

### 3. Pages Refactoring
Refactor pages to remove old inline variables and enforce the sharp, monochrome aesthetics.
- **[MODIFY] `LandingPage.jsx`**: Update hero sections, call-to-actions, and features.
- **[MODIFY] `HomePage.jsx`**: Refactor competition carousels, headers, and tabs.
- **[MODIFY] `ExplorePage.jsx`**: Update the filter layouts, floating panels, search inputs, and chips to use the newly configured Tailwind colors.
- **[MODIFY] `DashboardPage.jsx`**: Apply table-like/grid configurations matching the rigorous template.
- **[MODIFY] `ProfilePage.jsx`**: Update layout surfaces, form inputs, and avatars bounds.

## User Review Required
> [!WARNING]
> Because the new theme explicitly specifies `--radius: 0rem`, all UI elements (buttons, cards, dropdowns) will have strictly sharp corners. Make sure this brutalist/boxy style is precisely what you intend for the app's updated visual identity.

> [!IMPORTANT]
> The new theme switches the font to `Geist Mono` / `monospace`. I will update the Typography section in the application to drop all old serif fonts.

## Verification Plan
### Automated Verification
- Run `npm run lint` and `npm run test:coverage` to ensure component properties or application functionality hasn't crashed.
- Execute `npm run build` to verify Vite builds successfully with the modified `tailwind.config.js`.

### Manual Verification
- Visual check of Dropdowns (DatePicker, Platforms) to ensure selections register correctly without visual mismatches.
- Ensure Dark mode toggle switches cleanly between `#ffffff` and `#1a1a1a`-equivalent backgrounds.
