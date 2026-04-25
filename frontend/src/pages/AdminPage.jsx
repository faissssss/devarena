import { useEffect, useState } from 'react';

import SectionHeading from '../components/SectionHeading';
import { adminApi, unwrapError } from '../services/api';

const statusColors = {
  success: { bg: 'rgba(31,138,101,0.10)', color: '#1f8a65' },
  error:   { bg: 'rgba(207,45,86,0.10)',  color: 'var(--color-error)' },
  partial: { bg: 'rgba(192,133,50,0.12)', color: 'var(--color-gold)' },
};

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [statsRes, logsRes] = await Promise.all([adminApi.getStats(), adminApi.getSyncLogs()]);
      setStats(statsRes.stats);
      setCompetitions(statsRes.competitions?.competitions || []);
      setLogs(logsRes.logs || []);
    } catch (err) {
      setError(unwrapError(err, 'Unable to load admin data'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSync() {
    setMessage('');
    setError('');
    setSyncing(true);
    try {
      const res = await adminApi.sync();
      setMessage(`Sync finished. Processed ${res.totalProcessed} competitions.`);
      await load();
    } catch (err) {
      setError(unwrapError(err, 'Unable to trigger sync'));
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this competition? This cannot be undone.')) return;
    try {
      await adminApi.deleteCompetition(id);
      await load();
    } catch (err) {
      setError(unwrapError(err, 'Unable to delete competition'));
    }
  }

  async function handleEdit(competition) {
    const title = window.prompt('Edit title', competition.title);
    if (!title || title === competition.title) return;
    try {
      await adminApi.updateCompetition(competition.id, { title });
      await load();
    } catch (err) {
      setError(unwrapError(err, 'Unable to update competition'));
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <SectionHeading
          eyebrow="Admin"
          title="Platform controls."
          body="Trigger syncs, monitor ingestion health, and manage competition records."
        />
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="btn btn-accent"
          style={{
            padding: '10px 20px',
            flexShrink: 0,
            opacity: syncing ? 0.6 : 1,
            cursor: syncing ? 'not-allowed' : 'pointer',
          }}
        >
          {syncing ? 'Syncing…' : 'Run manual sync'}
        </button>
      </div>

      {/* Feedback */}
      {message && (
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            color: '#1f8a65',
            background: 'rgba(31,138,101,0.10)',
            border: '1px solid rgba(31,138,101,0.25)',
            borderRadius: 8,
            padding: '10px 14px',
          }}
        >
          {message}
        </p>
      )}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10 }} />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { label: 'Users',        value: stats?.userCount ?? 0 },
              { label: 'Competitions', value: stats?.competitionCount ?? 0 },
              { label: 'Bookmarks',    value: stats?.bookmarkCount ?? 0 },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: 'var(--surface-100)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 10,
                  padding: '18px 20px',
                }}
              >
                <p className="text-eyebrow" style={{ marginBottom: 8 }}>{label}</p>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2.25rem',
                    fontWeight: 400,
                    letterSpacing: '-0.72px',
                    color: 'var(--color-dark)',
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Two-column panel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 20 }}>

            {/* Sync logs */}
            <section
              style={{
                background: 'var(--surface-100)',
                border: '1px solid var(--border-primary)',
                borderRadius: 12,
                padding: '20px 22px',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.125rem',
                  fontWeight: 400,
                  letterSpacing: '-0.08px',
                  color: 'var(--color-dark)',
                  margin: '0 0 16px',
                }}
              >
                Sync logs
              </h2>
              {logs.length === 0 ? (
                <p className="text-body-serif" style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  No sync logs yet. Run a manual sync to get started.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {logs.map((log) => {
                    const sc = statusColors[log.status] || statusColors.partial;
                    return (
                      <div
                        key={log.id}
                        style={{
                          background: 'var(--surface-300)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 8,
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: 'var(--color-dark)',
                              margin: '0 0 3px',
                              textTransform: 'capitalize',
                            }}
                          >
                            {log.source}
                          </p>
                          <p
                            style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              margin: 0,
                            }}
                          >
                            {new Date(log.synced_at).toLocaleString()} · {log.record_count} records
                          </p>
                        </div>
                        <span
                          style={{
                            background: sc.bg,
                            color: sc.color,
                            padding: '2px 8px',
                            borderRadius: 9999,
                            fontSize: '0.6875rem',
                            fontWeight: 500,
                            letterSpacing: '0.16em',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-ui)',
                            flexShrink: 0,
                          }}
                        >
                          {log.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Competition management */}
            <section
              style={{
                background: 'var(--surface-100)',
                border: '1px solid var(--border-primary)',
                borderRadius: 12,
                padding: '20px 22px',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.125rem',
                  fontWeight: 400,
                  letterSpacing: '-0.08px',
                  color: 'var(--color-dark)',
                  margin: '0 0 16px',
                }}
              >
                Competition management
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {competitions.map((comp) => (
                  <div
                    key={comp.id}
                    style={{
                      background: 'var(--surface-300)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 8,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--color-dark)',
                          margin: '0 0 3px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {comp.title}
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          margin: 0,
                          textTransform: 'capitalize',
                        }}
                      >
                        {comp.platform} · {comp.status}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(comp)}
                        className="btn btn-primary"
                        style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: 6 }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(comp.id)}
                        className="btn"
                        style={{
                          padding: '5px 10px',
                          fontSize: '0.75rem',
                          borderRadius: 6,
                          background: 'rgba(207,45,86,0.10)',
                          color: 'var(--color-error)',
                          border: '1px solid rgba(207,45,86,0.20)',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
