import { useEffect, useMemo, useState } from 'react';

import CompetitionCard from '../components/CompetitionCard';
import SectionHeading from '../components/SectionHeading';
import { useAuth } from '../context/AuthContext';
import { bookmarkApi, unwrapError } from '../services/api';

const STATUS_FILTERS = [
  { value: '',         label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing',  label: 'Ongoing' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    bookmarkApi
      .list()
      .then((res) => setBookmarks(res.bookmarks || []))
      .catch((err) => setError(unwrapError(err, 'Unable to load bookmarks')))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(
    () => bookmarks.filter((b) => (statusFilter ? b.competition?.status === statusFilter : true)),
    [bookmarks, statusFilter]
  );

  async function removeBookmark(competition, bookmarkId) {
    try {
      await bookmarkApi.remove(bookmarkId);
      setBookmarks((c) => c.filter((b) => b.id !== bookmarkId));
    } catch (err) {
      setError(unwrapError(err, 'Unable to remove bookmark'));
    }
  }

  const upcomingCount = bookmarks.filter((b) => b.competition?.status === 'upcoming').length;
  const ongoingCount  = bookmarks.filter((b) => b.competition?.status === 'ongoing').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <SectionHeading
        eyebrow="Dashboard"
        title="Your active watchlist."
        body="Keep the important competitions close, with deadline pressure surfaced before it turns into last-minute panic."
      />

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total saved',  value: bookmarks.length },
          { label: 'Upcoming',     value: upcomingCount },
          { label: 'Ongoing',      value: ongoingCount },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px 22px',
            }}
          >
            <p className="text-eyebrow" style={{ marginBottom: 8 }}>{label}</p>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.25rem',
                fontWeight: 400,
                letterSpacing: '-0.5px',
                color: 'var(--foreground)',
                margin: 0,
                lineHeight: 1,
              }}
            >
              {loading ? '—' : value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="group" aria-label="Filter by status">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value || 'all'}
            type="button"
            onClick={() => setStatusFilter(value)}
            aria-pressed={statusFilter === value}
            className={`btn ${statusFilter === value ? 'filter-pill-active' : 'filter-pill-inactive'}`}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'background 150ms ease, color 150ms ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error */}
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
          }}
        >
          {error}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
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
              <div className="skeleton" style={{ height: 50 }} />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div
          style={{
            background: 'var(--card)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius)',
            padding: '64px 40px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.125rem',
              fontWeight: 400,
              letterSpacing: '-0.08px',
              color: 'var(--foreground)',
              margin: '0 0 8px',
            }}
          >
            No bookmarks yet
          </p>
          <p className="text-body-serif" style={{ color: 'var(--muted-foreground)', margin: '0 0 24px', fontSize: '0.9375rem' }}>
            Head to Explore to find competitions worth tracking.
          </p>
          <a
            href="/explore"
            className="btn btn-dark"
            style={{ display: 'inline-flex', padding: '10px 20px' }}
          >
            Explore competitions
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
          {visible.map((bookmark) => (
            <CompetitionCard
              key={bookmark.id}
              competition={bookmark.competition}
              bookmarkId={bookmark.id}
              onToggleBookmark={removeBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
}
