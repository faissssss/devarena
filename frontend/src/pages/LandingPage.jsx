import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import CompetitionCard from '../components/CompetitionCard';

import kaggleLogo from '../assets/brand-logos/kaggle.svg';
import codeforcesLogo from '../assets/brand-logos/codeforces.svg';
import leetcodeLogo from '../assets/brand-logos/leetcode.svg';
import geeksforgeeksLogo from '../assets/brand-logos/geeksforgeeks.svg';
import topcoderLogo from '../assets/brand-logos/topcoder.svg';
import hackerrankLogo from '../assets/brand-logos/hackerrank.svg';
import codechefLogo from '../assets/brand-logos/codechef.svg';

// ─── SVG Brands Data ───
const brands = [
  { name: 'Kaggle', logoUrl: kaggleLogo },
  { name: 'CodeForces', logoUrl: codeforcesLogo },
  { name: 'LeetCode', logoUrl: leetcodeLogo },
  { name: 'GeeksforGeeks', logoUrl: geeksforgeeksLogo },
  { name: 'TopCoder', logoUrl: topcoderLogo },
  { name: 'HackerRank', logoUrl: hackerrankLogo },
  { name: 'CodeChef', logoUrl: codechefLogo },
];


const platformsToDisplay = [
  'AI Planet', 'AlgoLeague', 'AlgoTester', 'AtCoder', 'Code360', 'CodeChef', 'CodeDrills', 'CodeForces', 'CodeForces Gyms', 
  'CodinGame', 'CompetesAI', 'CPHOF', 'CTFtime', 'Cups Online', 'DatSteam', 'DMOJ', 'E-Olymp', 'Eluminatis', 'GeeksforGeeks', 
  'GSU', 'Kaggle', 'Kattis', 'KEP', 'Kilonova', 'LeetCode', 'LightOJ', 'Luogu', 'Midnight Code Cup', 'MITIT', 'NowCoder', 
  'Project Euler', 'RoboContest', 'TopCoder', 'Toph', 'Universal Cup', 'UOJ', 'USACO', 'Wincent Dragonbyte', 'Yandex CodeRun', 'Yandex CYF'
];

// ─── Terminal Typing Effect Component ───
const TerminalTyping = ({ words, typingSpeed = 100, deletingSpeed = 50, pauseBetweenWords = 500, pauseBeforeDelete = 2000 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Blinking cursor effect
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    
    if (!isDeleting) {
      // Typing forward
      if (currentCharIndex < currentWord.length) {
        const timeout = setTimeout(() => {
          setDisplayedText((prev) => prev + currentWord[currentCharIndex]);
          setCurrentCharIndex((prev) => prev + 1);
        }, typingSpeed);
        return () => clearTimeout(timeout);
      } else if (currentWordIndex < words.length - 1) {
        // Word complete, add newline and move to next word
        const timeout = setTimeout(() => {
          setDisplayedText((prev) => prev + '\n');
          setCurrentWordIndex((prev) => prev + 1);
          setCurrentCharIndex(0);
        }, pauseBetweenWords);
        return () => clearTimeout(timeout);
      } else {
        // All words typed, pause before deleting
        const timeout = setTimeout(() => {
          setIsComplete(true);
          setIsDeleting(true);
        }, pauseBeforeDelete);
        return () => clearTimeout(timeout);
      }
    } else {
      // Deleting backward
      if (displayedText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayedText((prev) => prev.slice(0, -1));
          
          // Check if we just deleted a newline, move to previous word
          if (displayedText[displayedText.length - 1] === '\n') {
            setCurrentWordIndex((prev) => Math.max(0, prev - 1));
          }
        }, deletingSpeed);
        return () => clearTimeout(timeout);
      } else {
        // Finished deleting, restart
        const timeout = setTimeout(() => {
          setIsDeleting(false);
          setIsComplete(false);
          setCurrentWordIndex(0);
          setCurrentCharIndex(0);
        }, pauseBetweenWords);
        return () => clearTimeout(timeout);
      }
    }
  }, [currentCharIndex, currentWordIndex, words, typingSpeed, deletingSpeed, pauseBetweenWords, pauseBeforeDelete, isDeleting, displayedText, isComplete]);

  return (
    <h1 style={{ 
      fontSize: 'clamp(3rem, 10vw, 7rem)', 
      lineHeight: 0.9, 
      letterSpacing: '-0.05em', 
      margin: '0 0 24px',
      fontFamily: 'var(--font-display)',
      textTransform: 'uppercase',
      whiteSpace: 'pre-line',
      minHeight: 'clamp(9rem, 30vw, 21rem)',
      position: 'relative',
    }}>
      {displayedText}
      <span style={{ 
        opacity: showCursor ? 1 : 0,
        transition: 'opacity 0.1s',
        color: 'var(--primary)',
        position: 'absolute',
        marginLeft: '0.1em',
      }}>_</span>
    </h1>
  );
};

