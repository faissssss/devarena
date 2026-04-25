import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { bookmarkApi, competitionApi, unwrapError } from '../services/api';

const statusColors = {
  upcoming: { bg: 'rgba(31,138,101,0.10)', color: '#1f8a65' },
  ongoing:  { bg: 'rgba(245,78,0,0.10)',   color: '#f54e00' },
  ended:    { bg: 'rgba(38,37,30,0.08)',   color: 'var(--text-secondary)' },
};

function MetaCell({ label, value, accent }) {
  return (
    <div
      style={{
        background: 'var(--surface-300)',
        border: '1px solid var(--border-primary)',
        borderRadius: 8,
        padding: '14px 16px',
      }}
    >
      <p className="text-eyebrow" style={{ marginBottom: 6, fontSize: '0.625rem', letterSpacing: '0.22em' }}>
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: accent || 'var(--color-dark)',
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default function CompetitionDetailPage() {
  const { competitionId } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const compRes = await competitionApi.getById(competitionId);
        if (cancelled) return;
        setCompetition(compRes.competition);
        if (isAuthenticated) {
          const bmRes = await bookmarkApi.findByCompetition(competitionId);
          if (!cancelled) setBookmarkId(bmRes.bookmark?.id ?? null);
        }
      } catch (err) {
        if (!cancelled) setError(unwrapError(err, 'Unable to load competition'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [competitionId, isAuthenticated]);

  async function handleToggleBookmark() {
    if (!isAuthenticated) { navigate('/login'); return; }
    setBookmarkLoading(true);
    try {
      if (bookmarkId) {
        await bookmarkApi.remove(bookmarkId);
        setBookmarkId(null);
      } else {
        const res = await bookmarkApi.create(competition.id);
        setBookmarkId(res.bookmark.id);
      }
    } catch (err) {
      setError(unwrapError(err, 'Unable to update bookmark'));
    } finally {
      setBookmarkLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="skeleton" style={{ height: 12, width: 160, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 48, width: '70%', borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 80, borderRadius: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div
        style={{
          background: 'var(--surface-100)',
          border: '1px solid rgba(207,45,86,0.20)',
          borderRadius: 12,
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-error)', margin: 0 }}>
          {error || 'Competition not found'}
        </p>
        <Link
          to="/explore"
          className="btn btn-primary"
          style={{ display: 'inline-flex', marginTop: 16, padding: '8px 16px' }}
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  const sc = statusColors[competition.status] || statusColors.ended;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol style={{ display: 'flex', gap: 6, alignItems: 'center', listStyle: 'none', padding: 0, margin: 0 }}>
          <li>
            <Link
              to="/explore"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 150ms ease',
              }}
            >
              Explore
            </Link>
          </li>
          <li aria-hidden="true" style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>›</li>
          <li
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
              color: 'var(--color-dark)',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 280,
            }}
            aria-current="page"
          >
            {competition.title}
          </li>
        </ol>
      </nav>

      {/* Main card */}
      <article
        style={{
          background: 'var(--surface-100)',
          border: '1px solid var(--border-primary)',
          borderRadius: 16,
          padding: 'clamp(24px, 4vw, 44px)',
          boxShadow: 'rgba(0,0,0,0.06) 0px 16px 48px',
        }}
      >
        {/* Platform + category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <span className="pill">{competition.platform}</span>
          <span className="pill">{competition.category}</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: sc.bg,
              color: sc.color,
              padding: '2px 10px',
              borderRadius: 9999,
              fontSize: '0.6875rem',
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {competition.status}
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-section"
          style={{ margin: '0 0 16px', maxWidth: 720 }}
        >
          {competition.title}
        </h1>

        {/* Description */}
        <p
          className="text-body-serif"
          style={{
            color: 'var(--text-secondary)',
            margin: '0 0 28px',
            maxWidth: 680,
            lineHeight: 1.7,
          }}
        >
          {competition.description || 'A detailed competition brief is not available yet.'}
        </p>

        {/* Meta grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 28,
          }}
        >
          <MetaCell label="Start date" value={new Date(competition.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} />
          <MetaCell label="End date"   value={new Date(competition.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} />
          <MetaCell label="Location"   value={competition.location || 'Online'} />
          {competition.prize && <MetaCell label="Prize" value={competition.prize} accent="var(--color-gold)" />}
          {competition.difficulty && <MetaCell label="Difficulty" value={competition.difficulty} />}
          <MetaCell label="Source" value={competition.source} />
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
              marginBottom: 16,
            }}
          >
            {error}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            onClick={handleToggleBookmark}
            disabled={bookmarkLoading}
            className="btn"
            aria-pressed={Boolean(bookmarkId)}
            style={{
              background: bookmarkId ? 'var(--color-dark)' : 'var(--surface-300)',
              color: bookmarkId ? '#fef9f0' : 'var(--color-dark)',
              border: '1px solid var(--border-primary)',
              padding: '10px 20px',
              borderRadius: 9999,
              opacity: bookmarkLoading ? 0.6 : 1,
              cursor: bookmarkLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {bookmarkLoading ? '…' : bookmarkId ? 'Remove bookmark' : 'Save bookmark'}
          </button>
          <a
            href={competition.url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{ padding: '10px 20px', borderRadius: 9999 }}
          >
            Open source page ↗
          </a>
        </div>
      </article>
    </div>
  );
}
