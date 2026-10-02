import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SuperAdminLayout } from '../components/SuperAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import {
  eventSyncService,
  type EventFeedSourceRow,
  type ScrapedSyncLog,
  type ScrapedSyncLogDetails,
} from '../services/event-sync.service';

function formatYyyyMm(ym: string): string {
  const [y, mo] = ym.split('-');
  if (!y || !mo) return ym;
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

function SyncLogQaPanel({ details }: { details: ScrapedSyncLogDetails | null | undefined }) {
  if (!details || typeof details !== 'object') return null;
  const r = details.run;
  const c = details.counts;
  const months = details.monthsCoveredInSyncTimezone ?? [];
  const range = details.startDateRangeUtc;
  const samples = details.sampleEvents ?? [];

  return (
    <div className="admin-form-callout mt-2 small">
      <div className="fw-semibold text-dark mb-2">QA / debug</div>
      <ul className="mb-2 ps-3 text-muted" style={{ lineHeight: 1.6 }}>
        <li>
          <strong className="text-dark">URL saved:</strong>{' '}
          {details.sourceUrlSaved ?? details.sourceUrlFetched ?? '—'}
        </li>
        <li>
          <strong className="text-dark">Page fetched:</strong>{' '}
          {details.sourceUrlFetched ? (
            <a href={details.sourceUrlFetched} target="_blank" rel="noreferrer" className="text-break">
              {details.sourceUrlFetched}
            </a>
          ) : (
            '—'
          )}
          {details.calendarUrlDiscovered ? (
            <span className="d-block mt-1 text-success">
              Auto-discovered calendar: {details.calendarUrlDiscovered}
            </span>
          ) : null}
        </li>
        <li>
          <strong className="text-dark">Extraction:</strong> {r?.extractionMode ?? '—'}
          {r?.fetchedWithPlaywright ? ' · Playwright render' : ' · HTTP HTML only'}
        </li>
        <li>
          <strong className="text-dark">HTML size:</strong>{' '}
          {r?.htmlLengthChars != null ? `${r.htmlLengthChars.toLocaleString()} chars` : '—'} ·{' '}
          <strong className="text-dark">Duration:</strong>{' '}
          {r?.durationMs != null ? `${r.durationMs} ms` : '—'}
        </li>
        <li>
          <strong className="text-dark">Month buckets</strong> (
          {r?.timezoneUsedForMonthBuckets ?? 'timezone'}):{' '}
          {months.length
            ? months.map((m) => `${formatYyyyMm(m)} (${m})`).join('; ')
            : 'none (no parsed start dates)'}
        </li>
        <li>
          <strong className="text-dark">Start date range (UTC):</strong>{' '}
          {range?.min && range?.max ? `${range.min} → ${range.max}` : '—'}
        </li>
        <li>
          <strong className="text-dark">Month window:</strong>{' '}
          {details.ingestionMonthWindow
            ? `${details.ingestionMonthWindow.firstDayInclusive} – ${details.ingestionMonthWindow.lastDayInclusive} (${details.ingestionMonthWindow.timeZone})`
            : '—'}
        </li>
        <li>
          <strong className="text-dark">Counts:</strong> parsed {c?.parsedFromPage ?? '—'}, in month{' '}
          {c?.inCurrentMonthWindow ?? c?.withStartDate ?? '—'}, upserted {c?.upsertedToDatabase ?? '—'},
          skipped no date {c?.skippedNoStartDate ?? c?.withoutStartDate ?? '—'}, outside month{' '}
          {c?.skippedOutsideMonthWindow ?? '—'}
        </li>
      </ul>
      {samples.length > 0 ? (
        <>
          <div className="fw-semibold text-dark mb-1">Sample events (up to 10, earliest first)</div>
          <div className="table-responsive">
            <table className="table table-sm table-bordered mb-3 bg-white">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Month (tz)</th>
                  <th>Start (UTC)</th>
                  <th>Venue</th>
                  <th style={{ minWidth: 200 }}>Row JSON (raw)</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((ev, i) => (
                  <tr key={i}>
                    <td>
                      {ev.sourceUrl ? (
                        <a href={ev.sourceUrl} target="_blank" rel="noreferrer">
                          {ev.title ?? '—'}
                        </a>
                      ) : (
                        (ev.title ?? '—')
                      )}
                    </td>
                    <td>
                      {ev.startMonthInTimezone
                        ? `${formatYyyyMm(ev.startMonthInTimezone)} (${ev.startMonthInTimezone})`
                        : '—'}
                    </td>
                    <td className="text-break">{ev.startDateUtc ?? '—'}</td>
                    <td>{ev.venue ?? '—'}</td>
                    <td className="p-1 align-top">
                      <pre
                        className="mb-0 small"
                        style={{
                          margin: 0,
                          maxHeight: 160,
                          overflow: 'auto',
                          background: '#f1f5f9',
                          borderRadius: 6,
                          padding: '0.35rem 0.5rem',
                          fontSize: '0.68rem',
                          lineHeight: 1.35,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {JSON.stringify(ev, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
      {details.validationHints?.note ? (
        <p className="text-muted mb-2 fst-italic small">{details.validationHints.note}</p>
      ) : null}
      <div className="fw-semibold text-dark mb-1">Full sync run JSON</div>
      <pre className="admin-code-block admin-code-block--dark mb-0">{JSON.stringify(details, null, 2)}</pre>
    </div>
  );
}

type SourceLogGroup = {
  sourceId: string;
  name: string;
  url: string;
  logs: ScrapedSyncLog[];
};

function groupLogsBySource(logs: ScrapedSyncLog[]): SourceLogGroup[] {
  const map = new Map<string, SourceLogGroup>();
  for (const log of logs) {
    const existing = map.get(log.sourceId);
    if (existing) {
      existing.logs.push(log);
    } else {
      map.set(log.sourceId, {
        sourceId: log.sourceId,
        name: log.source?.name ?? 'Unknown source',
        url: log.source?.websiteUrl ?? '',
        logs: [log],
      });
    }
  }
  for (const g of map.values()) {
    g.logs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }
  return [...map.values()].sort(
    (a, b) =>
      new Date(b.logs[0]?.startedAt ?? 0).getTime() - new Date(a.logs[0]?.startedAt ?? 0).getTime(),
  );
}

function SyncLogEntry({ log }: { log: ScrapedSyncLog }) {
  const statusColor =
    log.status === 'failed' ? '#B91C1C' : log.totalEvents > 0 ? '#047857' : '#6c757d';

  return (
    <details
      className="sync-log-entry mb-2"
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        background: '#fff',
      }}
    >
      <summary
        className="px-3 py-2 small"
        style={{
          cursor: 'pointer',
          listStyle: 'none',
          fontWeight: 600,
          color: '#1a1f2e',
        }}
      >
        <span style={{ color: statusColor }}>{log.status}</span>
        {' · '}
        {log.totalEvents} event{log.totalEvents === 1 ? '' : 's'}
        {' · '}
        <span style={{ color: '#6c757d', fontWeight: 500 }}>
          {new Date(log.startedAt).toLocaleString()}
        </span>
      </summary>
      <div className="px-3 pb-3 border-top" style={{ borderColor: '#e2e8f0' }}>
        {log.errors ? (
          <p className="text-danger small text-break mt-2 mb-2">{log.errors}</p>
        ) : null}
        <SyncLogQaPanel details={log.detailsJson} />
      </div>
    </details>
  );
}

function SyncLogsBySchoolAccordion({ logs }: { logs: ScrapedSyncLog[] }) {
  const groups = useMemo(() => groupLogsBySource(logs), [logs]);
  const [openSchools, setOpenSchools] = useState<Set<string>>(new Set());
  const didAutoOpen = useRef(false);

  useEffect(() => {
    if (!didAutoOpen.current && groups.length > 0) {
      didAutoOpen.current = true;
      setOpenSchools(new Set([groups[0].sourceId]));
    }
  }, [groups]);

  const toggleSchool = (sourceId: string) => {
    setOpenSchools((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) next.delete(sourceId);
      else next.add(sourceId);
      return next;
    });
  };

  const expandAll = () => setOpenSchools(new Set(groups.map((g) => g.sourceId)));
  const collapseAll = () => setOpenSchools(new Set());

  return (
    <div>
      <div className="d-flex justify-content-end gap-2 mb-2">
        <button type="button" className="btn btn-link btn-sm p-0 text-muted" onClick={expandAll}>
          Expand all
        </button>
        <span className="text-muted">·</span>
        <button type="button" className="btn btn-link btn-sm p-0 text-muted" onClick={collapseAll}>
          Collapse all
        </button>
      </div>
      <div className="d-flex flex-column gap-2">
        {groups.map((group) => {
          const open = openSchools.has(group.sourceId);
          const latest = group.logs[0];
          const totalEvents = group.logs.reduce((sum, l) => sum + l.totalEvents, 0);

          return (
            <div
              key={group.sourceId}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                overflow: 'hidden',
                background: open ? '#fff' : '#f8fafc',
              }}
            >
              <button
                type="button"
                onClick={() => toggleSchool(group.sourceId)}
                className="w-100 text-start border-0 d-flex align-items-start gap-2 px-3 py-3"
                style={{
                  background: open ? '#f1f5f9' : 'transparent',
                  cursor: 'pointer',
                }}
                aria-expanded={open}
              >
                <i
                  className={`bi ${open ? 'bi-chevron-down' : 'bi-chevron-right'}`}
                  style={{ marginTop: 2, flexShrink: 0, color: '#64748b' }}
                  aria-hidden
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fw-semibold text-dark" style={{ fontSize: '0.95rem' }}>
                    {group.name}
                  </div>
                  {group.url ? (
                    <div
                      className="text-muted text-truncate"
                      style={{ fontSize: '0.75rem', maxWidth: '100%' }}
                      title={group.url}
                    >
                      {group.url}
                    </div>
                  ) : null}
                  <div className="mt-1 d-flex flex-wrap gap-2 align-items-center">
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 6,
                        background: '#EEF3FF',
                        color: '#2D6BFF',
                      }}
                    >
                      {group.logs.length} sync{group.logs.length === 1 ? '' : 's'}
                    </span>
                    {latest ? (
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Latest: {latest.status} · {latest.totalEvents} events ·{' '}
                        {new Date(latest.startedAt).toLocaleString()}
                      </span>
                    ) : null}
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {totalEvents} total upserted (all runs)
                    </span>
                  </div>
                </div>
              </button>
              {open ? (
                <div className="px-3 pb-3 pt-1" style={{ background: '#fff' }}>
                  {group.logs.map((log) => (
                    <SyncLogEntry key={log.id} log={log} />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const SuperAdminEventSync = () => {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [selectorJson, setSelectorJson] = useState('');

  const sourcesQuery = useQuery({
    queryKey: ['event-sync', 'sources'],
    queryFn: () => eventSyncService.listSources(),
  });

  const legacySourcesQuery = useQuery({
    queryKey: ['event-sync', 'legacy-sources'],
    queryFn: () => eventSyncService.listLegacyUniversitySources(),
  });

  const feedSources = useMemo((): EventFeedSourceRow[] => {
    const scraped: EventFeedSourceRow[] = (sourcesQuery.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      url: s.websiteUrl,
      feedKind: 'scraped' as const,
      active: s.active,
      totalEvents: s.totalEvents ?? 0,
      lastSyncedAt: s.lastSyncedAt,
      scraperType: s.scraperType,
    }));
    const legacy: EventFeedSourceRow[] = (legacySourcesQuery.data ?? []).map((s) => ({
      id: s.id,
      name: s.universityName,
      url: s.url,
      feedKind: 'legacy' as const,
      active: s.isActive,
      totalEvents: s.totalEvents,
      lastSyncedAt: s.lastSyncedAt,
      legacyStatus: s.status,
    }));
    return [...scraped, ...legacy].sort((a, b) => a.name.localeCompare(b.name));
  }, [sourcesQuery.data, legacySourcesQuery.data]);

  const logsQuery = useQuery({
    queryKey: ['event-sync', 'logs'],
    queryFn: () => eventSyncService.listLogs(30),
  });

  const statusQuery = useQuery({
    queryKey: ['event-sync', 'status'],
    queryFn: () => eventSyncService.syncStatus(),
  });

  const createMut = useMutation({
    mutationFn: () => {
      let selectorsJson: Record<string, unknown> | undefined;
      if (selectorJson.trim()) {
        try {
          selectorsJson = JSON.parse(selectorJson) as Record<string, unknown>;
        } catch {
          throw new Error('Selectors must be valid JSON (Phase 4: titleSelector, etc.)');
        }
      }
      return eventSyncService.createSource({
        name: name.trim(),
        websiteUrl: websiteUrl.trim(),
        scraperType: 'generic',
        selectorsJson,
        active: true,
      });
    },
    onSuccess: () => {
      setName('');
      setWebsiteUrl('');
      setSelectorJson('');
      void qc.invalidateQueries({ queryKey: ['event-sync'] });
      void qc.invalidateQueries({ queryKey: ['public', 'universities'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (row: EventFeedSourceRow) =>
      row.feedKind === 'legacy'
        ? eventSyncService.deleteLegacyUniversitySource(row.id)
        : eventSyncService.deleteSource(row.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['event-sync'] });
      void qc.invalidateQueries({ queryKey: ['public', 'universities'] });
    },
  });

  const syncMut = useMutation({
    mutationFn: async (row: EventFeedSourceRow) => {
      if (row.feedKind === 'legacy') {
        await eventSyncService.syncLegacyUniversitySource(row.id);
        return;
      }
      await eventSyncService.triggerSync(row.id);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['event-sync'] }),
  });

  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.super } as CSSProperties;

  return (
    <SuperAdminLayout>
      <header className="admin-page-header">
        <h1 className="admin-page-title">Fetch events</h1>
        <p className="admin-page-subtitle">
          Add calendar URLs, run sync, and manage feeds shown on{' '}
          <a href="/universities" target="_blank" rel="noreferrer">
            /universities
          </a>
          .
        </p>
      </header>

      <div className="admin-notice admin-notice--muted mb-4" style={panelStyle}>
        Empty selectors auto-detect Localist, UWM-style pages, and JSON-LD. Only events in the{' '}
        <strong>current calendar month</strong> are saved. For JS / “Load more” pages set{' '}
        <code>UNIVERSITY_PLAYWRIGHT=1</code> and run <code>npx playwright install chromium</code>.
        <strong> University feed</strong> rows can be removed here with Delete.
      </div>

      <section className="admin-panel mb-4" style={panelStyle}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">Worker status</h2>
        </div>
        <div className="admin-panel__body">
          {statusQuery.isLoading ? (
            <span className="admin-form-hint">Loading…</span>
          ) : statusQuery.data ? (
            <pre className="admin-code-block mb-0">{JSON.stringify(statusQuery.data, null, 2)}</pre>
          ) : null}
        </div>
      </section>

      <div className="row g-4">
        <div className="col-lg-5">
          <section className="admin-panel h-100" style={panelStyle}>
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Add event source</h2>
            </div>
            <div className="admin-panel__body">
              <div className="admin-form">
                <div className="mb-3">
                  <label className="admin-form-label" htmlFor="event-sync-name">
                    Name
                  </label>
                  <input
                    id="event-sync-name"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. City tourism calendar"
                  />
                </div>
                <div className="mb-3">
                  <label className="admin-form-label" htmlFor="event-sync-url">
                    Website URL
                  </label>
                  <input
                    id="event-sync-url"
                    className="form-control"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://events.example.edu/"
                  />
                  <small className="admin-form-hint">Use the calendar page, not the main homepage.</small>
                </div>
                <div className="mb-3">
                  <label className="admin-form-label" htmlFor="event-sync-selectors">
                    Selectors JSON (optional)
                  </label>
                  <textarea
                    id="event-sync-selectors"
                    className="form-control font-monospace small"
                    rows={6}
                    value={selectorJson}
                    onChange={(e) => setSelectorJson(e.target.value)}
                    placeholder={`{\n  "titleSelector": ".event-title",\n  "dateSelector": ".event-date"\n}`}
                  />
                </div>
                {createMut.isError ? (
                  <p className="admin-form-hint admin-form-hint--error">{(createMut.error as Error).message}</p>
                ) : null}
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={!name.trim() || !websiteUrl.trim() || createMut.isPending}
                  onClick={() => createMut.mutate()}
                >
                  {createMut.isPending ? 'Saving…' : 'Save source'}
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="col-lg-7">
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Sources</h2>
            </div>
            <div className="admin-panel__body admin-panel__body--flush-top">
              {sourcesQuery.isLoading || legacySourcesQuery.isLoading ? (
                <div className="admin-loading-state py-4">Loading…</div>
              ) : feedSources.length === 0 ? (
                <div className="admin-empty-state py-4">
                  <p className="mb-0">No sources yet.</p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th scope="col">Feed</th>
                        <th scope="col">Name</th>
                        <th scope="col">URL</th>
                        <th scope="col">Events</th>
                        <th scope="col">Active</th>
                        <th scope="col" className="text-end">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedSources.map((s) => (
                        <tr key={`${s.feedKind}-${s.id}`}>
                          <td>
                            <span
                              className={`admin-pill ${
                                s.feedKind === 'scraped' ? 'admin-pill--active' : 'admin-pill--neutral'
                              }`}
                            >
                              {s.feedKind === 'scraped' ? 'URL feed' : 'University feed'}
                            </span>
                          </td>
                          <td className="admin-table__strong">{s.name}</td>
                          <td>
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-table__link small"
                            >
                              {s.url.length > 48 ? `${s.url.slice(0, 48)}…` : s.url}
                            </a>
                          </td>
                          <td className="text-nowrap">
                            <span>{s.totalEvents}</span>
                            {s.feedKind === 'legacy' && s.legacyStatus ? (
                              <code className="d-block small text-muted">{s.legacyStatus}</code>
                            ) : s.scraperType ? (
                              <code className="d-block small text-muted">{s.scraperType}</code>
                            ) : null}
                          </td>
                          <td>{s.active ? 'Yes' : 'No'}</td>
                          <td>
                            <div className="admin-table-actions justify-content-end">
                              <button
                                type="button"
                                className="admin-btn-secondary admin-btn-sm"
                                disabled={syncMut.isPending}
                                onClick={() => syncMut.mutate(s)}
                              >
                                Sync
                              </button>
                              <button
                                type="button"
                                className="admin-btn-danger admin-btn-sm"
                                disabled={deleteMut.isPending}
                                onClick={() => {
                                  const label =
                                    s.feedKind === 'legacy'
                                      ? `Remove "${s.name}" from /universities and delete all its events?`
                                      : `Delete "${s.name}" and its sync logs/events?`;
                                  if (confirm(label)) {
                                    deleteMut.mutate(s);
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="admin-panel mt-4" style={panelStyle}>
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Recent sync logs</h2>
            </div>
            <div className="admin-panel__body">
              {logsQuery.isLoading ? (
                <div className="admin-loading-state py-3">Loading…</div>
              ) : !logsQuery.data?.length ? (
                <p className="admin-form-hint mb-0">No logs yet. Run Sync on a source.</p>
              ) : (
                <SyncLogsBySchoolAccordion logs={logsQuery.data} />
              )}
            </div>
          </section>
        </div>
      </div>
    </SuperAdminLayout>
  );
};
