import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryAdminNavbar } from '../components/CategoryAdminNavbar';
import { CategoryAdminSidebar } from '../components/CategoryAdminSidebar';
import {
  categoryAdminEventsService,
  type PendingEventForCategoryAdmin,
  type UpdateEventDto,
} from '../services/category-admin-events.service';

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

const btnStyle = {
  borderRadius: '0px',
  padding: '0.35rem 0.6rem',
  fontSize: '0.8rem',
  marginRight: '0.35rem',
  marginBottom: '0.25rem',
} as const;

const queryKey = ['category-admin', 'events', 'pending'] as const;

export const CategoryAdminPendingApprovals = () => {
  const queryClient = useQueryClient();
  const [expandedViewId, setExpandedViewId] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState<PendingEventForCategoryAdmin | null>(null);
  const [editForm, setEditForm] = useState<UpdateEventDto>({});
  const [revertEvent, setRevertEvent] = useState<PendingEventForCategoryAdmin | null>(null);
  const [revertNotes, setRevertNotes] = useState('');
  const [approveEvent, setApproveEvent] = useState<PendingEventForCategoryAdmin | null>(null);

  const { data: pendingEvents = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => categoryAdminEventsService.getPending(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ eventId, dto }: { eventId: string; dto: UpdateEventDto }) =>
      categoryAdminEventsService.update(eventId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditEvent(null);
      setEditForm({});
    },
  });

  const revertMutation = useMutation({
    mutationFn: ({ eventId, notes }: { eventId: string; notes: string }) =>
      categoryAdminEventsService.revert(eventId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setRevertEvent(null);
      setRevertNotes('');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (eventId: string) => categoryAdminEventsService.approve(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setApproveEvent(null);
    },
  });

  const handleEditOpen = (row: PendingEventForCategoryAdmin) => {
    setEditEvent(row);
    setEditForm({
      title: row.title,
      description: row.description ?? '',
      externalLink: row.externalLink ?? '',
      commentsEnabled: row.commentsEnabled,
    });
  };

  const handleEditSubmit = () => {
    if (!editEvent) return;
    updateMutation.mutate(
      { eventId: editEvent.id, dto: editForm },
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
    approveMutation.mutate(approveEvent.id, { onError: () => {} });
  };

  const renderDetailRow = (row: PendingEventForCategoryAdmin) => {
    const images = parseImageUrls(row.imageUrls);
    return (
      <tr key={`${row.id}-detail`} style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
        <td colSpan={5} style={{ padding: '1rem 1rem 1.5rem', verticalAlign: 'top' }}>
          <div style={{ maxWidth: '100%' }}>
            <h6 style={{ color: '#1a1f2e', marginBottom: '0.75rem', fontWeight: '600' }}>Event details</h6>
            {row.description && (
              <p style={{ marginBottom: '0.75rem', color: '#1a1f2e' }}>{row.description}</p>
            )}
            {row.externalLink && (
              <p className="mb-1">
                <strong>Link:</strong>{' '}
                <a href={row.externalLink} target="_blank" rel="noopener noreferrer">{row.externalLink}</a>
              </p>
            )}
            <p className="mb-1"><strong>Subcategory:</strong> {row.subCategory?.name ?? '—'}</p>
            <p className="mb-1"><strong>Submitted by:</strong> {row.subCategoryAdmin?.name ?? '—'} ({row.subCategoryAdmin?.email ?? '—'})</p>
            <p className="mb-1"><strong>Date:</strong> {formatDate(row.createdAt)}</p>
            <p className="mb-2"><strong>Comments:</strong> {row.commentsEnabled ? 'Enabled' : 'Disabled'}</p>
            {images.length > 0 && (
              <div className="mb-0">
                <strong>Images:</strong>
                <div className="d-flex flex-wrap gap-2 mt-1">
                  {images.slice(0, 4).map((url, i) => {
                    const src = imageSrc(url);
                    return (
                      <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                        <img src={src} alt="" style={{ maxHeight: '80px', maxWidth: '120px', objectFit: 'cover', border: '1px solid #dee2e6' }} />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mt-2"
              style={{ borderRadius: '0px' }}
              onClick={() => setExpandedViewId(null)}
            >
              Close details
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <CategoryAdminNavbar />
      <div className="d-flex">
        <CategoryAdminSidebar />
        <div style={{ flex: 1, padding: '2rem', minHeight: 'calc(100vh - 60px)' }}>
          <div className="mb-4">
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'normal',
              color: '#1a1f2e',
              marginBottom: '0.5rem'
            }}>
              Pending approvals
            </h1>
            <p style={{
              color: '#6c757d',
              fontSize: '1rem',
              marginBottom: 0
            }}>
              Events submitted by subcategory admins awaiting your approval
            </p>
          </div>

          <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              {isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-secondary" role="status" />
                  <p className="mt-2 mb-0" style={{ color: '#6c757d' }}>Loading…</p>
                </div>
              ) : error ? (
                <div className="text-center py-5">
                  <i className="bi bi-exclamation-circle" style={{ fontSize: '3rem', color: '#dc3545', marginBottom: '1rem' }} />
                  <p style={{ color: '#6c757d', margin: 0 }}>Failed to load pending approvals</p>
                </div>
              ) : pendingEvents.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-clock-history" style={{ fontSize: '3rem', color: '#6c757d', marginBottom: '1rem' }} />
                  <p style={{ color: '#6c757d', margin: 0 }}>No pending approvals at the moment</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover" style={{ marginBottom: 0 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                        <th style={{ color: '#1a1f2e', fontWeight: '600', padding: '1rem', backgroundColor: '#f8f9fa' }}>Title</th>
                        <th style={{ color: '#1a1f2e', fontWeight: '600', padding: '1rem', backgroundColor: '#f8f9fa' }}>Subcategory</th>
                        <th style={{ color: '#1a1f2e', fontWeight: '600', padding: '1rem', backgroundColor: '#f8f9fa' }}>Submitted by</th>
                        <th style={{ color: '#1a1f2e', fontWeight: '600', padding: '1rem', backgroundColor: '#f8f9fa' }}>Date</th>
                        <th style={{ color: '#1a1f2e', fontWeight: '600', padding: '1rem', backgroundColor: '#f8f9fa' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingEvents.map((row) => (
                        <React.Fragment key={row.id}>
                          <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                            <td style={{ padding: '1rem', verticalAlign: 'middle', color: '#1a1f2e' }}>{row.title}</td>
                            <td style={{ padding: '1rem', verticalAlign: 'middle' }}>{row.subCategory?.name ?? '—'}</td>
                            <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                              {row.subCategoryAdmin?.name ?? '—'}
                              {row.subCategoryAdmin?.email && (
                                <span className="d-block small text-muted">{row.subCategoryAdmin.email}</span>
                              )}
                            </td>
                            <td style={{ padding: '1rem', verticalAlign: 'middle', color: '#6c757d' }}>{formatDate(row.createdAt)}</td>
                            <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                style={btnStyle}
                                onClick={() => setExpandedViewId((id) => (id === row.id ? null : row.id))}
                              >
                                {expandedViewId === row.id ? 'Hide' : 'View'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                style={btnStyle}
                                onClick={() => handleEditOpen(row)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-warning btn-sm"
                                style={btnStyle}
                                onClick={() => { setRevertEvent(row); setRevertNotes(''); }}
                              >
                                Revert for changes
                              </button>
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                style={btnStyle}
                                onClick={() => setApproveEvent(row)}
                              >
                                Approve
                              </button>
                            </td>
                          </tr>
                          {expandedViewId === row.id && renderDetailRow(row)}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
                {updateMutation.isError && (
                  <div className="alert alert-danger" style={{ borderRadius: '0px' }}>
                    {(updateMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update event.'}
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
                <p className="mb-0">Approve &quot;{approveEvent.title}&quot;? This will publish the post on the website for your school.</p>
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
    </div>
  );
};