// ─── Animation Components ───

const CountUp = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  return <span ref={nodeRef}>{count}{suffix}</span>;
};

const ScrollReveal = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

// ─── Mock Data ───
const mockEvents = [
  {
    id: 'm1',
    title: 'Global Algorithm Challenge 2026',
    platform: 'leetcode.com',
    category: 'Competitive Programming',
    start_date: '2026-05-15T12:00:00Z',
    end_date: '2026-05-20T12:00:00Z',
    status: 'upcoming',
    location: 'online',
    prize: '$10,000 USD',
    description: 'Test your algorithmic prowess against thousands of developers worldwide.'
  },
  {
    id: 'm2',
    title: 'Generative AI Hackathon',
    platform: 'kaggle.com',
    category: 'AI/Data Science',
    start_date: '2026-04-20T00:00:00Z',
    end_date: '2026-05-10T23:59:59Z',
    status: 'ongoing',
    location: 'San Francisco (Hybrid)',
    prize: '$25,000 in Credits',
    description: 'Build the future of LLMs in this intensive cross-domain competition.'
  },
  {
    id: 'm3',
    title: 'Byte-Sized Security CTF',
    platform: 'ctftime.org',
    category: 'CTF/Security',
    start_date: '2026-06-01T08:00:00Z',
    end_date: '2026-06-02T20:00:00Z',
    status: 'upcoming',
    location: 'online',
    prize: 'Exclusive Swag & Badges',
    description: 'A beginner-friendly Capture The Flag event for cybersecurity enthusiasts.'
  },
  {
    id: 'm4',
    title: 'Full Stack Sprint: 48H',
    platform: 'devpost.com',
    category: 'Hackathons',
    start_date: '2026-05-02T18:00:00Z',
    end_date: '2026-05-04T18:00:00Z',
    status: 'upcoming',
    location: 'Online',
    prize: 'MacBook Pro M3 Max',
    description: 'Build a production-ready application in just 48 hours.'
  },
  {
    id: 'm5',
    title: 'Web3 Security Audit Race',
    platform: 'code4rena.com',
    category: 'Web3/Blockchain',
    start_date: '2026-05-10T10:00:00Z',
    end_date: '2026-05-15T10:00:00Z',
    status: 'upcoming',
    location: 'online',
    prize: '$50,000 USDC',
    description: 'Find vulnerabilities in the latest DeFi protocols and earn big.'
  },
  {
    id: 'm6',
    title: 'MLOps Automation Challenge',
    platform: 'bitgrit.net',
    category: 'Cloud/DevOps',
    start_date: '2026-04-25T00:00:00Z',
    end_date: '2026-05-25T23:59:59Z',
    status: 'ongoing',
    location: 'online',
    prize: 'Career Opportunity & Cash',
    description: 'Optimize machine learning workflows for global scale.'
  },
];

// ─── Landing Page Component ───

