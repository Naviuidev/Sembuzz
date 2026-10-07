import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subcategoryAdminEventsService, type ApprovedEvent } from '../services/subcategory-admin-events.service';
import { CreatePostLivePreview } from './CreatePostLivePreview';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';
import {
  actionButtonsForApi,
  eventDateToInputValue,
  eventTimeToInputValue,
  parseStoredActionButtons,
} from './EventPostDetailFields';
import { imageSrc } from '../utils/image';

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

function parseImageUrls(imageUrls: string | null): string[] {
  if (!imageUrls) return [];
  try {
    const parsed = JSON.parse(imageUrls);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

export function SubCategoryAdminApprovedPanel() {
  const { user } = useSubCategoryAdminAuth();
  const [previewPost, setPreviewPost] = useState<ApprovedEvent | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'web'>('mobile');

  const { data: approvedEvents = [], isLoading, error } = useQuery({
    queryKey: ['subcategory-admin', 'events', 'approved'],
    queryFn: () => subcategoryAdminEventsService.getApproved(),
  });

  const openPreview = (event: ApprovedEvent) => {
    setPreviewPost(event);
    setPreviewMode('mobile');
  };

  if (isLoading) {
    return <div className="admin-loading-state">Loading approved posts…</div>;
  }
  if (error) {
    return <div className="admin-empty-state"><p>Failed to load approved posts.</p></div>;
  }
  if (approvedEvents.length === 0) {
    return (
      <div className="admin-empty-state">
        <i className="bi bi-check-circle admin-category-dashboard__empty-icon" aria-hidden />
        <p className="admin-form-hint mb-0">No approved posts yet.</p>
      </div>
    );
  }

  const previewImages = previewPost ? parseImageUrls(previewPost.imageUrls) : [];

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Post title</th>
              <th scope="col">Subcategory</th>
              <th scope="col">Approved on</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvedEvents.map((event) => (
              <tr key={event.id}>
                <td className="admin-table__strong">{event.title}</td>
                <td>{event.subCategory?.name ?? '—'}</td>
                <td>{formatDate(event.updatedAt)}</td>
                <td>
                  <span className="admin-pill admin-pill--status-done">Live</span>
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-icon-btn admin-icon-btn--edit"
                    title="Live preview"
                    aria-label={`Preview ${event.title}`}
                    onClick={() => openPreview(event)}
                  >
                    <i className="bi bi-eye" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
            aria-labelledby="sca-approved-post-preview-title"
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
              <h3 className="admin-modal__title" id="sca-approved-post-preview-title">Post preview</h3>
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
                  categoryName={user?.categoryName ?? ''}
                  subCategoryName={previewPost.subCategory?.name ?? ''}
                  schoolName={user?.schoolName || user?.schoolDomain || 'Your school'}
                  eventDate={eventDateToInputValue(previewPost.eventDate ?? null)}
                  eventStartTime={eventTimeToInputValue(previewPost.eventStartTime ?? null)}
                  eventEndTime={eventTimeToInputValue(previewPost.eventEndTime ?? null)}
                  eventLocation={previewPost.eventLocation?.trim() ?? ''}
                  actionButtons={actionButtonsForApi(parseStoredActionButtons(previewPost.actionButtons))}
                  coverSrc={previewImages[0] ? imageSrc(previewImages[0]) : ''}
                  previewMode={previewMode}
                  accentColor={ADMIN_PORTAL_ACCENTS.subcategory}
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
    </>
  );
};
