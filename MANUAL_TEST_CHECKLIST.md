# Manual Test Checklist

## Core App

- Open landing page and verify hero, navigation, and CTA links render.
- Open explore page and verify competitions load.
- Apply category, status, source, and search filters.
- Open a competition detail page and verify metadata and external link.

## Authentication

- Register a new user.
- Confirm registration can flow into a working login session.
- Log out and log back in.
- Verify protected routes redirect unauthenticated users to login.

## Bookmarks

- Save a competition from explore.
- Save or remove a competition from detail.
- Confirm dashboard reflects current bookmarks.
- Confirm removing a bookmark updates the dashboard immediately.

## Admin

- Log in as an admin user.
- Open admin panel and verify stats load.
- Trigger manual sync and confirm success feedback.
- Verify sync logs refresh after sync.
- Edit a competition title.
- Delete a competition and confirm it disappears from the list.

## API And Data

- Hit `GET /api/health` and confirm `200`.
- Run migrations on a fresh database.
- Seed an admin user successfully.
- Verify scheduler starts with backend server in non-test mode.

## UX

- Verify app renders correctly on desktop and mobile widths.
- Check keyboard navigation through auth, explore filters, and dashboard actions.
- Verify no obvious layout breakage across landing, explore, detail, dashboard, admin, and profile.

## Performance

- Confirm production build completes.
- Confirm landing and explore pages load without obvious blocking or broken assets.
