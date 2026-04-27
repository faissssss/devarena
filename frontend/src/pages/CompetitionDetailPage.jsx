import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import CompetitionCard from '../components/CompetitionCard';
import { useAuth } from '../context/AuthContext';
import { bookmarkApi, competitionApi, unwrapError } from '../services/api';
import { getCompetitionDescription } from '../utils/competitionDescription';
import { formatPlatformName } from '../utils/platformFormatter';
import { formatPrize } from '../utils/prizeFormatter';

const statusColors = {
  upcoming: { bg: 'rgba(31,138,101,0.10)', color: '#1f8a65' },
  ongoing:  { bg: 'rgba(245,78,0,0.10)',   color: '#f54e00' },
  ended:    { bg: 'rgba(38,37,30,0.08)',   color: 'var(--text-secondary)' },
};

// Category color coding for all 10 categories
const categoryColors = {
  'Competitive Programming': { bg: 'rgba(245,78,0,0.10)', color: '#f54e00' },
  'AI/Data Science': { bg: 'rgba(147,51,234,0.10)', color: '#9333ea' },
  'Hackathons': { bg: 'rgba(59,130,246,0.10)', color: '#3b82f6' },
  'CTF/Security': { bg: 'rgba(239,68,68,0.10)', color: '#ef4444' },
  'Web3/Blockchain': { bg: 'rgba(251,191,36,0.10)', color: '#fbbf24' },
  'Game Development': { bg: 'rgba(168,85,247,0.10)', color: '#a855f7' },
  'Mobile Development': { bg: 'rgba(34,197,94,0.10)', color: '#22c55e' },
  'Design/UI/UX': { bg: 'rgba(236,72,153,0.10)', color: '#ec4899' },
  'Cloud/DevOps': { bg: 'rgba(14,165,233,0.10)', color: '#0ea5e9' },
  'Other': { bg: 'rgba(107,114,128,0.10)', color: '#6b7280' },
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
  const [relatedCompetitions, setRelatedCompetitions] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

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

  // Fetch related competitions based on category
  useEffect(() => {
    if (!competition) return;
    let cancelled = false;
    async function loadRelated() {
      setRelatedLoading(true);
      try {
        const res = await competitionApi.getAll({ 
          category: competition.category,
          status: 'ongoing,upcoming',
          limit: 4
        });
        if (cancelled) return;
        // Filter out the current competition
        const filtered = res.competitions.filter(c => c.id !== competition.id).slice(0, 3);
        setRelatedCompetitions(filtered);
      } catch (err) {
        // Silently fail for related competitions
        console.error('Failed to load related competitions:', err);
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    }
    loadRelated();
    return () => { cancelled = true; };
  }, [competition]);

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
  const categoryStyle = categoryColors[competition.category] || categoryColors['Other'];

  // Format location display
  const locationDisplay = competition.location && competition.location.toLowerCase() !== 'online'
    ? `📍 On-site: ${competition.location}`
    : '🌐 Online';
    
  // Format platform name
  const platformDisplay = formatPlatformName(competition.platform);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Back button */}
      <Link
        to="/explore"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          transition: 'color 150ms ease',
          width: 'fit-content',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-dark)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Explore
      </Link>

      {/* Main card */}
      <article
        style={{
          background: 'var(--surface-100)',
          border: '1px solid var(--border-primary)',
          borderRadius: 12,
          padding: 'clamp(32px, 4vw, 48px)',
          boxShadow: 'rgba(0,0,0,0.04) 0px 12px 32px',
        }}
      >
        {/* Platform + category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <span className="pill">{platformDisplay}</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: categoryStyle.bg,
              color: categoryStyle.color,
              padding: '3px 10px',
              borderRadius: 9999,
              fontSize: '0.6875rem',
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {competition.category}
          </span>
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
            color: 'var(--muted-foreground)',
            margin: '0 0 28px',
            maxWidth: 720,
            lineHeight: 1.75,
          }}
        >
          {getCompetitionDescription(competition)}
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
          <MetaCell 
            label="Start date" 
            value={(() => {
              const start = new Date(competition.start_date);
              const end = new Date(competition.end_date);
              // If start is within 2 hours of end, it's likely a placeholder (Kaggle competitions)
              const diffHours = (end - start) / (1000 * 60 * 60);
              if (diffHours < 2) {
                return '-';
              }
              return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            })()} 
          />
          <MetaCell label="End date"   value={new Date(competition.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} />
          <MetaCell label="Location"   value={locationDisplay} />
          {competition.prize && <MetaCell label="Prize" value={formatPrize(competition.prize)} accent="var(--color-gold)" />}
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
              background: bookmarkId ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
              color: bookmarkId ? '#ef4444' : '#16a34a',
              border: bookmarkId ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.3)',
              padding: '10px 20px',
              borderRadius: 9999,
              opacity: bookmarkLoading ? 0.6 : 1,
              cursor: bookmarkLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => {
              if (!bookmarkLoading) {
                e.currentTarget.style.background = bookmarkId ? 'rgba(239,68,68,0.18)' : 'rgba(34,197,94,0.18)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = bookmarkId ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)';
            }}
          >
            {bookmarkLoading ? '…' : bookmarkId ? '✕ Remove bookmark' : '+ Save bookmark'}
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

      {/* Related Competitions */}
      {relatedCompetitions.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2
            className="text-section"
            style={{ 
              margin: '0 0 20px', 
              fontSize: '1.5rem',
              fontWeight: 600,
            }}
          >
            Related Competitions
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            {relatedCompetitions.map((comp) => (
              <CompetitionCard
                key={comp.id}
                competition={comp}
                bookmarkId={null}
                onToggleBookmark={null}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