export default function LandingPage() {
  const navigate = useNavigate();
  const eventsRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCTA = (e) => {
    if (e) e.preventDefault();
    navigate('/register');
  };

  const scrollToEvents = (e) => {
    e.preventDefault();
    eventsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ background: 'var(--background)', color: 'var(--foreground)', overflowX: 'hidden' }}>
      
      {/* Back to Top Arrow */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '40px',
            right: '40px',
            zIndex: 1000,
            background: 'var(--foreground)',
            color: 'var(--background)',
            border: 'none',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
            animation: 'fadeIn 0.3s ease forwards'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
      )}

      {/* ─── Hero Section ─── */}
      <section style={{ 
        minHeight: '100dvh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'flex-start', 
        alignItems: 'center', 
        textAlign: 'center', 
        position: 'relative',
        padding: '12vh 24px 120px',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        {/* Animated Background Nodes */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.05, pointerEvents: 'none' }}>
           <svg width="100%" height="100%">
             <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
               <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
             </pattern>
             <rect width="100%" height="100%" fill="url(#grid)" />
           </svg>
        </div>
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
          <ScrollReveal>
            <TerminalTyping 
              words={['Code.', 'Compete.', 'Conquer.']} 
              typingSpeed={80} 
              deletingSpeed={40}
              pauseBetweenWords={300} 
              pauseBeforeDelete={2000}
            />
          </ScrollReveal>
          
          <ScrollReveal delay={0.2}>
            <p className="text-body-serif" style={{ 
              fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
              color: 'var(--muted-foreground)', 
              maxWidth: 600, 
              margin: '0 auto 40px' 
            }}>
              Your radar for tech competitions. Discover everything from web dev hackathons to deep learning challenges in one place.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={scrollToEvents} className="btn-dark" style={{ padding: '16px 32px', fontSize: '1rem', border: 'none', cursor: 'pointer' }}>
                Explore Events
              </button>
              <Link to="/register" className="btn-primary" style={{ padding: '16px 32px', fontSize: '1rem' }}>
                Get Started
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Floating Code Snippets Decoration */}
        <div className="dark:opacity-20 opacity-10" style={{ 
          position: 'absolute', 
          bottom: '10%', 
          right: '5%', 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.75rem', 
          textAlign: 'left'
        }}>
          <pre>{`def optimize():\n  for contest in feed:\n    if value > noise:\n      shortlist(contest)`}</pre>
        </div>
      </section>

      {/* ─── Brand Marquee ─── */}
      <section style={{ 
        borderBottom: '1px solid var(--border)', 
        padding: '24px 0', 
        background: 'var(--background)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        position: 'relative'
      }}>
        <div style={{ 
          display: 'inline-flex', 
          animation: 'marquee 60s linear infinite',
          gap: 80,
          alignItems: 'center'
        }}>
          {[...brands, ...brands, ...brands, ...brands].map((b, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              color: 'var(--muted-foreground)',
              opacity: 0.6,
              transition: 'opacity 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
            >
              <img
                src={b.logoUrl}
                alt={`${b.name} logo`}
                loading="lazy"
                style={{
                  width: 32,
                  height: 32,
                  objectFit: 'contain',
                  display: 'block',
                  flexShrink: 0,
                  filter: 'brightness(0) invert(1)',
                }}
              />
              <span style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: '0.875rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em',
                fontWeight: 600
              }}>
                {b.name}
              </span>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-25%); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </section>

      {/* ─── Statistics Section ─── */}
      <section style={{ padding: '80px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 48,
          textAlign: 'center'
        }}>
          {[
            { label: 'Competitions Tracking', value: 500, suffix: '+' },
            { label: 'Data Sources Syncing', value: 40, suffix: '+' },
            { label: 'Developers Hunting', value: 1200, suffix: '+' },
            { label: 'Active Prize Pool', value: 2, suffix: 'M+' }
          ].map((stat, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <p style={{ 
                fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
                fontFamily: 'var(--font-display)', 
                margin: 0, 
                lineHeight: 1 
              }}>
                <CountUp end={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-eyebrow" style={{ marginTop: 12 }}>{stat.label}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ─── Events Bento Grid ─── */}
      <section ref={eventsRef} style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 48, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <p className="text-eyebrow" style={{ marginBottom: 8 }}>Live Feed</p>
            <h2 className="text-section" style={{ margin: 0 }}>Trending in the ecosystem.</h2>
          </div>
          <button onClick={handleCTA} className="btn-ghost" style={{ border: '1px solid var(--border)', padding: '10px 24px' }}>
            View all Events →
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', 
          gap: 24 
        }}>
          {mockEvents.map((event, i) => (
            <ScrollReveal key={event.id} delay={i * 0.1}>
              <div onClick={handleCTA} style={{ height: '100%' }}>
                <CompetitionCard 
                   competition={event} 
                   onToggleBookmark={() => navigate('/login')}
                />
              </div>
            </ScrollReveal>
          ))}
        </div>
        
        {/* Call to Action Grid Injected */}
        <ScrollReveal delay={0.4}>
          <div style={{ 
            marginTop: 24, 
            background: 'var(--foreground)', 
            color: 'var(--background)',
            padding: '60px 40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <h3 className="text-section" style={{ color: 'var(--background)', marginBottom: 16 }}>Ready to start your hunt?</h3>
            <p className="text-body-serif" style={{ color: 'var(--background)', opacity: 0.7, maxWidth: 500, margin: '0 0 32px' }}>
              Join thousands of developers tracking the most lucrative and challenging builds in technology.
            </p>
            <Link to="/register" className="btn" style={{ 
              background: 'var(--primary)', 
              color: 'var(--primary-foreground)', 
              padding: '16px 48px',
              fontSize: '1rem'
            }}>
              Create Free Account
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── Proper Footer ─── */}
      <footer style={{ 
        padding: '120px 24px 40px', 
        borderTop: '1px solid var(--border)', 
        background: 'var(--background)',
        position: 'relative'
      }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          textAlign: 'center'
        }}>
          {/* Huge Branding Text */}
          <h1 style={{ 
            fontSize: 'clamp(4rem, 20vw, 15rem)', 
            fontFamily: 'var(--font-display)', 
            textTransform: 'uppercase', 
            letterSpacing: '-0.05em', 
            margin: '0 0 40px',
            lineHeight: 0.8,
            color: 'var(--foreground)',
            opacity: 1
          }}>
            DevArena
          </h1>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 48, 
            marginBottom: 64,
            flexWrap: 'wrap'
          }}>
            {/* Links removed as requested */}
          </div>
        </div>

        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          paddingTop: 32, 
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <p className="text-eyebrow" style={{ opacity: 0.5, margin: 0 }}>© 2026 DevArena Platform • Built for the elite.</p>
          <div style={{ display: 'flex', gap: 24 }}>
             <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>STATUS: OPERATIONAL</span>
             <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>v1.0.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
