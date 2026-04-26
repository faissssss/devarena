import { Link } from 'react-router-dom';
import { formatPlatformName } from '../utils/platformFormatter';
import { formatPrize } from '../utils/prizeFormatter';
import { formatTitle } from '../utils/textFormatter';

const statusColors = {
  upcoming:  { bg: 'var(--muted)', color: 'var(--foreground)' },
  ongoing:   { bg: 'var(--primary)', color: 'var(--primary-foreground)' },
  ended:     { bg: 'var(--secondary)', color: 'var(--muted-foreground)' },
};

// Category color coding using monochrome standard
const categoryColors = {
  'Competitive Programming': { bg: 'var(--muted)', color: 'var(--foreground)' },
  'AI/Data Science': { bg: 'var(--muted)', color: 'var(--foreground)' },
  'Hackathons': { bg: 'var(--muted)', color: 'var(--foreground)' },
  'CTF/Security': { bg: 'var(--muted)', color: 'var(--foreground)' },
  'Web3/Blockchain': { bg: 'var(--muted)', color: 'var(--foreground)' },
  'Game Development': { bg: 'var(--muted)', color: 'var(--foreground)' },
  'Mobile Development': { bg: 'var(--muted)', color: 'var(--foreground)' },
  'Design/UI/UX': { bg: 'var(--muted)', color: 'var(--foreground)' },
  'Cloud/DevOps': { bg: 'var(--muted)', color: 'var(--foreground)' },
  'Other': { bg: 'var(--accent)', color: 'var(--accent-foreground)' },
};

function DeadlinePill({ endDate, status }) {
  const msLeft = new Date(endDate).getTime() - Date.now();
  const urgent = msLeft > 0 && msLeft < 7 * 24 * 60 * 60 * 1000;
  if (urgent) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'var(--destructive)',
          color: 'var(--destructive-foreground)',
          padding: '4px 10px',
          borderRadius: 'var(--radius)',
          fontSize: '0.6875rem',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--destructive-foreground)',
            display: 'inline-block',
          }}
        />
        Deadline soon
      </span>
    );
  }
  const s = statusColors[status] || statusColors.ended;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: s.bg,
        color: s.color,
        padding: '4px 10px',
        borderRadius: 'var(--radius)',
        fontSize: '0.6875rem',
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {status}
    </span>
  );
}

export default function CompetitionCard({
  competition,
  bookmarkId,
  onToggleBookmark,
  compact = false,
}) {
  // Format location display
  const locationDisplay = competition.location && competition.location.toLowerCase() !== 'online'
    ? `📍 On-site: ${competition.location}`
    : '🌐 Online';

  // Get category color
  const categoryStyle = categoryColors[competition.category] || categoryColors['Other'];
  
  // Format platform name
  const platformDisplay = formatPlatformName(competition.platform);

  return (
    <article
      className="card"
      style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        background: 'var(--card)',
        transition: 'box-shadow 200ms ease, transform 200ms ease',
        cursor: 'pointer',
        minHeight: 0,
        height: '100%',
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.transform = '';
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            className="text-eyebrow"
            style={{ marginBottom: 4, letterSpacing: '0.24em', fontSize: '0.625rem' }}
          >
            {platformDisplay}
          </p>
          <h3
            className="text-title"
            style={{
              margin: 0,
              color: 'var(--foreground)',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              fontSize: '1.125rem',
              lineHeight: 1.35,
            }}
          >
            {formatTitle(competition.title)}
          </h3>
          {/* Category badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: categoryStyle.bg,
              color: categoryStyle.color,
              padding: '3px 10px',
              borderRadius: 'var(--radius)',
              fontSize: '0.625rem',
              fontWeight: 500,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-ui)',
              marginTop: 6,
            }}
          >
            {competition.category}
          </span>
        </div>

        {onToggleBookmark && (
          <button
            type="button"
            onClick={() => onToggleBookmark(competition, bookmarkId)}
            aria-label={bookmarkId ? 'Remove bookmark' : 'Save bookmark'}
            aria-pressed={Boolean(bookmarkId)}
            className={`btn ${bookmarkId ? 'bookmark-saved' : 'bookmark-unsaved'}`}
            style={{
              flexShrink: 0,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '6px 12px',
              fontSize: '0.6875rem',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-ui)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              minWidth: 60,
              textAlign: 'center',
              height: 'fit-content',
            }}
          >
            {bookmarkId ? 'Saved' : 'Save'}
          </button>
        )}
      </div>

      {/* Description */}
      {!compact && (
        <p
          className="text-body-serif"
          style={{
            margin: '0 0 12px',
            color: 'var(--muted-foreground)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {competition.description || 'A curated developer competition ready for exploration.'}
        </p>
      )}

      {/* Meta grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px 12px',
          marginBottom: 12,
          borderTop: '1px solid var(--border)',
          paddingTop: 12,
        }}
      >
        {[
          ['Starts', (() => {
            const start = new Date(competition.start_date);
            const end = new Date(competition.end_date);
            // If start is within 2 hours of end, it's likely a placeholder (Kaggle competitions)
            const diffHours = (end - start) / (1000 * 60 * 60);
            if (diffHours < 2) {
              return '-';
            }
            return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          })()],
          ['Ends',   new Date(competition.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })],
          ['Location', locationDisplay],
          ...(competition.prize ? [['Prize', formatPrize(competition.prize)]] : []),
          ...(competition.difficulty ? [['Difficulty', competition.difficulty]] : []),
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-eyebrow" style={{ marginBottom: 3, fontSize: '0.5625rem', letterSpacing: '0.20em' }}>
              {label}
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--foreground)',
                lineHeight: 1.3,
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
        <DeadlinePill endDate={competition.end_date} status={competition.status} />
        <Link
          to={`/competitions/${competition.id}`}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--primary)',
            textDecoration: 'none',
            transition: 'color 150ms ease',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--foreground)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--primary)')}
        >
          View details →
        </Link>
      </div>
    </article>
  );
}
