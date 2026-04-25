import { Link } from 'react-router-dom';

const features = [
  {
    label: 'Multi-source aggregation',
    body: 'Kontests, CLIST, and Kaggle feeds unified into one editorial surface.',
  },
  {
    label: 'Fast filtering',
    body: 'Slice by category, timing, and source without losing the bigger picture.',
  },
  {
    label: 'Personal watchlists',
    body: 'Bookmark competitions that matter and keep deadline pressure visible.',
  },
];

const stats = [
  { value: '3+', label: 'Data sources' },
  { value: '4',  label: 'Categories' },
  { value: '∞',  label: 'Competitions' },
];

export default function LandingPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

      {/* ── Hero ── */}
      <section
        style={{
          background: 'var(--color-dark)',
          borderRadius: 16,
          padding: 'clamp(40px, 6vw, 72px) clamp(28px, 5vw, 64px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Warm gradient overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 15% 20%, rgba(245,78,0,0.22) 0%, transparent 40%), radial-gradient(circle at 85% 75%, rgba(192,133,50,0.15) 0%, transparent 35%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: 48,
            alignItems: 'end',
          }}
        >
          {/* Left: headline */}
          <div>
            <p
              className="text-eyebrow"
              style={{ color: 'rgba(254,249,240,0.55)', marginBottom: 20 }}
            >
              Developer competition intelligence
            </p>
            <h1
              className="text-hero"
              style={{ color: '#fef9f0', margin: 0 }}
            >
              A calmer way to hunt for your next big build.
            </h1>
            <p
              className="text-body-serif"
              style={{
                color: 'rgba(254,249,240,0.65)',
                marginTop: 24,
                maxWidth: 480,
              }}
            >
              DevArena turns scattered competition feeds into one editorial dashboard,
              built for developers who want signal instead of noise.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 36 }}>
              <Link
                to="/explore"
                className="btn"
                style={{
                  background: 'var(--color-accent)',
                  color: '#fff',
                  padding: '11px 22px',
                  borderRadius: 9999,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.18em',
                }}
              >
                Explore competitions
              </Link>
              <Link
                to="/register"
                className="btn"
                style={{
                  background: 'transparent',
                  color: 'rgba(254,249,240,0.80)',
                  border: '1px solid rgba(254,249,240,0.25)',
                  padding: '11px 22px',
                  borderRadius: 9999,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.18em',
                }}
              >
                Create account
              </Link>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.75rem',
                      fontWeight: 400,
                      letterSpacing: '-0.5px',
                      color: '#fef9f0',
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </p>
                  <p className="text-eyebrow" style={{ color: 'rgba(254,249,240,0.45)', marginTop: 4 }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: feature cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {features.map((f) => (
              <div
                key={f.label}
                style={{
                  background: 'rgba(254,249,240,0.06)',
                  border: '1px solid rgba(254,249,240,0.10)',
                  borderRadius: 10,
                  padding: '18px 20px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.0625rem',
                    fontWeight: 400,
                    letterSpacing: '-0.08px',
                    color: '#fef9f0',
                    margin: '0 0 6px',
                  }}
                >
                  {f.label}
                </p>
                <p
                  className="text-body-serif"
                  style={{ color: 'rgba(254,249,240,0.55)', margin: 0, fontSize: '0.9375rem' }}
                >
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value prop ── */}
      <section
        style={{
          background: 'var(--surface-100)',
          border: '1px solid var(--border-primary)',
          borderRadius: 16,
          padding: 'clamp(32px, 4vw, 56px) clamp(28px, 4vw, 56px)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 40,
            alignItems: 'start',
          }}
        >
          <div>
            <p className="text-eyebrow" style={{ marginBottom: 12 }}>What you get</p>
            <h2 className="text-section" style={{ margin: 0 }}>
              One surface for scouting, saving, and acting.
            </h2>
          </div>
          <p
            className="text-body-serif"
            style={{ color: 'var(--text-secondary)', margin: 0, paddingTop: 4 }}
          >
            Move from broad discovery to focused follow-through with fewer tabs,
            fewer missed deadlines, and a more deliberate shortlist. DevArena keeps
            the competitions that matter front and center — so you spend time building,
            not searching.
          </p>
        </div>

        {/* Feature grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: 16,
            marginTop: 40,
          }}
        >
          {[
            { icon: '⬡', title: 'Unified feed', body: 'All major competition platforms in one place.' },
            { icon: '◈', title: 'Smart filters', body: 'Category, status, source — filter without friction.' },
            { icon: '◉', title: 'Bookmarks', body: 'Save and track competitions with one click.' },
            { icon: '◎', title: 'Deadline radar', body: 'Urgency signals surface before it\'s too late.' },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: 'var(--surface-300)',
                border: '1px solid var(--border-primary)',
                borderRadius: 10,
                padding: '20px 20px',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  color: 'var(--color-accent)',
                  display: 'block',
                  marginBottom: 10,
                }}
              >
                {item.icon}
              </span>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 400,
                  letterSpacing: '-0.04px',
                  color: 'var(--color-dark)',
                  margin: '0 0 6px',
                }}
              >
                {item.title}
              </p>
              <p
                className="text-body-serif"
                style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}
              >
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section
        style={{
          background: 'var(--surface-300)',
          border: '1px solid var(--border-primary)',
          borderRadius: 16,
          padding: '36px 40px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.375rem',
              fontWeight: 400,
              letterSpacing: '-0.11px',
              color: 'var(--color-dark)',
              margin: 0,
            }}
          >
            Ready to find your next competition?
          </h2>
          <p className="text-body-serif" style={{ color: 'var(--text-secondary)', margin: '6px 0 0' }}>
            Free to use. No credit card required.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-dark" style={{ padding: '10px 20px' }}>
            Get started
          </Link>
          <Link to="/explore" className="btn btn-primary" style={{ padding: '10px 20px' }}>
            Browse first
          </Link>
        </div>
      </section>
    </div>
  );
}
