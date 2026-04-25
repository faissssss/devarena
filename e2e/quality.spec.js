import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectNoSeriousA11yIssues(page) {
  const results = await new AxeBuilder({ page }).analyze();
  const seriousViolations = results.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact)
  );

  expect(seriousViolations, JSON.stringify(seriousViolations, null, 2)).toEqual([]);
}

async function mockApi(page) {
  const competitions = [
    {
      id: 'comp-1',
      title: 'Kaggle Vision Challenge',
      description: 'Build a computer vision model for satellite imagery.',
      category: 'AI/Data Science',
      platform: 'Kaggle',
      url: 'https://example.com/kaggle-vision',
      start_date: '2026-05-01T00:00:00.000Z',
      end_date: '2026-05-10T00:00:00.000Z',
      status: 'upcoming',
      location: 'Online',
      prize: '$10,000',
      difficulty: 'Advanced',
      source: 'kaggle',
    },
  ];

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    const json = (status, body) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (path === '/api/competitions') {
      return json(200, {
        competitions,
        totalCount: competitions.length,
        totalPages: 1,
        page: 1,
        limit: 9,
      });
    }

    if (path.startsWith('/api/competitions/')) {
      return json(200, { competition: competitions[0] });
    }

    if (path === '/api/bookmarks') {
      return json(200, { bookmarks: [] });
    }

    if (path.startsWith('/api/bookmarks/competition/')) {
      return json(200, { bookmark: null });
    }

    if (path === '/api/users/me') {
      return json(200, {
        user: {
          id: 'user-1',
          username: 'devuser',
          email: 'dev@example.com',
          role: 'user',
          created_at: '2026-04-25T00:00:00.000Z',
        },
        stats: { bookmarkCount: 0 },
      });
    }

    return json(404, { error: { message: `Unhandled route: ${path}` } });
  });
}

test('landing page passes keyboard and accessibility smoke checks', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: /a calmer way to hunt for your next big build/i,
    })
  ).toBeVisible();
  const domContentLoadedMs = await page.evaluate(() => {
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    return navigationEntry ? navigationEntry.domContentLoadedEventEnd : performance.now();
  });
  expect(domContentLoadedMs).toBeLessThan(2500);

  await expectNoSeriousA11yIssues(page);

  await page.keyboard.press('Tab');
  const activeElementInfo = await page.evaluate(() => ({
    tagName: document.activeElement?.tagName ?? '',
    text: document.activeElement?.textContent?.trim() ?? '',
  }));
  expect(['A', 'BUTTON', 'INPUT', 'SELECT']).toContain(activeElementInfo.tagName);
  expect(activeElementInfo.text.length).toBeGreaterThan(0);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test('login and explore flows stay accessible and responsive', async ({ page }) => {
  await mockApi(page);

  await page.goto('/login');
  await expectNoSeriousA11yIssues(page);

  await page.goto('/explore');
  await expect(page.getByText('Kaggle Vision Challenge')).toBeVisible();

  const filterStartedAt = await page.evaluate(() => performance.now());
  await page.getByLabel('Search competitions').fill('vision');
  await expect(page.getByText('Kaggle Vision Challenge')).toBeVisible();
  const filterEndedAt = await page.evaluate(() => performance.now());
  expect(filterEndedAt - filterStartedAt).toBeLessThan(750);

  await expectNoSeriousA11yIssues(page);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );
  expect(hasHorizontalOverflow).toBe(false);
});
