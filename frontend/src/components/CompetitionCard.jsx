import { Link } from 'react-router-dom';

const statusColors = {
  upcoming:  { bg: 'rgba(31,138,101,0.10)', color: '#1f8a65' },
  ongoing:   { bg: 'rgba(245,78,0,0.10)',   color: '#f54e00' },
  ended:     { bg: 'rgba(38,37,30,0.08)',   color: 'var(--text-secondary)' },
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
          background: 'rgba(207,45,86,0.10)',
          color: 'var(--color-error)',
          padding: '2px 8px',
          borderRadius: 9999,
          fontSize: '0.6875rem',
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-ui)',
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--color-error)',
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
        padding: '2px 8px',
        borderRadius: 9999,
        fontSize: '0.6875rem',
        fontWeight: 500,
        letterSpacing: '0.18em',
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
  return (
    <article
      className="card"
      style={{
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        background: 'var(--surface-100)',
        transition: 'box-shadow 200ms ease, transform 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'rgba(0,0,0,0.16) 0px 24px 60px, rgba(0,0,0,0.10) 0px 8px 24px, rgba(38,37,30,0.12) 0px 0px 0px 1px';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.transform = '';
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            className="text-eyebrow"
            style={{ marginBottom: 6, letterSpacing: '0.28em', fontSize: '0.625rem' }}
          >
            {competition.platform} · {competition.category}
          </p>
          <h3
            className="text-title"
            style={{
              margin: 0,
              color: 'var(--color-dark)',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {competition.title}
          </h3>
        </div>

        {onToggleBookmark && (
          <button
            type="button"
            onClick={() => onToggleBookmark(competition, bookmarkId)}
            aria-label={bookmarkId ? 'Remove bookmark' : 'Save bookmark'}
            aria-pressed={Boolean(bookmarkId)}
            style={{
              flexShrink: 0,
              background: bookmarkId ? 'var(--color-dark)' : 'var(--surface-300)',
              color: bookmarkId ? '#fef9f0' : 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 9999,
              padding: '4px 10px',
              fontSize: '0.6875rem',
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-ui)',
              cursor: 'pointer',
              transition: 'background 150ms ease, color 150ms ease',
              minWidth: 52,
              textAlign: 'center',
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
            margin: '0 0 16px',
            color: 'var(--text-secondary)',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            fontSize: '0.9375rem',
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
          gap: '10px 16px',
          marginBottom: 16,
          borderTop: '1px solid var(--border-primary)',
          paddingTop: 14,
        }}
      >
        {[
          ['Starts', new Date(competition.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })],
          ['Ends',   new Date(competition.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })],
          ['Source', competition.source],
          ['Location', competition.location || 'Online'],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-eyebrow" style={{ marginBottom: 2, fontSize: '0.6rem', letterSpacing: '0.22em' }}>
              {label}
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--color-dark)',
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
        <DeadlinePill endDate={competition.end_date} status={competition.status} />
        <Link
          to={`/competitions/${competition.id}`}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-accent)',
            textDecoration: 'none',
            transition: 'color 150ms ease',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#d94400')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
        >
          View details →
        </Link>
      </div>
    </article>
  );
}
