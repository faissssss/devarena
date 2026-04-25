# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quality.spec.js >> login and explore flows stay accessible and responsive
- Location: e2e\quality.spec.js:107:5

# Error details

```
Error: [
  {
    "id": "color-contrast",
    "impact": "serious",
    "tags": [
      "cat.color",
      "wcag2aa",
      "wcag143",
      "TTv5",
      "TT13.c",
      "EN-301-549",
      "EN-9.1.4.3",
      "ACT",
      "RGAAv4",
      "RGAA-3.2.1"
    ],
    "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
    "help": "Elements must meet minimum color contrast ratio thresholds",
    "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright",
    "nodes": [
      {
        "any": [
          {
            "id": "color-contrast",
            "data": {
              "fgColor": "#78716c",
              "bgColor": "#f8f4ec",
              "contrastRatio": 4.37,
              "fontSize": "8.3pt (11px)",
              "fontWeight": "normal",
              "messageKey": null,
              "expectedContrastRatio": "4.5:1"
            },
            "relatedNodes": [
              {
                "html": "<body>",
                "target": [
                  "body"
                ]
              }
            ],
            "impact": "serious",
            "message": "Element has insufficient color contrast of 4.37 (foreground color: #78716c, background color: #f8f4ec, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1"
          }
        ],
        "all": [],
        "none": [],
        "impact": "serious",
        "html": "<p class=\"mb-3 text-[11px] uppercase tracking-[0.34em] text-stone-500\">Explore</p>",
        "target": [
          ".mb-3"
        ],
        "failureSummary": "Fix any of the following:\n  Element has insufficient color contrast of 4.37 (foreground color: #78716c, background color: #f8f4ec, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1"
      },
      {
        "any": [
          {
            "id": "color-contrast",
            "data": {
              "fgColor": "#a8a29e",
              "bgColor": "#fefdfb",
              "contrastRatio": 2.48,
              "fontSize": "8.3pt (11px)",
              "fontWeight": "normal",
              "messageKey": null,
              "expectedContrastRatio": "4.5:1"
            },
            "relatedNodes": [
              {
                "html": "<article class=\"group rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(28,25,23,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_70px_rgba(28,25,23,0.14)]\">",
                "target": [
                  "article"
                ]
              },
              {
                "html": "<body>",
                "target": [
                  "body"
                ]
              }
            ],
            "impact": "serious",
            "message": "Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1"
          }
        ],
        "all": [],
        "none": [],
        "impact": "serious",
        "html": "<p class=\"text-[11px] uppercase tracking-[0.24em] text-stone-400\">Starts</p>",
        "target": [
          "div:nth-child(1) > .text-stone-400.text-\\[11px\\].tracking-\\[0\\.24em\\]"
        ],
        "failureSummary": "Fix any of the following:\n  Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1"
      },
      {
        "any": [
          {
            "id": "color-contrast",
            "data": {
              "fgColor": "#a8a29e",
              "bgColor": "#fefdfb",
              "contrastRatio": 2.48,
              "fontSize": "8.3pt (11px)",
              "fontWeight": "normal",
              "messageKey": null,
              "expectedContrastRatio": "4.5:1"
            },
            "relatedNodes": [
              {
                "html": "<article class=\"group rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(28,25,23,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_70px_rgba(28,25,23,0.14)]\">",
                "target": [
                  "article"
                ]
              },
              {
                "html": "<body>",
                "target": [
                  "body"
                ]
              }
            ],
            "impact": "serious",
            "message": "Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1"
          }
        ],
        "all": [],
        "none": [],
        "impact": "serious",
        "html": "<p class=\"text-[11px] uppercase tracking-[0.24em] text-stone-400\">Ends</p>",
        "target": [
          "div:nth-child(2) > .text-stone-400.text-\\[11px\\].tracking-\\[0\\.24em\\]"
        ],
        "failureSummary": "Fix any of the following:\n  Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1"
      },
      {
        "any": [
          {
            "id": "color-contrast",
            "data": {
              "fgColor": "#a8a29e",
              "bgColor": "#fefdfb",
              "contrastRatio": 2.48,
              "fontSize": "8.3pt (11px)",
              "fontWeight": "normal",
              "messageKey": null,
              "expectedContrastRatio": "4.5:1"
            },
            "relatedNodes": [
              {
                "html": "<article class=\"group rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(28,25,23,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_70px_rgba(28,25,23,0.14)]\">",
                "target": [
                  "article"
                ]
              },
              {
                "html": "<body>",
                "target": [
                  "body"
                ]
              }
            ],
            "impact": "serious",
            "message": "Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1"
          }
        ],
        "all": [],
        "none": [],
        "impact": "serious",
        "html": "<p class=\"text-[11px] uppercase tracking-[0.24em] text-stone-400\">Source</p>",
        "target": [
          "div:nth-child(3) > .text-stone-400.text-\\[11px\\].tracking-\\[0\\.24em\\]"
        ],
        "failureSummary": "Fix any of the following:\n  Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1"
      },
      {
        "any": [
          {
            "id": "color-contrast",
            "data": {
              "fgColor": "#a8a29e",
              "bgColor": "#fefdfb",
              "contrastRatio": 2.48,
              "fontSize": "8.3pt (11px)",
              "fontWeight": "normal",
              "messageKey": null,
              "expectedContrastRatio": "4.5:1"
            },
            "relatedNodes": [
              {
                "html": "<article class=\"group rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(28,25,23,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_70px_rgba(28,25,23,0.14)]\">",
                "target": [
                  "article"
                ]
              },
              {
                "html": "<body>",
                "target": [
                  "body"
                ]
              }
            ],
            "impact": "serious",
            "message": "Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1"
          }
        ],
        "all": [],
        "none": [],
        "impact": "serious",
        "html": "<p class=\"text-[11px] uppercase tracking-[0.24em] text-stone-400\">Status</p>",
        "target": [
          "div:nth-child(4) > .text-stone-400.text-\\[11px\\].tracking-\\[0\\.24em\\]"
        ],
        "failureSummary": "Fix any of the following:\n  Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1"
      }
    ]
  }
]

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 222

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f8f4ec",
+               "contrastRatio": 4.37,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#78716c",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.37 (foreground color: #78716c, background color: #f8f4ec, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.37 (foreground color: #78716c, background color: #f8f4ec, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"mb-3 text-[11px] uppercase tracking-[0.34em] text-stone-500\">Explore</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mb-3",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#fefdfb",
+               "contrastRatio": 2.48,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#a8a29e",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<article class=\"group rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(28,25,23,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_70px_rgba(28,25,23,0.14)]\">",
+                 "target": Array [
+                   "article",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-[11px] uppercase tracking-[0.24em] text-stone-400\">Starts</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div:nth-child(1) > .text-stone-400.text-\\[11px\\].tracking-\\[0\\.24em\\]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#fefdfb",
+               "contrastRatio": 2.48,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#a8a29e",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<article class=\"group rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(28,25,23,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_70px_rgba(28,25,23,0.14)]\">",
+                 "target": Array [
+                   "article",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-[11px] uppercase tracking-[0.24em] text-stone-400\">Ends</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div:nth-child(2) > .text-stone-400.text-\\[11px\\].tracking-\\[0\\.24em\\]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#fefdfb",
+               "contrastRatio": 2.48,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#a8a29e",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<article class=\"group rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(28,25,23,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_70px_rgba(28,25,23,0.14)]\">",
+                 "target": Array [
+                   "article",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-[11px] uppercase tracking-[0.24em] text-stone-400\">Source</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div:nth-child(3) > .text-stone-400.text-\\[11px\\].tracking-\\[0\\.24em\\]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#fefdfb",
+               "contrastRatio": 2.48,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#a8a29e",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<article class=\"group rounded-[1.8rem] border border-stone-900/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(28,25,23,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_70px_rgba(28,25,23,0.14)]\">",
+                 "target": Array [
+                   "article",
+                 ],
+               },
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.48 (foreground color: #a8a29e, background color: #fefdfb, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-[11px] uppercase tracking-[0.24em] text-stone-400\">Status</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div:nth-child(4) > .text-stone-400.text-\\[11px\\].tracking-\\[0\\.24em\\]",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - banner [ref=e5]:
    - generic [ref=e6]:
      - link "DA DevArena Competition radar" [ref=e7]:
        - /url: /
        - generic [ref=e8]: DA
        - generic [ref=e9]:
          - paragraph [ref=e10]: DevArena
          - paragraph [ref=e11]: Competition radar
      - navigation [ref=e12]:
        - link "Home" [ref=e13]:
          - /url: /
        - link "Explore" [ref=e14]:
          - /url: /explore
        - link "Dashboard" [ref=e15]:
          - /url: /dashboard
        - link "Profile" [ref=e16]:
          - /url: /profile
      - generic [ref=e17]:
        - link "Login" [ref=e18]:
          - /url: /login
        - link "Sign Up" [ref=e19]:
          - /url: /register
  - main [ref=e20]:
    - generic [ref=e21]:
      - generic [ref=e22]:
        - paragraph [ref=e23]: Explore
        - heading "Search the current field." [level=2] [ref=e24]
        - paragraph [ref=e25]: Filter by source, status, and search terms to narrow the competitions worth your next sprint.
      - generic [ref=e26]:
        - complementary [ref=e27]:
          - generic [ref=e28]:
            - textbox "Search competitions" [active] [ref=e29]:
              - /placeholder: Search titles or descriptions
              - text: vision
            - combobox "Filter by category" [ref=e30]:
              - option "All categories" [selected]
              - option "Competitive Programming"
              - option "AI/Data Science"
              - option "Hackathons"
              - option "CTF/Security"
            - combobox "Filter by status" [ref=e31]:
              - option "All statuses" [selected]
              - option "Upcoming"
              - option "Ongoing"
              - option "Ended"
            - combobox "Filter by source" [ref=e32]:
              - option "All sources" [selected]
              - option "Kontests"
              - option "CLIST"
              - option "Kaggle"
        - generic [ref=e33]:
          - article [ref=e35]:
            - generic [ref=e36]:
              - generic [ref=e37]:
                - paragraph [ref=e38]: Kaggle • AI/Data Science
                - heading "Kaggle Vision Challenge" [level=3] [ref=e39]
              - button "Save" [ref=e40] [cursor=pointer]
            - paragraph [ref=e41]: Build a computer vision model for satellite imagery.
            - generic [ref=e42]:
              - generic [ref=e43]:
                - paragraph [ref=e44]: Starts
                - paragraph [ref=e45]: 5/1/2026, 7:00:00 AM
              - generic [ref=e46]:
                - paragraph [ref=e47]: Ends
                - paragraph [ref=e48]: 5/10/2026, 7:00:00 AM
              - generic [ref=e49]:
                - paragraph [ref=e50]: Source
                - paragraph [ref=e51]: kaggle
              - generic [ref=e52]:
                - paragraph [ref=e53]: Status
                - paragraph [ref=e54]: upcoming
            - generic [ref=e55]:
              - generic [ref=e56]: Online
              - link "View details" [ref=e57]:
                - /url: /competitions/comp-1
          - generic [ref=e58]:
            - button "Previous" [disabled] [ref=e59]
            - generic [ref=e60]: Page 1 of 1
            - button "Next" [disabled] [ref=e61]
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
> 10  |   expect(seriousViolations, JSON.stringify(seriousViolations, null, 2)).toEqual([]);
      |                                                                         ^ Error: [
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
  94  |   expect(domContentLoadedMs).toBeLessThan(2500);
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
```