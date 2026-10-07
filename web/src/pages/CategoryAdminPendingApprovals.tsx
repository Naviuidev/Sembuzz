import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  categoryAdminEventsService,
  type PendingEventForCategoryAdmin,
  type UpdateEventDto,
} from '../services/category-admin-events.service';
import { invalidateAdminActionItems } from '../services/admin-action-items.service';
import { eventStatusBadge, formatPublishAt, dateTimeLocalToIso, defaultFutureDateTimeLocal } from '../utils/eventPublishing';
import { EventPostReviewSummary, hasEventPostReviewContent } from '../components/EventPostReviewSummary';
import {
  EventPostDetailFields,
  actionButtonsForApi,
  eventDateToInputValue,
  eventTimeToInputValue,
  parseStoredActionButtons,
  validateActionButtons,
} from '../components/EventPostDetailFields';
import type { EventActionButton } from '../types/event-post';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function parseImageUrls(imageUrls: string | null): string[] {
  if (!imageUrls) return [];
  try {
    const parsed = JSON.parse(imageUrls);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

function imageSrc(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_BASE.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

const queryKey = ['category-admin', 'events', 'pending'] as const;

function pendingStatusPill(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending approval', className: 'admin-pill admin-pill--status-progress' },
    scheduled: { label: 'Scheduled', className: 'admin-pill admin-pill--status-progress' },
    schedule_missed: { label: 'Schedule missed', className: 'admin-pill admin-pill--status-pending' },
    reverted: { label: 'Changes requested', className: 'admin-pill admin-pill--neutral' },
  };
  const badge = eventStatusBadge(status);
  const s = map[status] ?? { label: badge.label, className: 'admin-pill admin-pill--neutral' };
  return <span className={s.className}>{s.label}</span>;
}

export function CategoryAdminPendingApprovalsPanel() {
  const queryClient = useQueryClient();
  const [viewEvent, setViewEvent] = useState<PendingEventForCategoryAdmin | null>(null);
  const [editEvent, setEditEvent] = useState<PendingEventForCategoryAdmin | null>(null);
  const [editForm, setEditForm] = useState<UpdateEventDto>({});
  const [editActionButtons, setEditActionButtons] = useState<EventActionButton[]>([]);
  const [editFieldError, setEditFieldError] = useState<string | null>(null);
  const [revertEvent, setRevertEvent] = useState<PendingEventForCategoryAdmin | null>(null);
  const [revertNotes, setRevertNotes] = useState('');
  const [approveEvent, setApproveEvent] = useState<PendingEventForCategoryAdmin | null>(null);
  const [approvePublishNow, setApprovePublishNow] = useState(true);
  const [approveRescheduleAt, setApproveRescheduleAt] = useState(defaultFutureDateTimeLocal);

  const { data: pendingEvents = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => categoryAdminEventsService.getPending(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ eventId, dto }: { eventId: string; dto: UpdateEventDto }) =>
      categoryAdminEventsService.update(eventId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      void invalidateAdminActionItems(queryClient, 'category-admin');
      setEditEvent(null);
      setEditForm({});
      setEditActionButtons([]);
      setEditFieldError(null);
    },
  });

  const revertMutation = useMutation({
    mutationFn: ({ eventId, notes }: { eventId: string; notes: string }) =>
      categoryAdminEventsService.revert(eventId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      void invalidateAdminActionItems(queryClient, 'category-admin');
      setRevertEvent(null);
      setRevertNotes('');
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({
      eventId,
      options,
    }: {
      eventId: string;
      options?: { publishNow?: boolean; publishAt?: string };
    }) => categoryAdminEventsService.approve(eventId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      void invalidateAdminActionItems(queryClient, 'category-admin');
      setApproveEvent(null);
    },
  });

  const handleEditOpen = (row: PendingEventForCategoryAdmin) => {
    setEditFieldError(null);
    setEditEvent(row);
    setEditForm({
      title: row.title,
      description: row.description ?? '',
      externalLink: row.externalLink ?? '',
      eventDate: eventDateToInputValue(row.eventDate ?? null),
      eventStartTime: eventTimeToInputValue(row.eventStartTime ?? null),
      eventEndTime: eventTimeToInputValue(row.eventEndTime ?? null),
      eventLocation: row.eventLocation?.trim() ?? '',
      commentsEnabled: row.commentsEnabled,
    });
    setEditActionButtons(parseStoredActionButtons(row.actionButtons));
  };

  const handleEditSubmit = () => {
    if (!editEvent) return;
    const actionBtnError = validateActionButtons(editActionButtons);
    if (actionBtnError) {
      setEditFieldError(actionBtnError);
      return;
    }
    setEditFieldError(null);
    updateMutation.mutate(
      {
        eventId: editEvent.id,
        dto: {
          ...editForm,
          eventDate: editForm.eventDate?.trim() || '',
          eventStartTime: editForm.eventStartTime?.trim() || '',
          eventEndTime: editForm.eventEndTime?.trim() || '',
          eventLocation: editForm.eventLocation?.trim() || '',
          actionButtons: actionButtonsForApi(editActionButtons),
        },
      },
      {
        onError: () => {},
      },
    );
  };

  const handleRevertSubmit = () => {
    if (!revertEvent || !revertNotes.trim()) return;
    revertMutation.mutate(
      { eventId: revertEvent.id, notes: revertNotes.trim() },
      {
        onError: () => {},
      },
    );
  };

  const handleApproveConfirm = () => {
    if (!approveEvent) return;
    const isMissed = approveEvent.status === 'schedule_missed';
    const options =
      isMissed && !approvePublishNow
        ? { publishNow: false, publishAt: dateTimeLocalToIso(approveRescheduleAt) }
        : isMissed
          ? { publishNow: true }
          : undefined;
    approveMutation.mutate({ eventId: approveEvent.id, options }, { onError: () => {} });
  };

  const openApproveModal = (row: PendingEventForCategoryAdmin) => {
    setApproveEvent(row);
    setApprovePublishNow(row.status !== 'schedule_missed');
    setApproveRescheduleAt(defaultFutureDateTimeLocal());
  };

  return (
    <>
      <div className="category-admin-pending-panel admin-approved-posts">
        {isLoading ? (
          <div className="admin-loading-state">
            <div className="spinner-border text-secondary" role="status" />
            <p className="mt-2 mb-0">Loading pending approvals…</p>
          </div>
        ) : error ? (
          <div className="admin-notice">
            <p className="admin-form-hint admin-form-hint--error mb-0">Failed to load pending approvals.</p>
          </div>
        ) : pendingEvents.length === 0 ? (
          <div className="admin-empty-state">
            <i className="bi bi-clock-history" style={{ fontSize: '2.5rem', opacity: 0.45 }} aria-hidden />
            <p className="mt-3 mb-0">No pending approvals right now.</p>
          </div>
        ) : (
          <>
            <div className="admin-approved-posts__toolbar">
              <span className="admin-approved-posts__count">
                {pendingEvents.length} pending {pendingEvents.length === 1 ? 'post' : 'posts'}
              </span>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table admin-approved-posts__table admin-pending-posts__table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Subcategory</th>
                    <th>Submitted by</th>
                    <th>Publish</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="admin-approved-posts__actions-col" aria-label="Actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingEvents.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className="admin-table__strong">{row.title}</span>
                      </td>
                      <td>{row.subCategory?.name ?? '—'}</td>
                      <td>
                        {row.subCategoryAdmin?.name ?? '—'}
                        {row.subCategoryAdmin?.email ? (
                          <span className="d-block admin-form-hint">{row.subCategoryAdmin.email}</span>
                        ) : null}
                      </td>
                      <td className="admin-table__details">{formatPublishAt(row.publishAt)}</td>
                      <td>{pendingStatusPill(row.status)}</td>
                      <td className="admin-table__details">{formatDate(row.createdAt)}</td>
                      <td>
                        <div className="admin-table-actions admin-approved-posts__row-actions admin-pending-posts__actions">
                          <button
                            type="button"
                            className="admin-icon-btn"
                            aria-label={`View ${row.title}`}
                            onClick={() => setViewEvent(row)}
                          >
                            <i className="bi bi-eye" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-btn--edit"
                            aria-label={`Edit ${row.title}`}
                            onClick={() => handleEditOpen(row)}
                          >
                            <i className="bi bi-pencil" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            aria-label={`Revert ${row.title} for changes`}
                            title="Revert for changes"
                            onClick={() => {
                              setRevertEvent(row);
                              setRevertNotes('');
                            }}
                          >
                            <i className="bi bi-arrow-return-left" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            aria-label={`Approve ${row.title}`}
                            title="Approve"
                            onClick={() => openApproveModal(row)}
                          >
                            <i className="bi bi-check-lg" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {viewEvent ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          onClick={() => setViewEvent(null)}
          role="presentation"
        >
          <div
            className="admin-modal admin-modal--lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pending-post-view-title"
          >
            <button
              type="button"
              className="admin-modal__close"
              aria-label="Close"
              onClick={() => setViewEvent(null)}
            >
              <i className="bi bi-x-lg" aria-hidden />
            </button>
            <div className="admin-modal__body admin-modal__body--with-close admin-modal__scroll">
              <h3 className="admin-modal__title" id="pending-post-view-title">{viewEvent.title}</h3>
              {viewEvent.description ? <p className="admin-modal__text">{viewEvent.description}</p> : null}
              <EventPostReviewSummary event={viewEvent} className="mb-3" />
              <div className="admin-detail-grid mb-3">
                <div>
                  <span className="admin-detail-label">Subcategory</span>
                  <p className="admin-detail-value mb-0">{viewEvent.subCategory?.name ?? '—'}</p>
                </div>
                <div>
                  <span className="admin-detail-label">Submitted by</span>
                  <p className="admin-detail-value mb-0">
                    {viewEvent.subCategoryAdmin?.name ?? '—'}
                    {viewEvent.subCategoryAdmin?.email ? ` · ${viewEvent.subCategoryAdmin.email}` : ''}
                  </p>
                </div>
                <div>
                  <span className="admin-detail-label">Requested publish</span>
                  <p className="admin-detail-value mb-0">{formatPublishAt(viewEvent.publishAt)}</p>
                </div>
                <div>
                  <span className="admin-detail-label">Submitted</span>
                  <p className="admin-detail-value mb-0">{formatDate(viewEvent.createdAt)}</p>
                </div>
              </div>
              {viewEvent.status === 'schedule_missed' ? (
                <p className="admin-form-hint admin-form-hint--error">Original scheduled time has passed.</p>
              ) : null}
              {parseImageUrls(viewEvent.imageUrls).length > 0 ? (
                <div className="admin-create-post-upload-thumbs">
                  {parseImageUrls(viewEvent.imageUrls).slice(0, 4).map((url, i) => (
                    <a key={i} href={imageSrc(url)} target="_blank" rel="noopener noreferrer">
                      <img src={imageSrc(url)} alt="" width={72} height={72} />
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="admin-modal__footer admin-modal__footer--between mt-3">
                <button type="button" className="admin-btn-secondary" onClick={() => setViewEvent(null)}>
                  Close
                </button>
                <div className="d-flex flex-wrap gap-2">
                  <button type="button" className="admin-btn-secondary" onClick={() => handleEditOpen(viewEvent)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => {
                      setRevertEvent(viewEvent);
                      setRevertNotes('');
                      setViewEvent(null);
                    }}
                  >
                    Revert
                  </button>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    onClick={() => {
                      openApproveModal(viewEvent);
                      setViewEvent(null);
                    }}
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit modal */}
      {editEvent && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setEditEvent(null)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: '0px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #dee2e6' }}>
                <h5 className="modal-title" style={{ color: '#1a1f2e' }}>Edit — {editEvent.title}</h5>
                <button type="button" className="btn-close" onClick={() => setEditEvent(null)} aria-label="Close" />
              </div>
              <div className="modal-body">
                {(editFieldError || updateMutation.isError) && (
                  <div className="alert alert-danger" style={{ borderRadius: '0px' }}>
                    {editFieldError ??
                      ((updateMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                        'Failed to update event.')}
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label" style={{ color: '#1a1f2e', fontWeight: '500' }}>Title</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ borderRadius: '0px' }}
                    value={editForm.title ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: '#1a1f2e', fontWeight: '500' }}>Description</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    style={{ borderRadius: '0px' }}
                    value={editForm.description ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: '#1a1f2e', fontWeight: '500' }}>External link</label>
                  <input
                    type="url"
                    className="form-control"
                    style={{ borderRadius: '0px' }}
                    value={editForm.externalLink ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, externalLink: e.target.value }))}
                  />
                </div>
                <div className="row g-3 mb-3">
                  <EventPostDetailFields
                    details={{
                      eventDate: editForm.eventDate ?? '',
                      eventStartTime: editForm.eventStartTime ?? '',
                      eventEndTime: editForm.eventEndTime ?? '',
                      eventLocation: editForm.eventLocation ?? '',
                    }}
                    onDetailsChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                    actionButtons={editActionButtons}
                    onActionButtonsChange={setEditActionButtons}
                  />
                </div>
                <div className="mb-0">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="edit-comments"
                      checked={editForm.commentsEnabled ?? false}
                      onChange={(e) => setEditForm((f) => ({ ...f, commentsEnabled: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="edit-comments" style={{ color: '#1a1f2e' }}>Comments enabled</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid #dee2e6' }}>
                <button type="button" className="btn btn-secondary" style={{ borderRadius: '0px' }} onClick={() => setEditEvent(null)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ borderRadius: '0px', backgroundColor: '#1a1f2e', borderColor: '#1a1f2e' }}
                  onClick={handleEditSubmit}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revert for changes modal */}
      {revertEvent && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setRevertEvent(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: '0px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #dee2e6' }}>
                <h5 className="modal-title" style={{ color: '#1a1f2e' }}>Revert for changes</h5>
                <button type="button" className="btn-close" onClick={() => setRevertEvent(null)} aria-label="Close" />
              </div>
              <div className="modal-body">
                <p className="mb-3">Send &quot;{revertEvent.title}&quot; back to the subcategory admin. Provide details on what improvements should be made so they can resubmit.</p>
                {revertMutation.isError && (
                  <div className="alert alert-danger mb-3" style={{ borderRadius: '0px' }}>
                    {(revertMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to revert event.'}
                  </div>
                )}
                <label className="form-label" style={{ color: '#1a1f2e', fontWeight: '500' }}>What improvements should be done? <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  rows={4}
                  style={{ borderRadius: '0px' }}
                  value={revertNotes}
                  onChange={(e) => setRevertNotes(e.target.value)}
                  placeholder="Describe the changes or improvements needed (e.g. fix title, add description, correct link...)"
                />
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid #dee2e6' }}>
                <button type="button" className="btn btn-secondary" style={{ borderRadius: '0px' }} onClick={() => setRevertEvent(null)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-warning"
                  style={{ borderRadius: '0px' }}
                  onClick={handleRevertSubmit}
                  disabled={!revertNotes.trim() || revertMutation.isPending}
                >
                  {revertMutation.isPending ? 'Reverting…' : 'Revert for changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve confirm */}
      {approveEvent && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setApproveEvent(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: '0px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #dee2e6' }}>
                <h5 className="modal-title" style={{ color: '#1a1f2e' }}>Approve</h5>
                <button type="button" className="btn-close" onClick={() => setApproveEvent(null)} aria-label="Close" />
              </div>
              <div className="modal-body">
                {approveMutation.isError && (
                  <div className="alert alert-danger mb-3" style={{ borderRadius: '0px' }}>
                    {(approveMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to approve event.'}
                  </div>
                )}
                <p className="fw-semibold mb-2" style={{ color: '#1a1f2e' }}>
                  {approveEvent.title}
                </p>
                {approveEvent.description ? (
                  <p className="small text-muted mb-2">{approveEvent.description}</p>
                ) : null}
                {hasEventPostReviewContent(approveEvent) ? (
                  <div className="mb-3 p-2" style={{ backgroundColor: '#f8f9fa' }}>
                    <EventPostReviewSummary event={approveEvent} />
                  </div>
                ) : null}
                {approveEvent.status === 'schedule_missed' ? (
                  <>
                    <p className="mb-2">
                      The original publish time for &quot;{approveEvent.title}&quot; has passed while this post was still pending approval.
                    </p>
                    <label className="d-flex align-items-center gap-2 mb-2">
                      <input
                        type="radio"
                        checked={approvePublishNow}
                        onChange={() => setApprovePublishNow(true)}
                      />
                      Publish immediately after approval
                    </label>
                    <label className="d-flex align-items-center gap-2 mb-2">
                      <input
                        type="radio"
                        checked={!approvePublishNow}
                        onChange={() => setApprovePublishNow(false)}
                      />
                      Reschedule to a new date &amp; time
                    </label>
                    {!approvePublishNow && (
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={approveRescheduleAt}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setApproveRescheduleAt(e.target.value)}
                      />
                    )}
                  </>
                ) : approveEvent.publishAt ? (
                  <p className="mb-0">
                    Approve &quot;{approveEvent.title}&quot;? It will enter the scheduled queue and publish automatically at{' '}
                    <strong>{formatPublishAt(approveEvent.publishAt)}</strong>.
                  </p>
                ) : (
                  <p className="mb-0">Approve &quot;{approveEvent.title}&quot;? This will publish the post immediately on the website.</p>
                )}
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid #dee2e6' }}>
                <button type="button" className="btn btn-secondary" style={{ borderRadius: '0px' }} onClick={() => setApproveEvent(null)} disabled={approveMutation.isPending}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-success"
                  style={{ borderRadius: '0px' }}
                  onClick={handleApproveConfirm}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? 'Approving…' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
