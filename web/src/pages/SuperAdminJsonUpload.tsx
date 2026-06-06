import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SuperAdminNavbar } from '../components/SuperAdminNavbar';
import { SuperAdminSidebar } from '../components/SuperAdminSidebar';
import {
  apiGroupEventToPreview,
  extractRawEventsFromText,
  formatJsonEventDateLine,
  formatJsonEventTimeLine,
  jsonEventCardImage,
  type JsonPreviewEvent,
} from '../utils/parseJsonEventsFile';
import { jsonUploadService, type JsonUploadGroupRow } from '../services/json-upload.service';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';
const EMPHASIS_SURFACE = '#F1F5F9';

const GROUPS_QUERY_KEY = ['json-upload', 'groups'] as const;

function getApiErrorMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const msg = e?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string') return msg;
  return e?.message ?? 'Request failed';
}

const JsonFileIcon = ({ size = 72 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="8" y="4" width="48" height="56" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
    <path
      d="M22 22h6v4h-6v-4zm14 0h6v4h-6v-4zM22 32h6v4h-6v-4zm14 0h6v4h-6v-4zM22 42h20v4H22v-4z"
      fill="#94a3b8"
    />
    <text
      x="32"
      y="54"
      textAnchor="middle"
      fontSize="11"
      fontWeight="700"
      fill="#1a1f2e"
      fontFamily="system-ui, sans-serif"
    >
      JSON
    </text>
  </svg>
);

function JsonEventLogo({ url, title }: { url: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  if (!url || failed) {
    return (
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 12,
          backgroundColor: EMPHASIS_SURFACE,
          color: TEXT_DARK,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          flexShrink: 0,
        }}
        aria-hidden
      >
        <i className="bi bi-calendar-event" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={title}
      onError={() => setFailed(true)}
      style={{
        width: 64,
        height: 64,
        objectFit: 'cover',
        borderRadius: 12,
        background: '#fff',
        flexShrink: 0,
      }}
    />
  );
}

function SmallLogo({ url, title }: { url: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  if (!url || failed) {
    return (
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          backgroundColor: EMPHASIS_SURFACE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <i className="bi bi-mortarboard" style={{ color: TEXT_MUTED }} />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={title}
      onError={() => setFailed(true)}
      style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 8, background: '#fff' }}
    />
  );
}

export function JsonEventCard({ event }: { event: JsonPreviewEvent }) {
  const link = event.detailUrl;
  const dateLine = formatJsonEventDateLine(event);
  const timeLine = formatJsonEventTimeLine(event);

  const openEventUrl = () => {
    if (link) window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: '1.1rem',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
        height: '100%',
      }}
    >
      <div className="d-flex align-items-start" style={{ gap: '0.75rem' }}>
        <JsonEventLogo url={jsonEventCardImage(event)} title={event.title} />
        <div style={{ minWidth: 0, flex: 1 }}>
          {event.university ? (
            <div
              className="text-truncate"
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: TEXT_MUTED,
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
              title={event.university}
            >
              {event.university}
            </div>
          ) : null}
          <div
            style={{
              fontWeight: 600,
              color: TEXT_DARK,
              fontSize: '1rem',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            title={event.title}
          >
            {event.title}
          </div>
          {dateLine ? (
            <div className="small text-muted mt-2 d-flex gap-1">
              <i className="bi bi-calendar3 flex-shrink-0" aria-hidden />
              <span>{dateLine}</span>
            </div>
          ) : null}
          {timeLine ? (
            <div className="small text-muted mt-1 d-flex gap-1">
              <i className="bi bi-clock flex-shrink-0" aria-hidden />
              <span>{timeLine}</span>
            </div>
          ) : null}
          {event.venue ? (
            <div className="small text-muted mt-1 text-truncate" title={event.venue}>
              <i className="bi bi-geo-alt me-1" aria-hidden />
              {event.venue}
            </div>
          ) : null}
        </div>
      </div>
      <div className="d-flex justify-content-end mt-auto">
        {link ? (
          <button
            type="button"
            onClick={openEventUrl}
            className="btn btn-sm d-inline-flex align-items-center gap-2 border-0"
            style={{
              background: TEXT_DARK,
              color: '#fff',
              borderRadius: 999,
              padding: '0.45rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Know more
            <i className="bi bi-arrow-right" aria-hidden />
          </button>
        ) : (
          <span className="small text-muted">No event URL</span>
        )}
      </div>
    </div>
  );
}

function ViewGroupModal({
  groupId,
  onClose,
  onPublished,
}: {
  groupId: string;
  onClose: () => void;
  onPublished: () => void;
}) {
  const detailQuery = useQuery({
    queryKey: ['json-upload', 'group', groupId],
    queryFn: () => jsonUploadService.getGroup(groupId),
  });

  const publishMut = useMutation({
    mutationFn: () => jsonUploadService.publishGroup(groupId),
    onSuccess: () => {
      onPublished();
      void detailQuery.refetch();
    },
  });

  const group = detailQuery.data;
  const isPublished = group?.status === 'published';
  const isLiveOnPublic = Boolean(group?.publicLive);
  const canPublish = !detailQuery.isLoading && (!isPublished || !isLiveOnPublic);

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 1050 }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white shadow-lg w-100 d-flex flex-column"
        style={{ maxWidth: 960, maxHeight: '90vh', borderRadius: 16, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="json-view-modal-title"
      >
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <div className="d-flex align-items-center gap-3 min-w-0">
            {group ? <SmallLogo url={group.logoUrl} title={group.universityName} /> : null}
            <div className="min-w-0">
              <h2 id="json-view-modal-title" className="h5 mb-0 text-truncate">
                {group?.universityName ?? 'Loading…'}
              </h2>
              <div className="small text-muted">
                {group ? `${group.eventCount} event${group.eventCount === 1 ? '' : 's'}` : ''}
                {isPublished ? (
                  isLiveOnPublic ? (
                    <span className="badge bg-success-subtle text-success ms-2">Published</span>
                  ) : (
                    <span className="badge bg-warning-subtle text-warning ms-2">Published (not live)</span>
                  )
                ) : (
                  <span className="badge bg-secondary-subtle text-secondary ms-2">Draft</span>
                )}
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-link text-dark" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="p-3 overflow-auto flex-grow-1" style={{ background: '#fafafa' }}>
          {detailQuery.isLoading ? (
            <div className="text-center py-5 text-muted">Loading events…</div>
          ) : detailQuery.isError ? (
            <div className="alert alert-danger">Could not load events.</div>
          ) : (
            <div className="row g-3">
              {(group?.events ?? []).map((ev) => (
                <div key={ev.id} className="col-12 col-md-6">
                  <JsonEventCard event={apiGroupEventToPreview(ev)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-top d-flex justify-content-between align-items-center gap-2 flex-wrap">
          <span className="small text-muted">
            {isPublished && !isLiveOnPublic
              ? 'Public listing missing — click Re-publish to restore /universities.'
              : 'Publish to show this university on /universities.'}
          </span>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-dark d-inline-flex align-items-center gap-2"
              disabled={publishMut.isPending || !canPublish}
              onClick={() => publishMut.mutate()}
            >
              <i className="bi bi-send" aria-hidden />
              {publishMut.isPending
                ? 'Publishing…'
                : isPublished && isLiveOnPublic
                  ? 'Published'
                  : isPublished
                    ? 'Re-publish'
                    : 'Publish'}
            </button>
          </div>
        </div>
        {publishMut.isError ? (
          <div className="px-3 pb-3">
            <div className="alert alert-danger small mb-0 py-2">
              {(publishMut.error as Error).message || 'Publish failed'}
            </div>
          </div>
        ) : null}
        {publishMut.isSuccess && !publishMut.data?.alreadyPublished ? (
          <div className="px-3 pb-3">
            <div className="alert alert-success small mb-0 py-2">
              Published — visible on{' '}
              <a href="/universities" target="_blank" rel="noreferrer">
                /universities
              </a>
              .
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GroupsTable({
  rows,
  onView,
  onDelete,
  deletingId,
}: {
  rows: JsonUploadGroupRow[];
  onView: (id: string) => void;
  onDelete: (row: JsonUploadGroupRow) => void;
  deletingId: string | null;
}) {
  if (!rows.length) {
    return (
      <div className="text-center text-muted py-4 small">
        No uploads yet. Upload a JSON file above to create draft university groups.
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead>
          <tr className="small text-muted">
            <th style={{ width: 56 }} />
            <th>University</th>
            <th>Events</th>
            <th>Status</th>
            <th>File</th>
            <th>Uploaded</th>
            <th style={{ width: 100 }} className="text-end">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <SmallLogo url={row.logoUrl} title={row.universityName} />
              </td>
              <td>
                <div className="fw-semibold" style={{ color: TEXT_DARK }}>
                  {row.universityName}
                </div>
                <div className="small text-muted text-truncate" style={{ maxWidth: 280 }} title={row.calendarUrl}>
                  {row.calendarUrl}
                </div>
              </td>
              <td>{row.eventCount}</td>
              <td>
                {row.status === 'published' ? (
                  row.publicLive ? (
                    <span className="badge text-bg-success">Published</span>
                  ) : (
                    <span className="badge text-bg-warning">Not on /universities</span>
                  )
                ) : (
                  <span className="badge text-bg-secondary">Draft</span>
                )}
              </td>
              <td className="small text-muted text-truncate" style={{ maxWidth: 140 }} title={row.fileName}>
                {row.fileName ?? '—'}
              </td>
              <td className="small text-muted">
                {row.uploadedAt || row.createdAt
                  ? new Date(row.uploadedAt ?? row.createdAt).toLocaleString()
                  : '—'}
              </td>
              <td className="text-end">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark me-1"
                  title="View events"
                  onClick={() => onView(row.id)}
                >
                  <i className="bi bi-eye" aria-hidden />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  title="Delete"
                  disabled={deletingId === row.id}
                  onClick={() => onDelete(row)}
                >
                  <i className="bi bi-trash" aria-hidden />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const SuperAdminJsonUpload = () => {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [viewGroupId, setViewGroupId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const groupsQuery = useQuery({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: () => jsonUploadService.listGroups(),
  });

  const uploadMut = useMutation({
    mutationFn: ({ fileName, events }: { fileName: string; events: Record<string, unknown>[] }) =>
      jsonUploadService.create(fileName, events),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
      setUploadSuccess(
        `Saved ${data.eventCount} event(s) in ${data.groupCount} universit${data.groupCount === 1 ? 'y' : 'ies'}.`,
      );
      setParseError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => jsonUploadService.deleteGroup(id),
    onMutate: async (id) => {
      setDeleteError(null);
      if (viewGroupId === id) setViewGroupId(null);
      await qc.cancelQueries({ queryKey: GROUPS_QUERY_KEY });
      const previous = qc.getQueryData<JsonUploadGroupRow[]>(GROUPS_QUERY_KEY);
      qc.setQueryData<JsonUploadGroupRow[]>(GROUPS_QUERY_KEY, (old) =>
        old ? old.filter((row) => row.id !== id) : old,
      );
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        qc.setQueryData(GROUPS_QUERY_KEY, context.previous);
      }
      setDeleteError(getApiErrorMessage(err));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setParseError(null);
    setUploadSuccess(null);
    if (!file) return;

    try {
      const text = await file.text();
      const { events, error } = extractRawEventsFromText(text);
      if (error || !events.length) {
        setParseError(error ?? 'No events found.');
        return;
      }
      uploadMut.mutate({ fileName: file.name, events });
    } catch {
      setParseError('Could not read the file.');
    }
  };

  const handleDelete = (row: JsonUploadGroupRow) => {
    const msg =
      row.status === 'published'
        ? `Delete "${row.universityName}"? This removes the upload row and unpublishes it from /universities.`
        : `Delete draft for "${row.universityName}"?`;
    if (window.confirm(msg)) {
      deleteMut.mutate(row.id);
    }
  };

  const loading = uploadMut.isPending;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SuperAdminNavbar />
      <div className="d-flex">
        <SuperAdminSidebar />
        <div style={{ flex: 1, padding: '2rem', minHeight: 'calc(100vh - 60px)', maxWidth: 1200 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: TEXT_DARK }}>JSON upload</h1>
          <p style={{ color: TEXT_MUTED, maxWidth: 720 }}>
            Upload JSON with an <code>events</code> array. Data is grouped by university and saved as
            drafts. Use <strong>View</strong> to preview cards, then <strong>Publish</strong> to show on{' '}
            <a href="/universities" target="_blank" rel="noreferrer">
              /universities
            </a>
            .
          </p>

          <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: 12 }}>
            <div className="card-body p-5 text-center">
              <div className="d-flex justify-content-center mb-4">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: 120,
                    height: 120,
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <JsonFileIcon size={72} />
                </div>
              </div>
              <h2 className="h5 mb-2">Upload JSON file</h2>
              <p className="text-muted small mb-4" style={{ maxWidth: 520, margin: '0 auto 1.5rem' }}>
                Uses <code>event_name</code>, <code>school_logo_url</code>, <code>event_start_date</code>,{' '}
                <code>event_end_date</code>, <code>event_location</code>, <code>event_url</code>,{' '}
                <code>university</code>, <code>calendar_url</code>.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="d-none"
                onChange={(e) => void handleFileChange(e)}
              />
              <button
                type="button"
                className="btn btn-dark px-4"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <i className="bi bi-upload me-2" aria-hidden />
                {loading ? 'Saving…' : 'Upload file'}
              </button>
              {parseError ? (
                <div className="alert alert-danger small mt-4 mb-0 mx-auto text-start" style={{ maxWidth: 480 }}>
                  {parseError}
                </div>
              ) : null}
              {uploadMut.isError ? (
                <div className="alert alert-danger small mt-4 mb-0 mx-auto text-start" style={{ maxWidth: 480 }}>
                  {(uploadMut.error as Error).message || 'Upload failed'}
                </div>
              ) : null}
              {uploadSuccess ? (
                <div className="alert alert-success small mt-4 mb-0 mx-auto text-start" style={{ maxWidth: 480 }}>
                  {uploadSuccess}
                </div>
              ) : null}
            </div>
          </div>

          <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: 12 }}>
            <div className="card-body p-0">
              <div className="p-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h2 className="h6 mb-0">Uploaded universities</h2>
                {deleteMut.isPending ? (
                  <span className="small text-muted">Deleting…</span>
                ) : null}
              </div>
              {deleteError ? (
                <div className="px-3 pt-3">
                  <div className="alert alert-danger small py-2 mb-0 d-flex justify-content-between align-items-center gap-2">
                    <span>{deleteError}</span>
                    <button
                      type="button"
                      className="btn-close btn-close-sm"
                      aria-label="Dismiss"
                      onClick={() => setDeleteError(null)}
                    />
                  </div>
                </div>
              ) : null}
              {groupsQuery.isLoading ? (
                <div className="p-4 text-center text-muted">Loading…</div>
              ) : groupsQuery.isError ? (
                <div className="p-4 text-danger small">Could not load uploads.</div>
              ) : (
                <GroupsTable
                  rows={groupsQuery.data ?? []}
                  onView={setViewGroupId}
                  onDelete={handleDelete}
                  deletingId={deleteMut.isPending ? (deleteMut.variables ?? null) : null}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {viewGroupId ? (
        <ViewGroupModal
          groupId={viewGroupId}
          onClose={() => setViewGroupId(null)}
          onPublished={() => void qc.invalidateQueries({ queryKey: GROUPS_QUERY_KEY })}
        />
      ) : null}
    </div>
  );
};
