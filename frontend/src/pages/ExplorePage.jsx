import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CompetitionCard from '../components/CompetitionCard';
import SectionHeading from '../components/SectionHeading';
import { useAuth } from '../context/AuthContext';
import { bookmarkApi, competitionApi, unwrapError } from '../services/api';

const defaultFilters = { category: '', status: '', source: '', search: '', page: 1, limit: 9 };

function FilterSelect({ id, label, value, onChange, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          marginBottom: 5,
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="input"
        style={{ cursor: 'pointer' }}
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
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div className="skeleton" style={{ height: 12, width: '45%' }} />
      <div className="skeleton" style={{ height: 20, width: '80%' }} />
      <div className="skeleton" style={{ height: 20, width: '60%' }} />
      <div className="skeleton" style={{ height: 60, marginTop: 4 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
        <div className="skeleton" style={{ height: 36 }} />
        <div className="skeleton" style={{ height: 36 }} />
        <div className="skeleton" style={{ height: 36 }} />
        <div className="skeleton" style={{ height: 36 }} />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState(defaultFilters);
  const [data, setData] = useState({ competitions: [], totalPages: 1, page: 1 });
  const [bookmarks, setBookmarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [compRes, bmRes] = await Promise.all([
          competitionApi.list(filters),
          isAuthenticated ? bookmarkApi.list() : Promise.resolve({ bookmarks: [] }),
        ]);
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

  const hasActiveFilters = filters.category || filters.status || filters.source || filters.search;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SectionHeading
        eyebrow="Explore"
        title="Search the current field."
        body="Filter by source, status, and search terms to narrow the competitions worth your next sprint."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 24, alignItems: 'start' }}>

        {/* ── Sidebar filters ── */}
        <aside
          style={{
            background: 'var(--surface-100)',
            border: '1px solid var(--border-primary)',
            borderRadius: 12,
            padding: '20px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'sticky',
            top: 76,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.875rem',
              fontWeight: 400,
              letterSpacing: '-0.04px',
              color: 'var(--color-dark)',
              margin: 0,
            }}
          >
            Filters
          </p>

          {/* Search */}
          <div>
            <label
              htmlFor="search-input"
              style={{
                display: 'block',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: 5,
                letterSpacing: '0.06em',
              }}
            >
              Search
            </label>
            <input
              id="search-input"
              type="search"
              className="input"
              placeholder="Search titles or descriptions"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
            />
          </div>

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
          </FilterSelect>

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

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8125rem' }}
              onClick={() => setFilters(defaultFilters)}
            >
              Clear filters
            </button>
          )}
        </aside>

        {/* ── Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && (
            <p
              role="alert"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.875rem',
                color: 'var(--color-error)',
                background: 'rgba(207,45,86,0.08)',
                border: '1px solid rgba(207,45,86,0.20)',
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              {error}
            </p>
          )}

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : data.competitions.length === 0 ? (
            <div
              style={{
                background: 'var(--surface-100)',
                border: '1px dashed var(--border-medium)',
                borderRadius: 12,
                padding: '48px 32px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.125rem',
                  fontWeight: 400,
                  color: 'var(--color-dark)',
                  margin: '0 0 8px',
                }}
              >
                No competitions found
              </p>
              <p className="text-body-serif" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Try adjusting your filters or search terms.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
              {data.competitions.map((comp) => (
                <CompetitionCard
                  key={comp.id}
                  competition={comp}
                  bookmarkId={bookmarks[comp.id]}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && data.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--surface-100)',
                border: '1px solid var(--border-primary)',
                borderRadius: 10,
                padding: '12px 16px',
              }}
            >
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() => setFilters((c) => ({ ...c, page: Math.max(1, c.page - 1) }))}
                className="btn btn-primary"
                style={{ padding: '7px 14px', fontSize: '0.8125rem', opacity: filters.page <= 1 ? 0.4 : 1 }}
              >
                ← Previous
              </button>
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.8125rem',
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
                style={{ padding: '7px 14px', fontSize: '0.8125rem', opacity: filters.page >= data.totalPages ? 0.4 : 1 }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
