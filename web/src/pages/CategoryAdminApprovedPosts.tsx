import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusPopup } from '../components/StatusPopup';
import { CreatePostLivePreview } from '../components/CreatePostLivePreview';
import {
  actionButtonsForApi,
  eventDateToInputValue,
  eventTimeToInputValue,
  parseStoredActionButtons,
} from '../components/EventPostDetailFields';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { useCategoryAdminAuth } from '../contexts/CategoryAdminAuthContext';
import {
  categoryAdminEventsService,
  type ApprovedEventForCategoryAdmin,
} from '../services/category-admin-events.service';
import { imageSrc } from '../utils/image';

function parseImageUrls(imageUrls: string | null): string[] {
  if (!imageUrls) return [];
  try {
    const parsed = JSON.parse(imageUrls);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

function statusPill(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    scheduled: { label: 'Scheduled', className: 'admin-pill admin-pill--status-progress' },
    published: { label: 'Published', className: 'admin-pill admin-pill--status-done' },
    approved: { label: 'Published', className: 'admin-pill admin-pill--status-done' },
  };
  const s = map[status] ?? { label: status, className: 'admin-pill admin-pill--neutral' };
  return <span className={s.className}>{s.label}</span>;
}

const queryKey = ['category-admin', 'events', 'approved'] as const;

export function CategoryAdminApprovedPostsPanel() {
  const { user } = useCategoryAdminAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPost, setPreviewPost] = useState<ApprovedEventForCategoryAdmin | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'web'>('mobile');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [popupShow, setPopupShow] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState('');

  const { data: approvedEvents = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => categoryAdminEventsService.getApproved(),
  });

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return approvedEvents;
    const query = searchQuery.toLowerCase();
    return approvedEvents.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        (e.subCategory?.name ?? '').toLowerCase().includes(query) ||
        (e.subCategoryAdmin?.name ?? '').toLowerCase().includes(query),
    );
  }, [approvedEvents, searchQuery]);

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => categoryAdminEventsService.deleteApproved(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setDeleteId(null);
      setPreviewPost(null);
      setPopupType('success');
      setPopupMessage('Post deleted successfully.');
      setPopupShow(true);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setDeleteId(null);
      setPopupType('error');
      setPopupMessage(err?.response?.data?.message ?? 'Failed to delete post');
      setPopupShow(true);
    },
  });

  const deleteTarget = deleteId ? approvedEvents.find((e) => e.id === deleteId) : null;

  return (
    <>
      {error ? (
        <div className="admin-notice mb-3">
          <p className="admin-form-hint admin-form-hint--error mb-0">Failed to load approved posts.</p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="admin-loading-state">
          <div className="spinner-border text-secondary" role="status" />
          <p className="mt-2 mb-0">Loading approved posts…</p>
        </div>
      ) : approvedEvents.length === 0 ? (
        <div className="admin-empty-state">
          <i className="bi bi-check2-circle" style={{ fontSize: '2.5rem', opacity: 0.45 }} aria-hidden />
          <p className="mt-3 mb-0">No approved posts yet.</p>
          <p className="small mb-0">Posts appear here after you approve subcategory admin submissions.</p>
        </div>
      ) : (
        <div className="admin-approved-posts">
          <div className="admin-approved-posts__toolbar">
            <span className="admin-approved-posts__count">
              {filteredEvents.length} of {approvedEvents.length} approved{' '}
              {approvedEvents.length === 1 ? 'post' : 'posts'}
            </span>
            <div className="admin-approved-posts__search">
              <i className="bi bi-search" aria-hidden />
              <input
                type="search"
                className="form-control admin-form-control"
                placeholder="Search by title, subcategory, or author…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search approved posts"
              />
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <p className="admin-form-hint text-center py-4 mb-0">No posts match your search.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table admin-approved-posts__table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Subcategory</th>
                    <th>Posted by</th>
                    <th className="admin-approved-posts__actions-col" aria-label="Actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((post) => {
                    const author =
                      post.subCategoryAdmin?.name ?? post.subCategoryAdmin?.email ?? '—';
                    return (
                      <tr key={post.id}>
                        <td>
                          <span className="admin-table__strong">{post.title}</span>
                          <span className="d-block mt-1">{statusPill(post.status)}</span>
                        </td>
                        <td>{post.subCategory?.name ?? '—'}</td>
                        <td>{author}</td>
                        <td>
                          <div className="admin-table-actions admin-approved-posts__row-actions">
                            <button
                              type="button"
                              className="admin-icon-btn"
                              aria-label={`Preview ${post.title}`}
                              onClick={() => setPreviewPost(post)}
                            >
                              <i className="bi bi-eye" aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--danger"
                              aria-label={`Delete ${post.title}`}
                              onClick={() => setDeleteId(post.id)}
                            >
                              <i className="bi bi-trash" aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {previewPost ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          onClick={() => setPreviewPost(null)}
          role="presentation"
        >
          <div
            className="admin-modal admin-modal--preview-post"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cat-approved-post-preview-title"
          >
            <button
              type="button"
              className="admin-modal__close"
              aria-label="Close preview"
              onClick={() => setPreviewPost(null)}
            >
              <i className="bi bi-x-lg" aria-hidden />
            </button>
            <div className="admin-modal__body admin-modal__body--with-close">
              <h3 className="admin-modal__title" id="cat-approved-post-preview-title">Post preview</h3>
              <p className="admin-form-hint mb-3">{previewPost.title}</p>
              <div className="admin-create-post-preview-toggle mb-3" role="tablist" aria-label="Preview device">
                {(['mobile', 'tablet', 'web'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={previewMode === mode}
                    className={previewMode === mode ? 'is-active' : ''}
                    onClick={() => setPreviewMode(mode)}
                  >
                    {mode === 'mobile' ? 'Mobile' : mode === 'tablet' ? 'Tablet' : 'Web'}
                  </button>
                ))}
              </div>
              <div className="admin-approved-posts__preview-frame">
                <CreatePostLivePreview
                  title={previewPost.title}
                  description={previewPost.description ?? ''}
                  categoryName=""
                  subCategoryName={previewPost.subCategory?.name ?? ''}
                  schoolName={user?.schoolName || user?.schoolDomain || 'School'}
                  eventDate={eventDateToInputValue(previewPost.eventDate ?? null)}
                  eventStartTime={eventTimeToInputValue(previewPost.eventStartTime ?? null)}
                  eventEndTime={eventTimeToInputValue(previewPost.eventEndTime ?? null)}
                  eventLocation={previewPost.eventLocation?.trim() ?? ''}
                  actionButtons={actionButtonsForApi(parseStoredActionButtons(previewPost.actionButtons))}
                  coverSrc={
                    parseImageUrls(previewPost.imageUrls)[0]
                      ? imageSrc(parseImageUrls(previewPost.imageUrls)[0])
                      : ''
                  }
                  previewMode={previewMode}
                  accentColor={ADMIN_PORTAL_ACCENTS.category}
                  commentsEnabled={previewPost.commentsEnabled}
                />
              </div>
              <div className="admin-modal__footer mt-3">
                <button type="button" className="admin-btn-secondary" onClick={() => setPreviewPost(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteId && deleteTarget ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          onClick={() => !deleteMutation.isPending && setDeleteId(null)}
          role="presentation"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal__body">
              <h3 className="admin-modal__title">Delete this post?</h3>
              <p className="admin-modal__text">
                Delete <strong>{deleteTarget.title}</strong>? This cannot be undone and removes the post from the
                public feed.
              </p>
              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => !deleteMutation.isPending && setDeleteId(null)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  onClick={() => deleteMutation.mutate(deleteId)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <StatusPopup
        show={popupShow}
        type={popupType}
        message={popupMessage}
        onClose={() => setPopupShow(false)}
      />
    </>
  );
}
