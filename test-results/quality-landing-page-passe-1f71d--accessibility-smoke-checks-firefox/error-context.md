# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quality.spec.js >> landing page passes keyboard and accessibility smoke checks
- Location: e2e\quality.spec.js:83:5

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 2500
Received:   3726
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - banner [ref=e5]:
    - generic [ref=e6]:
      - link "DA DevArena Competition radar" [ref=e7] [cursor=pointer]:
        - /url: /
        - generic [ref=e8]: DA
        - generic [ref=e9]:
          - paragraph [ref=e10]: DevArena
          - paragraph [ref=e11]: Competition radar
      - navigation [ref=e12]:
        - link "Home" [ref=e13] [cursor=pointer]:
          - /url: /
        - link "Explore" [ref=e14] [cursor=pointer]:
          - /url: /explore
        - link "Dashboard" [ref=e15] [cursor=pointer]:
          - /url: /dashboard
        - link "Profile" [ref=e16] [cursor=pointer]:
          - /url: /profile
      - generic [ref=e17]:
        - link "Login" [ref=e18] [cursor=pointer]:
          - /url: /login
        - link "Sign Up" [ref=e19] [cursor=pointer]:
          - /url: /register
  - main [ref=e20]:
    - generic [ref=e21]:
      - generic [ref=e24]:
        - generic [ref=e25]:
          - paragraph [ref=e26]: Developer competition intelligence
          - heading "A calmer way to hunt for your next big build." [level=1] [ref=e27]
          - paragraph [ref=e28]: DevArena turns scattered competition feeds into one editorial dashboard, built for developers who want signal instead of noise.
          - generic [ref=e29]:
            - link "Explore competitions" [ref=e30] [cursor=pointer]:
              - /url: /explore
            - link "Create account" [ref=e31] [cursor=pointer]:
              - /url: /register
        - generic [ref=e32]:
          - generic [ref=e33]:
            - heading "Multi-source aggregation" [level=2] [ref=e34]
            - paragraph [ref=e35]: Track coding contests, Kaggle competitions, and discovery signals from a single radar.
          - generic [ref=e36]:
            - heading "Fast filtering" [level=2] [ref=e37]
            - paragraph [ref=e38]: Slice by category, timing, and source without losing the bigger picture.
          - generic [ref=e39]:
            - heading "Personal watchlists" [level=2] [ref=e40]
            - paragraph [ref=e41]: Bookmark the competitions that matter and keep your deadline pressure visible.
      - generic [ref=e43]:
        - paragraph [ref=e44]: What you get
        - heading "One surface for scouting, saving, and acting." [level=2] [ref=e45]
        - paragraph [ref=e46]: Move from broad discovery to focused follow-through with fewer tabs, fewer missed deadlines, and a more deliberate shortlist.
