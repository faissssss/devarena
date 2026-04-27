import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CompetitionCard from '../components/CompetitionCard';
import DatePicker from '../components/DatePicker';
import PlatformMultiSelect from '../components/PlatformMultiSelect';
import { useAuth } from '../context/AuthContext';
import { bookmarkApi, competitionApi, unwrapError } from '../services/api';

const FILTER_STORAGE_KEY = 'devarena_explore_filters';

const defaultFilters = {
  category: '',
  status: '',
  search: '',
  page: 1,
  limit: 9,
  startDate: null,
  endDate: null,
  platforms: [],
  source: '',
  featured: false,
};

const recommendationChips = [
  {
    key: 'featured',
    label: 'Featured',
    matches: (filters) => filters.featured && !filters.category && !filters.status && !filters.source,
    getFilters: () => ({ featured: true }),
    colors: { bg: 'rgba(245,78,0,0.10)', border: 'rgba(245,78,0,0.24)', color: '#f54e00' },
  },
  {
    key: 'newest',
    label: 'Newest',
    matches: (filters) => filters.status === 'ended' && !filters.category && !filters.source && !filters.featured,
    getFilters: () => ({ status: 'ended' }),
    colors: { bg: 'rgba(31,138,101,0.10)', border: 'rgba(31,138,101,0.24)', color: '#1f8a65' },
  },
  {
    key: 'upcoming',
    label: 'Upcoming',
    matches: (filters) => filters.status === 'upcoming' && !filters.category && !filters.source && !filters.featured,
    getFilters: () => ({ status: 'upcoming' }),
    colors: { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.24)', color: '#2563eb' },
  },
  {
    key: 'hackathons',
    label: 'Hackathons',
    matches: (filters) => filters.category === 'Hackathons' && !filters.status && !filters.source && !filters.featured,
    getFilters: () => ({ category: 'Hackathons' }),
    colors: { bg: 'rgba(168,85,247,0.10)', border: 'rgba(168,85,247,0.24)', color: '#9333ea' },
  },
  {
    key: 'ai',
    label: 'AI / Data',
    matches: (filters) => filters.category === 'AI/Data Science' && !filters.status && !filters.source && !filters.featured,
    getFilters: () => ({ category: 'AI/Data Science' }),
    colors: { bg: 'rgba(14,165,233,0.10)', border: 'rgba(14,165,233,0.24)', color: '#0284c7' },
  },
  {
    key: 'security',
    label: 'Security',
    matches: (filters) => filters.category === 'CTF/Security' && !filters.status && !filters.source && !filters.featured,
    getFilters: () => ({ category: 'CTF/Security' }),
    colors: { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.24)', color: '#dc2626' },
  },
  {
    key: 'kaggle',
    label: 'Kaggle',
    matches: (filters) => filters.source === 'kaggle' && !filters.category && !filters.status && !filters.featured,
    getFilters: () => ({ source: 'kaggle' }),
    colors: { bg: 'rgba(6,182,212,0.10)', border: 'rgba(6,182,212,0.24)', color: '#0891b2' },
  },
];

function loadFiltersFromStorage() {
  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!stored) return defaultFilters;

    const parsed = JSON.parse(stored);
    const singleDate = parsed.singleDate ? new Date(parsed.singleDate) : null;
    const startDate = parsed.startDate ? new Date(parsed.startDate) : singleDate;
    const endDate = parsed.endDate ? new Date(parsed.endDate) : singleDate;

    return {
      ...defaultFilters,
      ...parsed,
      startDate,
      endDate,
      platforms: parsed.platforms || [],
    };
  } catch (error) {
    console.error('Failed to load filters from storage:', error);
    return defaultFilters;
  }
}

function saveFiltersToStorage(filters) {
  try {
    const toStore = {
      ...filters,
      startDate: filters.startDate ? filters.startDate.toISOString() : null,
      endDate: filters.endDate ? filters.endDate.toISOString() : null,
    };
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error('Failed to save filters to storage:', error);
  }
}

