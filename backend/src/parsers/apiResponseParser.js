import { inferCategory } from '../services/categoryInferenceEngine.js';

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

function normalizeCompetition(entry, overrides = {}) {
  const startDate = normalizeDate(overrides.start_date ?? entry.start_date);
  const endDate = normalizeDate(overrides.end_date ?? entry.end_date);
  const now = Date.now();
  
  // If no start date provided but end date exists, set start to 1 hour before end
  // This handles cases like Kaggle where we only know the deadline
  let finalStartDate;
  let finalEndDate;
  
  if (!startDate && endDate) {
    // Only have end date (deadline) - set start to 1 hour before
    const endTime = new Date(endDate).getTime();
    finalStartDate = new Date(endTime - 60 * 60 * 1000).toISOString();
    finalEndDate = endDate;
  } else if (startDate && endDate) {
    // Have both dates - use them
    finalStartDate = startDate;
    finalEndDate = endDate;
    
    // Ensure end is after start
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end <= start) {
      finalEndDate = new Date(start + 60 * 60 * 1000).toISOString();
    }
  } else if (startDate && !endDate) {
    // Only have start date - set end to 1 hour after
    const startTime = new Date(startDate).getTime();
    finalStartDate = startDate;
    finalEndDate = new Date(startTime + 60 * 60 * 1000).toISOString();
  } else {
    // No dates at all - use current time
    finalStartDate = new Date(now).toISOString();
    finalEndDate = new Date(now + 60 * 60 * 1000).toISOString();
  }
  
  const title = overrides.title ?? entry.title;
  const platform = overrides.platform ?? entry.platform;
  const url = overrides.url ?? entry.url;

  return {
    title: title && String(title).trim() ? title : 'Untitled Competition',
    description: overrides.description ?? entry.description ?? null,
    category: overrides.category ?? entry.category ?? 'Competitive Programming',
    platform: platform && String(platform).trim() ? platform : 'Unknown',
    url: url && String(url).trim() ? url : '#',
    start_date: finalStartDate,
    end_date: finalEndDate,
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
        category: inferCategory(item.site, item.name, '', []),
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
        platform: item.resource || item.host || 'CLIST',
        category: inferCategory(
          item.resource || item.host || 'CLIST',
          item.event ?? '',
          item.description ?? '',
          item.categories ?? item.tags ?? []
        ),
        description: item.description || null,
        location: item.location || 'Online', // Only use actual location field, default to Online
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

  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  return {
    competitions: items
      .filter((item) => {
        // Filter: Keep competitions from the past year onwards
        const deadline = item.deadline || item.deadlineDate || item.endDate;
        if (!deadline) return true; // Keep if no deadline
        
        const deadlineDate = new Date(deadline);
        return deadlineDate >= oneYearAgo; // Keep if deadline is within past year or future
      })
      .map((item) => {
        // Handle both API response and CLI parsed format
        const title = item.title || (item.ref ? item.ref.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Untitled');
        const url = item.url || item.ref || '#';
        const deadline = item.deadline || item.deadlineDate || item.endDate;
        const description = item.description ?? '';
        const tags = item.tags ?? [];
        
        // IMPORTANT: Kaggle CLI only provides deadline, NOT start date
        // We use the deadline as end_date and leave start_date as null
        // The frontend should handle displaying "Deadline: [date]" instead of date range
        
        return normalizeCompetition(item, {
          title,
          url,
          start_date: item.enabledDate || item.startDate || null, // null if not provided
          end_date: deadline,
          platform: 'Kaggle',
          category: item.category === 'Featured' || item.category === 'Research' 
            ? 'AI/Data Science' 
            : inferCategory('Kaggle', title, description, tags),
          prize: item.reward || item.prize || null,
          description,
          location: 'Online',
          source: 'kaggle',
        });
      }),
  };
}
