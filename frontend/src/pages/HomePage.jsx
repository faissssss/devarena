import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import CompetitionCard from '../components/CompetitionCard';
import { useAuth } from '../context/AuthContext';
import { bookmarkApi, competitionApi, unwrapError } from '../services/api';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [newest, setNewest] = useState([]);
  const [popular, setPopular] = useState([]);
  const [bookmarks, setBookmarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        // Featured: Ongoing + Upcoming competitions (5-10 max)
        // First get ongoing, then upcoming to fill up to 10
        const ongoingRes = await competitionApi.list({ status: 'ongoing', limit: 10 });
        const ongoingComps = ongoingRes.competitions || [];
        
        let featuredComps = [...ongoingComps];
        
        // If we have less than 10, add upcoming competitions
        if (featuredComps.length < 10) {
          const upcomingRes = await competitionApi.list({ 
            status: 'upcoming', 
            limit: 10 - featuredComps.length 
          });
          featuredComps = [...featuredComps, ...(upcomingRes.competitions || [])];
        }
        
        // Newest: Recently launched competitions (sorted by start_date DESC, limit 10)
        const newestRes = await competitionApi.list({ limit: 10, page: 1 });
        
        // Popular: Competitions with prizes (proxy for "famous"), any status, limit 10
        // We'll fetch competitions and sort by prize amount (competitions with prizes are typically more popular)
        const allRes = await competitionApi.list({ limit: 50 });
        const withPrizes = (allRes.competitions || [])
          .filter(comp => comp.prize && comp.prize.trim() !== '')
          .slice(0, 10);
        
        if (cancelled) return;
        
        setFeatured(featuredComps.slice(0, 10));
        setNewest(newestRes.competitions || []);
        setPopular(withPrizes);
        
        if (isAuthenticated) {
          const bmRes = await bookmarkApi.list();
          if (!cancelled) {
            setBookmarks(
              Object.fromEntries((bmRes.bookmarks || []).map((b) => [b.competition_id, b.id]))
            );
          }
        }
      } catch (err) {
        if (!cancelled) setError(unwrapError(err, 'Unable to load competitions'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

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

  function SectionHeader({ title, viewAllLink }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.375rem',
            fontWeight: 400,
            letterSpacing: '-0.11px',
            color: 'var(--foreground)',
            margin: 0,
          }}
        >
          {title}
        </h2>
        <Link
          to={viewAllLink}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--primary)',
            textDecoration: 'none',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--foreground)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--primary)')}
        >
          View all →
        </Link>
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
          minWidth: 320,
          width: 320,
        }}
      >
        <div className="skeleton" style={{ height: 10, width: '40%' }} />
        <div className="skeleton" style={{ height: 18, width: '75%' }} />
        <div className="skeleton" style={{ height: 18, width: '55%' }} />
        <div className="skeleton" style={{ height: 50, marginTop: 2 }} />
      </div>
    );
  }

  function HorizontalScrollSection({ title, competitions, viewAllLink, loading }) {
    return (
      <section>
        <SectionHeader title={title} viewAllLink={viewAllLink} />
        {loading ? (
          <div style={{ 
            display: 'flex', 
            gap: 16, 
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingBottom: 16,
            marginBottom: -16,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
          className="hide-scrollbar"
          >
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : competitions.length === 0 ? (
          <div
            style={{
              background: 'var(--card)',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius)',
              padding: '40px 32px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--muted-foreground)', margin: 0 }}>
              No competitions available at the moment.
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            gap: 16, 
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingBottom: 16,
            marginBottom: -16,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
          className="hide-scrollbar"
          >
            {competitions.map((comp) => (
              <div key={comp.id} style={{ minWidth: 320, width: 320, flexShrink: 0 }}>
                <CompetitionCard
                  competition={comp}
                  bookmarkId={bookmarks[comp.id]}
                  onToggleBookmark={toggleBookmark}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48, overflowX: 'hidden', width: '100%' }}>
      {/* Welcome header */}
      <div>
        <p className="text-eyebrow" style={{ marginBottom: 8 }}>Home</p>
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
          Discover competitions
        </h1>
        <p
          className="text-body-serif"
          style={{ color: 'var(--muted-foreground)', margin: '8px 0 0', fontSize: '0.9375rem' }}
        >
          Curated selections from across the developer competition landscape.
        </p>
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

      {/* Featured Section */}
      <HorizontalScrollSection 
        title="Featured" 
        competitions={featured} 
        viewAllLink="/explore"
        loading={loading}
      />

      {/* Newest Section */}
      <HorizontalScrollSection 
        title="Newest" 
        competitions={newest} 
        viewAllLink="/explore"
        loading={loading}
      />

      {/* Popular Section */}
      <HorizontalScrollSection 
        title="Popular" 
        competitions={popular} 
        viewAllLink="/explore"
        loading={loading}
      />
    </div>
  );
}