function FilterSelect({ id, label, value, onChange, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          fontWeight: 500,
          color: 'var(--muted-foreground)',
          marginBottom: 6,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="input"
        style={{ cursor: 'pointer', padding: '8px 12px' }}
      >
        {children}
      </select>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div className="skeleton" style={{ height: 10, width: '40%' }} />
      <div className="skeleton" style={{ height: 18, width: '75%' }} />
      <div className="skeleton" style={{ height: 18, width: '55%' }} />
      <div className="skeleton" style={{ height: 50, marginTop: 2 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
        <div className="skeleton" style={{ height: 32 }} />
        <div className="skeleton" style={{ height: 32 }} />
        <div className="skeleton" style={{ height: 32 }} />
        <div className="skeleton" style={{ height: 32 }} />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState(() => loadFiltersFromStorage());
  const [data, setData] = useState({ competitions: [], totalPages: 1, page: 1 });
  const [bookmarks, setBookmarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [isDateOpen, setIsDateOpen] = useState(false);

  const hasActiveFilters = Boolean(
    filters.category ||
      filters.status ||
      filters.search ||
      filters.startDate ||
      filters.endDate ||
      filters.platforms.length > 0 ||
      filters.source ||
      filters.featured
  );

  const dateSummary = useMemo(() => {
    if (filters.startDate && filters.endDate) {
      const sameDay = filters.startDate.toDateString() === filters.endDate.toDateString();
      if (sameDay) {
        return filters.startDate.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }

      return `${filters.startDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })} - ${filters.endDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    }

    return 'Any date';
  }, [filters.endDate, filters.startDate]);

  useEffect(() => {
    saveFiltersToStorage(filters);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;

    async function safeCompetitionList(params) {
      try {
        return await competitionApi.list(params);
      } catch (error) {
        console.error('Competition list request failed', { params, error });
        return { competitions: [], totalPages: 1, page: params?.page ?? 1, limit: params?.limit ?? 9 };
      }
    }

    async function load() {
      setLoading(true);
      setError('');

      try {
        let compRes;

        if (filters.featured) {
          const [ongoingRes, upcomingRes] = await Promise.all([
            safeCompetitionList({ status: 'ongoing', limit: 50 }),
            safeCompetitionList({ status: 'upcoming', limit: 50 }),
          ]);
          const ongoingComps = ongoingRes.competitions || [];
          const featuredComps = [...ongoingComps, ...(upcomingRes.competitions || [])].slice(0, 50);

          const startIdx = (filters.page - 1) * filters.limit;
          const endIdx = startIdx + filters.limit;

          compRes = {
            competitions: featuredComps.slice(startIdx, endIdx),
            totalPages: Math.max(1, Math.ceil(featuredComps.length / filters.limit)),
            page: filters.page,
          };
        } else {
          compRes = await safeCompetitionList(filters);
        }

        const bmRes = isAuthenticated ? await bookmarkApi.list() : { bookmarks: [] };
        if (cancelled) return;

        setData(compRes);
        setBookmarks(Object.fromEntries((bmRes.bookmarks || []).map((b) => [b.competition_id, b.id])));
      } catch (err) {
        if (!cancelled) setError(unwrapError(err, 'Unable to load competitions'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filters, isAuthenticated]);

  async function toggleBookmark(competition, bookmarkId) {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (bookmarkId) {
        await bookmarkApi.remove(bookmarkId);
        setBookmarks((current) => {
          const next = { ...current };
          delete next[competition.id];
          return next;
        });
      } else {
        const res = await bookmarkApi.create(competition.id);
        setBookmarks((current) => ({ ...current, [competition.id]: res.bookmark.id }));
      }
    } catch (err) {
      setError(unwrapError(err, 'Unable to update bookmark'));
    }
  }

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  }

  function handleDateRangeSelect(startDate, endDate) {
    setFilters((current) => ({
      ...current,
      startDate,
      endDate,
      page: 1,
    }));
  }

  function handlePlatformsChange(platforms) {
    setFilters((current) => ({ ...current, platforms, page: 1 }));
  }

  function resetToDefaultBrowse() {
    setFilters({
      ...defaultFilters,
      page: 1,
    });
  }

  function applyRecommendation(chip) {
    if (chip.matches(filters)) {
      resetToDefaultBrowse();
      return;
    }

    setFilters({
      ...defaultFilters,
      ...chip.getFilters(),
      page: 1,
    });
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div
        style={{
          flex: 1,
          maxWidth: showFilters ? 'calc(100% - 320px)' : '100%',
          transition: 'max-width 300ms ease',
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <p className="text-eyebrow" style={{ marginBottom: 8 }}>
            EXPLORE
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.25rem',
              fontWeight: 400,
              letterSpacing: '-0.72px',
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            Find your next challenge
          </h1>
          <p
            className="text-body-serif"
            style={{ color: 'var(--muted-foreground)', margin: '8px 0 0', fontSize: '0.9375rem' }}
          >
            Search, mix filters, and jump across categories or sources without losing your place.
          </p>
        </div>

        <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 720 }}>
            <svg
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 18,
                height: 18,
                color: 'var(--muted-foreground)',
                pointerEvents: 'none',
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className="input"
              placeholder="Search competitions by title or description..."
              value={filters.search}
              onChange={(event) => setFilter('search', event.target.value)}
              style={{
                width: '100%',
                paddingLeft: 42,
                fontSize: '0.9375rem',
                height: 44,
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className={`btn ${showFilters ? 'filter-toggle-active' : 'filter-toggle-inactive'}`}
            style={{
              padding: '10px 14px',
              height: 44,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              letterSpacing: '0.02em',
              transition: 'all 150ms ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        <div style={{ marginBottom: 8 }}>
          <p
            style={{
              margin: '0 0 10px',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted-foreground)',
            }}
          >
            Quick recommendations
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {recommendationChips.map((chip) => {
              const active = chip.matches(filters);
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => applyRecommendation(chip)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '999px',
                    border: `1px solid ${active ? chip.colors.border : 'var(--border)'}`,
                    background: active ? chip.colors.bg : 'var(--card)',
                    color: active ? chip.colors.color : 'var(--foreground)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'transform 150ms ease, background 150ms ease, border-color 150ms ease',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        <p
          style={{
            margin: '0 0 24px',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
            color: 'var(--muted-foreground)',
          }}
        >
          Tap a chip again to go back to the full competition list.
        </p>

        {error && (
          <p
            role="alert"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              color: 'var(--destructive)',
              background: 'transparent',
              border: '1px solid var(--destructive)',
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              marginBottom: 16,
            }}
          >
            {error}
          </p>
        )}

        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: showFilters ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: 16,
            }}
          >
            {Array.from({ length: showFilters ? 6 : 9 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : data.competitions.length === 0 ? (
          <div
            style={{
              background: 'var(--card)',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius)',
              padding: '48px 32px',
              textAlign: 'center',
            }}
          >
            <svg
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 12px',
                color: 'var(--muted-foreground)',
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                fontWeight: 400,
                color: 'var(--foreground)',
                margin: '0 0 6px',
              }}
            >
              No competitions found
            </p>
            <p className="text-body-serif" style={{ color: 'var(--muted-foreground)', margin: 0, fontSize: '0.875rem' }}>
              Try adjusting your filters or search terms to discover more competitions.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: showFilters ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: 16,
                gridAutoRows: '1fr',
                alignItems: 'stretch',
                transition: 'grid-template-columns 300ms ease',
              }}
            >
              {data.competitions.map((comp) => (
                <CompetitionCard
                  key={comp.id}
                  competition={comp}
                  bookmarkId={bookmarks[comp.id]}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>

            {data.totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '10px 14px',
                  marginTop: 24,
                }}
              >
                <button
                  type="button"
                  disabled={filters.page <= 1}
                  onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.8125rem',
                    opacity: filters.page <= 1 ? 0.4 : 1,
                    cursor: filters.page <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Previous
                </button>
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: 'var(--muted-foreground)',
                  }}
                >
                  Page {data.page} of {data.totalPages}
                </span>
                <button
                  type="button"
                  disabled={filters.page >= data.totalPages}
                  onClick={() =>
                    setFilters((current) => ({ ...current, page: Math.min(data.totalPages, current.page + 1) }))
                  }
                  className="btn btn-dark"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.8125rem',
                    opacity: filters.page >= data.totalPages ? 0.4 : 1,
                    cursor: filters.page >= data.totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showFilters && (
        <aside
          style={{
            width: 320,
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            background: 'var(--card)',
            borderLeft: '1px solid var(--sidebar-border)',
            padding: '24px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            animation: 'slideInRight 300ms ease',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.0625rem',
                fontWeight: 400,
                letterSpacing: '-0.11px',
                color: 'var(--foreground)',
                margin: '0 0 3px',
              }}
            >
              Filters
            </p>
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                color: 'var(--muted-foreground)',
                margin: 0,
              }}
            >
              Refine your search
            </p>
          </div>

          <div
            style={{
              position: 'relative',
            }}
          >
            <label
              htmlFor="date-filter-trigger"
              style={{
                display: 'block',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: 'var(--muted-foreground)',
                marginBottom: 6,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Date
            </label>
            <button
              id="date-filter-trigger"
              type="button"
              onClick={() => setIsDateOpen((current) => !current)}
              className="input"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                padding: '10px 12px',
              }}
              aria-expanded={isDateOpen}
              aria-haspopup="dialog"
            >
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.875rem',
                  color: 'var(--foreground)',
                  fontWeight: 500,
                }}
              >
                {dateSummary}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: isDateOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 150ms ease',
                }}
              >
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isDateOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  zIndex: 40,
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 14,
                  background: 'var(--popover)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      color: 'var(--muted-foreground)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Date
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.75rem',
                      color: 'var(--foreground)',
                      fontWeight: 500,
                    }}
                  >
                    {dateSummary}
                  </span>
                </div>
                <DatePicker
                  mode="range"
                  selectedRange={{ startDate: filters.startDate, endDate: filters.endDate }}
                  onRangeSelect={handleDateRangeSelect}
                />
              </div>
            )}
          </div>

          <FilterSelect
            id="filter-category"
            label="Category"
            value={filters.category}
            onChange={(event) => setFilter('category', event.target.value)}
          >
            <option value="">All categories</option>
            <option value="Competitive Programming">Competitive Programming</option>
            <option value="AI/Data Science">AI / Data Science</option>
            <option value="Hackathons">Hackathons</option>
            <option value="CTF/Security">CTF / Security</option>
            <option value="Web3/Blockchain">Web3 / Blockchain</option>
            <option value="Game Development">Game Development</option>
            <option value="Mobile Development">Mobile Development</option>
            <option value="Design/UI/UX">Design / UI / UX</option>
            <option value="Cloud/DevOps">Cloud / DevOps</option>
            <option value="Other">Other</option>
          </FilterSelect>

          <FilterSelect
            id="filter-source"
            label="Source"
            value={filters.source}
            onChange={(event) => setFilter('source', event.target.value)}
          >
            <option value="">All sources</option>
            <option value="kontests">Kontests</option>
            <option value="clist">CLIST</option>
            <option value="kaggle">Kaggle</option>
          </FilterSelect>

          <FilterSelect
            id="filter-status"
            label="Status"
            value={filters.status}
            onChange={(event) => setFilter('status', event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="ended">Ended</option>
          </FilterSelect>

          <div>
            <label
              htmlFor="platform-filter"
              style={{
                display: 'block',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: 'var(--muted-foreground)',
                marginBottom: 6,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Platforms
            </label>
            <PlatformMultiSelect selectedPlatforms={filters.platforms} onSelectionChange={handlePlatformsChange} />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'center',
                fontSize: '0.875rem',
                marginTop: 'auto',
                padding: '12px 14px',
                background: 'rgba(245,78,0,0.12)',
                color: '#f54e00',
                border: '1px solid rgba(245,78,0,0.28)',
                fontWeight: 700,
              }}
              onClick={() => setFilters(defaultFilters)}
            >
              Clear all filters
            </button>
          )}
        </aside>
      )}
    </div>
  );
}
