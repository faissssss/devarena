function buildError(code, message, details = undefined) {
  return { error: { code, message, details } };
}

function safeJsonParse(payload, source) {
  try {
    if (typeof payload === 'string') {
      return { data: JSON.parse(payload) };
    }

    return { data: payload };
  } catch (error) {
    return buildError(
      'INVALID_JSON',
      `Failed to parse ${source} response JSON: ${error.message}`
    );
  }
}

export function normalizeDate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const rawValue = typeof value === 'string' ? value.trim() : value;
  let date;

  if (typeof rawValue === 'number') {
    date = new Date(rawValue < 1000000000000 ? rawValue * 1000 : rawValue);
  } else if (/^\d+$/.test(String(rawValue))) {
    const numeric = Number(rawValue);
    date = new Date(String(rawValue).length <= 10 ? numeric * 1000 : numeric);
  } else {
    date = new Date(rawValue);
  }

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    return date.toISOString();
  } catch {
    return null;
  }
}

export function inferCategory(platform = '', tags = []) {
  const tagText = Array.isArray(tags) ? tags.join(' ').toLowerCase() : String(tags).toLowerCase();
  const platformText = String(platform).toLowerCase();
  const haystack = `${platformText} ${tagText}`;

  if (
    haystack.includes('kaggle') ||
    haystack.includes('machine learning') ||
    haystack.includes('data') ||
    haystack.includes('ai')
  ) {
    return 'AI/Data Science';
  }

  if (haystack.includes('hackathon') || haystack.includes('devpost') || haystack.includes('mlh')) {
    return 'Hackathons';
  }

  if (
    haystack.includes('ctf') ||
    haystack.includes('security') ||
    haystack.includes('pwn') ||
    haystack.includes('crypto')
  ) {
    return 'CTF/Security';
  }

  return 'Competitive Programming';
}

function normalizeCompetition(entry, overrides = {}) {
  const startDate = normalizeDate(overrides.start_date ?? entry.start_date);
  const endDate = normalizeDate(overrides.end_date ?? entry.end_date);
  const now = Date.now();
  const start = startDate ? new Date(startDate).getTime() : now;
  const end = endDate ? new Date(endDate).getTime() : null;
  const title = overrides.title ?? entry.title;
  const platform = overrides.platform ?? entry.platform;
  const url = overrides.url ?? entry.url;
  
  // Ensure end_date is always after start_date (add 1 hour minimum duration)
  const finalEndTime = end && end > start ? end : start + 60 * 60 * 1000;

  return {
    title: title && String(title).trim() ? title : 'Untitled Competition',
    description: overrides.description ?? entry.description ?? null,
    category: overrides.category ?? entry.category ?? 'Competitive Programming',
    platform: platform && String(platform).trim() ? platform : 'Unknown',
    url: url && String(url).trim() ? url : '#',
    start_date: startDate ?? new Date(now).toISOString(),
    end_date: new Date(finalEndTime).toISOString(),
    location: overrides.location ?? entry.location ?? 'Online',
    prize: overrides.prize ?? entry.prize ?? null,
    difficulty: overrides.difficulty ?? entry.difficulty ?? null,
    source: overrides.source ?? entry.source ?? 'kontests',
  };
}

export function parseKontestsResponse(payload) {
  const parsed = safeJsonParse(payload, 'Kontests');
  if (parsed.error) {
    return parsed;
  }

  const items = Array.isArray(parsed.data) ? parsed.data : [];
  return {
    competitions: items.map((item) =>
      normalizeCompetition(item, {
        title: item.name,
        url: item.url,
        start_date: item.start_time,
        end_date: item.end_time,
        platform: item.site,
        category: inferCategory(item.site),
        source: 'kontests',
      })
    ),
  };
}

export function parseCLISTResponse(payload) {
  const parsed = safeJsonParse(payload, 'CLIST');
  if (parsed.error) {
    return parsed;
  }

  const items = Array.isArray(parsed.data)
    ? parsed.data
    : Array.isArray(parsed.data?.objects)
      ? parsed.data.objects
      : [];

  return {
    competitions: items.map((item) =>
      normalizeCompetition(item, {
        title: item.event,
        url: item.href,
        start_date: item.start,
        end_date: item.end,
        platform: item.resource?.name ?? 'CLIST',
        category: inferCategory(item.resource?.name, item.categories ?? item.tags ?? []),
        description: item.description ?? null,
        location: item.host ?? item.location ?? 'Online',
        source: 'clist',
      })
    ),
  };
}

export function parseKaggleResponse(payload) {
  const parsed = safeJsonParse(payload, 'Kaggle');
  if (parsed.error) {
    return parsed;
  }

  const items = Array.isArray(parsed.data)
    ? parsed.data
    : Array.isArray(parsed.data?.competitions)
      ? parsed.data.competitions
      : [];

  return {
    competitions: items.map((item) => {
      // Handle both API response and CLI parsed format
      const title = item.title || (item.ref ? item.ref.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Untitled');
      const url = item.url || item.ref || '#';
      const deadline = item.deadline || item.deadlineDate || item.endDate;
      
      return normalizeCompetition(item, {
        title,
        url,
        start_date: item.enabledDate || item.startDate || new Date().toISOString(),
        end_date: deadline,
        platform: 'Kaggle',
        category: item.category === 'Featured' || item.category === 'Research' ? 'AI/Data Science' : inferCategory('Kaggle', item.tags ?? []),
        prize: item.reward || item.prize || null,
        description: item.description ?? null,
        location: 'Online',
        source: 'kaggle',
      });
    }),
  };
}
