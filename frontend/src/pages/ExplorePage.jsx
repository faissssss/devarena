import { useEffect, useState } from 'react';
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
  singleDate: null,
  platforms: [],
  source: '',
  featured: false, // Special flag for featured mode
};

// Load filters from localStorage
function loadFiltersFromStorage() {
  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!stored) return defaultFilters;
    
    const parsed = JSON.parse(stored);
    
    // Convert date strings back to Date objects
    return {
      ...defaultFilters,
      ...parsed,
      startDate: parsed.startDate ? new Date(parsed.startDate) : null,
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
      singleDate: parsed.singleDate ? new Date(parsed.singleDate) : null,
      platforms: parsed.platforms || [],
    };
  } catch (error) {
    console.error('Failed to load filters from storage:', error);
    return defaultFilters;
  }
}

// Save filters to localStorage
function saveFiltersToStorage(filters) {
  try {
    // Convert Date objects to ISO strings for storage
    const toStore = {
      ...filters,
      startDate: filters.startDate ? filters.startDate.toISOString() : null,
      endDate: filters.endDate ? filters.endDate.toISOString() : null,
      singleDate: filters.singleDate ? filters.singleDate.toISOString() : null,
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
          color: 'var(--text-secondary)',
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
        background: 'var(--surface-100)',
        border: '1px solid var(--border-primary)',
        borderRadius: 10,
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateMode, setDateMode] = useState('range');
  const [showFilters, setShowFilters] = useState(true); // New state for filter panel visibility

  // Save filters to localStorage whenever they change
  useEffect(() => {
    saveFiltersToStorage(filters);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        let compRes;
        
        // Special handling for Featured mode (ongoing + upcoming mixed)
        if (filters.featured) {
          // Fetch ongoing competitions first
          const ongoingRes = await competitionApi.list({ status: 'ongoing', limit: 50 });
          const ongoingComps = ongoingRes.competitions || [];
          
          let featuredComps = [...ongoingComps];
          
          // If we have less than 50, add upcoming competitions
          if (featuredComps.length < 50) {
            const upcomingRes = await competitionApi.list({ 
              status: 'upcoming', 
              limit: 50 - featuredComps.length 
            });
            featuredComps = [...featuredComps, ...(upcomingRes.competitions || [])];
          }
          
          // Paginate the merged results
          const startIdx = (filters.page - 1) * filters.limit;
          const endIdx = startIdx + filters.limit;
          const paginatedComps = featuredComps.slice(startIdx, endIdx);
          
          compRes = {
            competitions: paginatedComps,
            totalPages: Math.ceil(featuredComps.length / filters.limit),
            page: filters.page,
          };
        } else {
          // Normal filtering
          compRes = await competitionApi.list(filters);
        }
        
        const bmRes = isAuthenticated 
          ? await bookmarkApi.list() 
          : { bookmarks: [] };
        
        if (cancelled) return;
        setData(compRes);
        setBookmarks(
          Object.fromEntries((bmRes.bookmarks || []).map((b) => [b.competition_id, b.id]))
        );
      } catch (err) {
        if (!cancelled) setError(unwrapError(err, 'Unable to load competitions'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [filters, isAuthenticated]);

  async function toggleBookmark(competition, bookmarkId) {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      if (bookmarkId) {
        await bookmarkApi.remove(bookmarkId);
        setBookmarks((c) => { const n = { ...c }; delete n[competition.id]; return n; });
      } else {
        const res = await bookmarkApi.create(competition.id);
        setBookmarks((c) => ({ ...c, [competition.id]: res.bookmark.id }));
      }
    } catch (err) {
      setError(unwrapError(err, 'Unable to update bookmark'));
    }
  }

  function setFilter(key, value) {
    setFilters((c) => ({ ...c, [key]: value, page: 1 }));
  }

  function handleDateRangeSelect(startDate, endDate) {
    setFilters((c) => ({ 
      ...c, 
      startDate, 
      endDate, 
      singleDate: null,
      page: 1 
    }));
  }

  function handleSingleDateSelect(date) {
    setFilters((c) => ({ 
      ...c, 
      singleDate: date, 
      startDate: null, 
      endDate: null,
      page: 1 
    }));
  }

  function handlePlatformsChange(platforms) {
    setFilters((c) => ({ ...c, platforms, page: 1 }));
  }

  const hasActiveFilters = filters.category || filters.status || filters.search || 
    filters.startDate || filters.endDate || filters.singleDate || filters.platforms.length > 0 || filters.source || filters.featured;

  const getDateButtonText = () => {
    if (filters.singleDate) {
      return filters.singleDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (filters.startDate && filters.endDate) {
      const start = filters.startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const end = filters.endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      return `${start} - ${end}`;
    }
    return 'Select date';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Main Content Area (Center) */}
      <div style={{ 
        flex: 1, 
        maxWidth: showFilters ? 'calc(100% - 300px)' : '100%',
        transition: 'max-width 300ms ease',
      }}>
        {/* Page Header */}
        <div style={{ marginBottom: 32 }}>
          <p className="text-eyebrow" style={{ marginBottom: 8 }}>EXPLORE</p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.25rem',
              fontWeight: 400,
              letterSpacing: '-0.72px',
              color: 'var(--color-dark)',
              margin: 0,
            }}
          >
            Find your next challenge
          </h1>
          <p
            className="text-body-serif"
            style={{ color: 'var(--text-secondary)', margin: '8px 0 0', fontSize: '0.9375rem' }}
          >
            Search and filter through competitions from across the developer landscape.
          </p>
        </div>

        {/* Search Bar at Top with Filter Toggle */}
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
                color: 'var(--text-secondary)',
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
              onChange={(e) => setFilter('search', e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 42,
                fontSize: '0.9375rem',
                height: 44,
              }}
            />
          </div>
          
          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'filter-toggle-active' : 'filter-toggle-inactive'}`}
            style={{
              padding: '10px 14px',
              height: 44,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid var(--border-primary)',
              borderRadius: 6,
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

        {/* Recommendation Chips */}
        <div style={{ marginBottom: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              // Featured shows ongoing + upcoming competitions (matches HomePage)
              const newFilters = { ...defaultFilters, featured: true, page: 1 };
              setFilters(newFilters);
              saveFiltersToStorage(newFilters);
            }}
            className={`btn ${filters.featured && !filters.category && !filters.search && !filters.platforms?.length && !filters.source && !filters.status ? 'chip-active' : 'chip-inactive'}`}
            style={{
              padding: '6px 14px',
              border: '1px solid var(--border-primary)',
              borderRadius: 9999,
              fontSize: '0.8125rem',
              fontWeight: 500,
              transition: 'all 150ms ease',
            }}
          >
            Featured
          </button>
          <button
            type="button"
            onClick={() => {
              // Newest shows all competitions sorted by date (default)
              setFilters({ ...defaultFilters, page: 1 });
              saveFiltersToStorage({ ...defaultFilters, page: 1 });
            }}
            className={`btn ${!filters.status && !filters.category && !filters.search && !filters.platforms?.length && !filters.source && !filters.featured ? 'chip-active' : 'chip-inactive'}`}
            style={{
              padding: '6px 14px',
              border: '1px solid var(--border-primary)',
              borderRadius: 9999,
              fontSize: '0.8125rem',
              fontWeight: 500,
              transition: 'all 150ms ease',
            }}
          >
            Newest
          </button>
          <button
            type="button"
            onClick={() => {
              // Popular shows upcoming competitions
              setFilters({ ...defaultFilters, status: 'upcoming', page: 1 });
              saveFiltersToStorage({ ...defaultFilters, status: 'upcoming', page: 1 });
            }}
            className={`btn ${filters.status === 'upcoming' && !filters.category && !filters.search && !filters.platforms?.length && !filters.source && !filters.featured ? 'chip-active' : 'chip-inactive'}`}
            style={{
              padding: '6px 14px',
              border: '1px solid var(--border-primary)',
              borderRadius: 9999,
              fontSize: '0.8125rem',
              fontWeight: 500,
              transition: 'all 150ms ease',
            }}
          >
            Popular
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <p
            role="alert"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              color: 'var(--color-error)',
              background: 'rgba(207,45,86,0.08)',
              border: '1px solid rgba(207,45,86,0.20)',
              borderRadius: 6,
              padding: '10px 14px',
              marginBottom: 16,
            }}
          >
            {error}
          </p>
        )}

        {/* Results Grid - 2 or 3 columns based on filter visibility */}
        {loading ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: showFilters ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
            gap: 16 
          }}>
            {Array.from({ length: showFilters ? 6 : 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : data.competitions.length === 0 ? (
          <div
            style={{
              background: 'var(--surface-100)',
              border: '1px dashed var(--border-medium)',
              borderRadius: 10,
              padding: '48px 32px',
              textAlign: 'center',
            }}
          >
            <svg
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 12px',
                color: 'var(--text-tertiary)',
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
                color: 'var(--color-dark)',
                margin: '0 0 6px',
              }}
            >
              No competitions found
            </p>
            <p className="text-body-serif" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
              Try adjusting your filters or search terms to discover more competitions.
            </p>
          </div>
        ) : (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: showFilters ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
              gap: 16,
              gridAutoRows: '1fr',
              alignItems: 'stretch',
              transition: 'grid-template-columns 300ms ease',
            }}>
              {data.competitions.map((comp) => (
                <CompetitionCard
                  key={comp.id}
                  competition={comp}
                  bookmarkId={bookmarks[comp.id]}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--surface-100)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginTop: 24,
                }}
              >
                <button
                  type="button"
                  disabled={filters.page <= 1}
                  onClick={() => setFilters((c) => ({ ...c, page: Math.max(1, c.page - 1) }))}
                  className="btn btn-primary"
                  style={{ 
                    padding: '8px 14px', 
                    fontSize: '0.8125rem', 
                    opacity: filters.page <= 1 ? 0.4 : 1,
                    cursor: filters.page <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ← Previous
                </button>
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Page {data.page} of {data.totalPages}
                </span>
                <button
                  type="button"
                  disabled={filters.page >= data.totalPages}
                  onClick={() => setFilters((c) => ({ ...c, page: Math.min(data.totalPages, c.page + 1) }))}
                  className="btn btn-dark"
                  style={{ 
                    padding: '8px 14px', 
                    fontSize: '0.8125rem', 
                    opacity: filters.page >= data.totalPages ? 0.4 : 1,
                    cursor: filters.page >= data.totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Filter Panel (Sticky) - Conditionally rendered */}
      {showFilters && (
        <aside
          style={{
            width: 300,
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            background: 'var(--surface-100)',
            borderLeft: '1px solid var(--border-primary)',
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
                color: 'var(--color-dark)',
                margin: '0 0 3px',
              }}
            >
              Filters
            </p>
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Refine your search
            </p>
          </div>

          {/* Date Filter - FIRST */}
          <div>
            <label
              htmlFor="date-filter"
              style={{
                display: 'block',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: 6,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Date
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setDateMode('range')}
                className={`${dateMode === 'range' ? 'date-mode-active' : 'date-mode-inactive'}`}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  fontSize: '0.75rem',
                  borderRadius: 6,
                  border: '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 500,
                }}
              >
                Range
              </button>
              <button
                type="button"
                onClick={() => setDateMode('single')}
                className={`${dateMode === 'single' ? 'date-mode-active' : 'date-mode-inactive'}`}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  fontSize: '0.75rem',
                  borderRadius: 6,
                  border: '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 500,
                }}
              >
                Single
              </button>
            </div>
            <button
              id="date-filter"
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="input flex items-center justify-between w-full"
              style={{ cursor: 'pointer', padding: '8px 12px' }}
            >
              <span className="truncate text-sm">{getDateButtonText()}</span>
              <svg
                className={`ml-2 flex-shrink-0 w-4 h-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDatePicker && (
              <div className="mt-2">
                <DatePicker
                  mode={dateMode}
                  selectedDate={filters.singleDate}
                  selectedRange={{ startDate: filters.startDate, endDate: filters.endDate }}
                  onDateSelect={handleSingleDateSelect}
                  onRangeSelect={handleDateRangeSelect}
                />
              </div>
            )}
          </div>

          {/* Category - SECOND */}
          <FilterSelect
            id="filter-category"
            label="Category"
            value={filters.category}
            onChange={(e) => setFilter('category', e.target.value)}
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

          {/* Source - THIRD */}
          <FilterSelect
            id="filter-source"
            label="Source"
            value={filters.source}
            onChange={(e) => setFilter('source', e.target.value)}
          >
            <option value="">All sources</option>
            <option value="kontests">Kontests</option>
            <option value="clist">CLIST</option>
            <option value="kaggle">Kaggle</option>
          </FilterSelect>

          {/* Status - FOURTH (swapped with Platforms) */}
          <FilterSelect
            id="filter-status"
            label="Status"
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="ended">Ended</option>
          </FilterSelect>

          {/* Platforms - FIFTH (swapped with Status) */}
          <div>
            <label
              htmlFor="platform-filter"
              style={{
                display: 'block',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: 6,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Platforms
            </label>
            <PlatformMultiSelect
              selectedPlatforms={filters.platforms}
              onSelectionChange={handlePlatformsChange}
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                fontSize: '0.8125rem',
                marginTop: 'auto',
                padding: '8px 12px',
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