```

# Test source

```ts
  1   | import AxeBuilder from '@axe-core/playwright';
  2   | import { expect, test } from '@playwright/test';
  3   | 
  4   | async function expectNoSeriousA11yIssues(page) {
  5   |   const results = await new AxeBuilder({ page }).analyze();
  6   |   const seriousViolations = results.violations.filter((violation) =>
  7   |     ['serious', 'critical'].includes(violation.impact)
  8   |   );
  9   | 
  10  |   expect(seriousViolations, JSON.stringify(seriousViolations, null, 2)).toEqual([]);
  11  | }
  12  | 
  13  | async function mockApi(page) {
  14  |   const competitions = [
  15  |     {
  16  |       id: 'comp-1',
  17  |       title: 'Kaggle Vision Challenge',
  18  |       description: 'Build a computer vision model for satellite imagery.',
  19  |       category: 'AI/Data Science',
  20  |       platform: 'Kaggle',
  21  |       url: 'https://example.com/kaggle-vision',
  22  |       start_date: '2026-05-01T00:00:00.000Z',
  23  |       end_date: '2026-05-10T00:00:00.000Z',
  24  |       status: 'upcoming',
  25  |       location: 'Online',
  26  |       prize: '$10,000',
  27  |       difficulty: 'Advanced',
  28  |       source: 'kaggle',
  29  |     },
  30  |   ];
  31  | 
  32  |   await page.route('**/api/**', async (route) => {
  33  |     const request = route.request();
  34  |     const url = new URL(request.url());
  35  |     const path = url.pathname;
  36  | 
  37  |     const json = (status, body) =>
  38  |       route.fulfill({
  39  |         status,
  40  |         contentType: 'application/json',
  41  |         body: JSON.stringify(body),
  42  |       });
  43  | 
  44  |     if (path === '/api/competitions') {
  45  |       return json(200, {
  46  |         competitions,
  47  |         totalCount: competitions.length,
  48  |         totalPages: 1,
  49  |         page: 1,
  50  |         limit: 9,
  51  |       });
  52  |     }
  53  | 
  54  |     if (path.startsWith('/api/competitions/')) {
  55  |       return json(200, { competition: competitions[0] });
  56  |     }
  57  | 
  58  |     if (path === '/api/bookmarks') {
  59  |       return json(200, { bookmarks: [] });
  60  |     }
  61  | 
  62  |     if (path.startsWith('/api/bookmarks/competition/')) {
  63  |       return json(200, { bookmark: null });
  64  |     }
  65  | 
  66  |     if (path === '/api/users/me') {
  67  |       return json(200, {
  68  |         user: {
  69  |           id: 'user-1',
  70  |           username: 'devuser',
  71  |           email: 'dev@example.com',
  72  |           role: 'user',
  73  |           created_at: '2026-04-25T00:00:00.000Z',
  74  |         },
  75  |         stats: { bookmarkCount: 0 },
  76  |       });
  77  |     }
  78  | 
  79  |     return json(404, { error: { message: `Unhandled route: ${path}` } });
  80  |   });
  81  | }
  82  | 
  83  | test('landing page passes keyboard and accessibility smoke checks', async ({ page }) => {
  84  |   await page.goto('/');
  85  |   await expect(
  86  |     page.getByRole('heading', {
  87  |       name: /a calmer way to hunt for your next big build/i,
  88  |     })
  89  |   ).toBeVisible();
  90  |   const domContentLoadedMs = await page.evaluate(() => {
  91  |     const navigationEntry = performance.getEntriesByType('navigation')[0];
  92  |     return navigationEntry ? navigationEntry.domContentLoadedEventEnd : performance.now();
  93  |   });
> 94  |   expect(domContentLoadedMs).toBeLessThan(2500);
      |                              ^ Error: expect(received).toBeLessThan(expected)
  95  | 
  96  |   await expectNoSeriousA11yIssues(page);
  97  | 
  98  |   await page.keyboard.press('Tab');
  99  |   await expect(page.getByRole('link', { name: 'Home' })).toBeFocused();
  100 | 
  101 |   const hasHorizontalOverflow = await page.evaluate(
  102 |     () => document.documentElement.scrollWidth > window.innerWidth + 1
  103 |   );
  104 |   expect(hasHorizontalOverflow).toBe(false);
  105 | });
  106 | 
  107 | test('login and explore flows stay accessible and responsive', async ({ page }) => {
  108 |   await mockApi(page);
  109 | 
  110 |   await page.goto('/login');
  111 |   await expectNoSeriousA11yIssues(page);
  112 | 
  113 |   await page.goto('/explore');
  114 |   await expect(page.getByText('Kaggle Vision Challenge')).toBeVisible();
  115 | 
  116 |   const filterStartedAt = await page.evaluate(() => performance.now());
  117 |   await page.getByLabel('Search competitions').fill('vision');
  118 |   await expect(page.getByText('Kaggle Vision Challenge')).toBeVisible();
  119 |   const filterEndedAt = await page.evaluate(() => performance.now());
  120 |   expect(filterEndedAt - filterStartedAt).toBeLessThan(750);
  121 | 
  122 |   await expectNoSeriousA11yIssues(page);
  123 | 
  124 |   const hasHorizontalOverflow = await page.evaluate(
  125 |     () => document.documentElement.scrollWidth > window.innerWidth + 1
  126 |   );
  127 |   expect(hasHorizontalOverflow).toBe(false);
  128 | });
  129 | 
```