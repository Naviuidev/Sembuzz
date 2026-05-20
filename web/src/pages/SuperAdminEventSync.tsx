import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SuperAdminNavbar } from '../components/SuperAdminNavbar';
import { SuperAdminSidebar } from '../components/SuperAdminSidebar';
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
    <div
      className="mt-2 p-3 rounded small"
      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
    >
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
      <pre
        className="small mb-0 p-2 rounded border"
        style={{
          background: '#1e293b',
          color: '#e2e8f0',
          maxHeight: 320,
          overflow: 'auto',
        }}
      >
        {JSON.stringify(details, null, 2)}
      </pre>
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SuperAdminNavbar />
      <div className="d-flex">
        <SuperAdminSidebar />
        <div style={{ flex: 1, padding: '2rem', minHeight: 'calc(100vh - 60px)', maxWidth: 1100 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#1a1f2e' }}>
            Fetch events from URLs
          </h1>
          <p style={{ color: '#6c757d', maxWidth: 720 }}>
            Add any events/calendar URL and run Sync. Empty selectors auto-detect Localist, UWM-style
            pages, and JSON-LD. Only events in the <strong>current calendar month</strong> (same as{' '}
            <a href="/universities" target="_blank" rel="noreferrer">
              /universities
            </a>
            ) are saved. For &quot;Load more&quot; / JS pages set <code>UNIVERSITY_PLAYWRIGHT=1</code> and{' '}
            <code>npx playwright install chromium</code>.
            {' '}
            Entries labeled <strong>University feed</strong> on{' '}
            <a href="/universities" target="_blank" rel="noreferrer">
              /universities
            </a>{' '}
            are listed below too — use <strong>Delete</strong> here to remove them from the public page.
          </p>

          <div
            className="card border-0 shadow-sm mt-4 mb-4"
            style={{ borderRadius: 12 }}
          >
            <div className="card-body p-4">
              <h2 className="h6 mb-3">Worker status</h2>
              {statusQuery.isLoading ? (
                <span className="text-muted">Loading…</span>
              ) : statusQuery.data ? (
                <pre
                  className="small mb-0 p-3 rounded"
                  style={{ background: '#f1f5f9', whiteSpace: 'pre-wrap' }}
                >
                  {JSON.stringify(statusQuery.data, null, 2)}
                </pre>
              ) : null}
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-5">
              <div
                className="card border-0 shadow-sm h-100"
                style={{ borderRadius: 12 }}
              >
                <div className="card-body p-4">
                  <h2 className="h6 mb-3">Add event source</h2>
                  <div className="mb-3">
                    <label className="form-label small text-muted">Name</label>
                    <input
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. City tourism calendar"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted">Website URL</label>
                    <input
                      className="form-control"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://events.example.edu/ (calendar page, not main homepage)"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted">
                      Selectors JSON (optional)
                    </label>
                    <textarea
                      className="form-control font-monospace small"
                      rows={6}
                      value={selectorJson}
                      onChange={(e) => setSelectorJson(e.target.value)}
                      placeholder={`{\n  "titleSelector": ".event-title",\n  "dateSelector": ".event-date"\n}`}
                    />
                  </div>
                  {createMut.isError && (
                    <div className="alert alert-danger small py-2">
                      {(createMut.error as Error).message}
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-dark"
                    disabled={!name.trim() || !websiteUrl.trim() || createMut.isPending}
                    onClick={() => createMut.mutate()}
                  >
                    {createMut.isPending ? 'Saving…' : 'Save source'}
                  </button>
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div
                className="card border-0 shadow-sm"
                style={{ borderRadius: 12 }}
              >
                <div className="card-body p-4">
                  <h2 className="h6 mb-3">Sources (public /universities)</h2>
                  {sourcesQuery.isLoading || legacySourcesQuery.isLoading ? (
                    <p className="text-muted small mb-0">Loading…</p>
                  ) : feedSources.length === 0 ? (
                    <p className="text-muted small mb-0">No sources yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm align-middle">
                        <thead>
                          <tr>
                            <th>Feed</th>
                            <th>Name</th>
                            <th>URL</th>
                            <th>Events</th>
                            <th>Active</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {feedSources.map((s) => (
                            <tr key={`${s.feedKind}-${s.id}`}>
                              <td>
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    background: s.feedKind === 'scraped' ? '#ECFDF5' : '#F1F5F9',
                                    color: s.feedKind === 'scraped' ? '#047857' : '#475569',
                                  }}
                                >
                                  {s.feedKind === 'scraped' ? 'URL feed' : 'University feed'}
                                </span>
                              </td>
                              <td>{s.name}</td>
                              <td>
                                <a href={s.url} target="_blank" rel="noreferrer" className="small">
                                  {s.url.slice(0, 40)}
                                  {s.url.length > 40 ? '…' : ''}
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
                              <td className="text-end text-nowrap">
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm me-1"
                                  disabled={syncMut.isPending}
                                  onClick={() => syncMut.mutate(s)}
                                >
                                  Sync
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
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
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div
                className="card border-0 shadow-sm mt-4"
                style={{ borderRadius: 12 }}
              >
                <div className="card-body p-4">
                  <h2 className="h6 mb-3">Recent sync logs</h2>
                  {logsQuery.isLoading ? (
                    <p className="text-muted small mb-0">Loading…</p>
                  ) : !logsQuery.data?.length ? (
                    <p className="text-muted small mb-0">No logs yet. Run Sync on a source.</p>
                  ) : (
                    <SyncLogsBySchoolAccordion logs={logsQuery.data} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
