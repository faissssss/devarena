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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SectionHeading
        eyebrow="Dashboard"
        title="Your active watchlist."
        body="Keep the important competitions close, with deadline pressure surfaced before it turns into last-minute panic."
      />

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total saved',  value: bookmarks.length },
          { label: 'Upcoming',     value: upcomingCount },
          { label: 'Ongoing',      value: ongoingCount },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: 'var(--surface-100)',
              border: '1px solid var(--border-primary)',
              borderRadius: 10,
              padding: '16px 18px',
            }}
          >
            <p className="text-eyebrow" style={{ marginBottom: 6 }}>{label}</p>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 400,
                letterSpacing: '-0.5px',
                color: 'var(--color-dark)',
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
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              padding: '6px 14px',
              borderRadius: 9999,
              border: '1px solid var(--border-primary)',
              cursor: 'pointer',
              transition: 'background 150ms ease, color 150ms ease',
              background: statusFilter === value ? 'var(--color-dark)' : 'var(--surface-300)',
              color: statusFilter === value ? '#fef9f0' : 'var(--text-secondary)',
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

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
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
              <div className="skeleton" style={{ height: 12, width: '40%' }} />
              <div className="skeleton" style={{ height: 20, width: '75%' }} />
              <div className="skeleton" style={{ height: 60 }} />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div
          style={{
            background: 'var(--surface-100)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 12,
            padding: '56px 32px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 400,
              letterSpacing: '-0.08px',
              color: 'var(--color-dark)',
              margin: '0 0 8px',
            }}
          >
            No bookmarks yet
          </p>
          <p className="text-body-serif" style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>
            Head to Explore to find competitions worth tracking.
          </p>
          <a
            href="/explore"
            className="btn btn-primary"
            style={{ display: 'inline-flex', padding: '9px 18px' }}
          >
            Explore competitions
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
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
