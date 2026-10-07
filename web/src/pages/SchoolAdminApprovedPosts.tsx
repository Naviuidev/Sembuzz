import { useState, useEffect, useMemo, useRef } from 'react';
import {
  schoolAdminPostsService,
  type SchoolAdminPost,
} from '../services/school-admin-posts.service';
import {
  EventPostDetailFields,
  actionButtonsForApi,
  eventDateToInputValue,
  eventTimeToInputValue,
  parseStoredActionButtons,
  validateActionButtons,
} from '../components/EventPostDetailFields';
import type { EventActionButton } from '../types/event-post';
import { imageSrc } from '../utils/image';
import { CreatePostLivePreview } from '../components/CreatePostLivePreview';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';

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

export function SchoolAdminApprovedPostsPanel() {
  const { user } = useSchoolAdminAuth();
  const [posts, setPosts] = useState<SchoolAdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<SchoolAdminPost | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'web'>('mobile');
  const [viewPost, setViewPost] = useState<SchoolAdminPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editActionButtons, setEditActionButtons] = useState<EventActionButton[]>([]);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    externalLink: string;
    eventDate: string;
    eventStartTime: string;
    eventEndTime: string;
    eventLocation: string;
    commentsEnabled: boolean;
    imageUrls: string[];
  }>({
    title: '',
    description: '',
    externalLink: '',
    eventDate: '',
    eventStartTime: '',
    eventEndTime: '',
    eventLocation: '',
    commentsEnabled: false,
    imageUrls: [],
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const approvedPosts = useMemo(
    () => posts.filter((p) => ['published', 'approved', 'scheduled'].includes(p.status)),
    [posts],
  );

  const fetchPosts = () => {
    setLoading(true);
    setError(null);
    schoolAdminPostsService
      .getPosts()
      .then(setPosts)
      .catch((err) => {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        setError(msg || 'Failed to load posts.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const openPreview = (post: SchoolAdminPost) => {
    setPreviewPost(post);
    setPreviewMode('mobile');
  };

  const openEdit = (post: SchoolAdminPost) => {
    setViewPost(post);
    setIsEditing(true);
    setEditForm({
      title: post.title,
      description: post.description ?? '',
      externalLink: post.externalLink ?? '',
      eventDate: eventDateToInputValue(post.eventDate ?? null),
      eventStartTime: eventTimeToInputValue(post.eventStartTime ?? null),
      eventEndTime: eventTimeToInputValue(post.eventEndTime ?? null),
      eventLocation: post.eventLocation?.trim() ?? '',
      commentsEnabled: post.commentsEnabled ?? false,
      imageUrls: parseImageUrls(post.imageUrls),
    });
    setEditActionButtons(parseStoredActionButtons(post.actionButtons));
  };

  const handleEditFromPreview = () => {
    if (!previewPost) return;
    const post = previewPost;
    setPreviewPost(null);
    openEdit(post);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setViewPost(null);
  };

  const handleEditSave = async () => {
    if (!viewPost) return;
    const actionBtnError = validateActionButtons(editActionButtons);
    if (actionBtnError) {
      setError(actionBtnError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const imageUrlsFiltered = editForm.imageUrls.map((u) => u.trim()).filter(Boolean);
      const updated = await schoolAdminPostsService.updatePost(viewPost.id, {
        title: editForm.title.trim() || undefined,
        description: editForm.description.trim() || undefined,
        externalLink: editForm.externalLink.trim() || undefined,
        eventDate: editForm.eventDate.trim() || '',
        eventStartTime: editForm.eventStartTime.trim() || '',
        eventEndTime: editForm.eventEndTime.trim() || '',
        eventLocation: editForm.eventLocation.trim() || '',
        actionButtons: actionButtonsForApi(editActionButtons),
        commentsEnabled: editForm.commentsEnabled,
        imageUrls: imageUrlsFiltered.length > 0 ? imageUrlsFiltered : [],
      });
      setPosts((prev) => prev.map((p) => (p.id === viewPost.id ? updated : p)));
      setViewPost(null);
      setIsEditing(false);
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg || 'Failed to update post.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => setDeleteId(id);

  const removeImageUrl = (index: number) =>
    setEditForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== index) }));

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingImages(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const { url } = await schoolAdminPostsService.uploadImage(file);
        urls.push(url);
      }
      setEditForm((f) => ({ ...f, imageUrls: [...f.imageUrls, ...urls] }));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg || 'Failed to upload image(s).');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await schoolAdminPostsService.deletePost(deleteId);
      setPosts((prev) => prev.filter((p) => p.id !== deleteId));
      setViewPost((p) => (p?.id === deleteId ? null : p));
      setDeleteId(null);
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg || 'Failed to delete post.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {error ? (
        <div className="admin-notice mb-3">
          <p className="admin-form-hint admin-form-hint--error mb-0">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="admin-loading-state">
          <div className="spinner-border text-secondary" role="status" />
          <p className="mt-2 mb-0">Loading approved posts…</p>
        </div>
      ) : approvedPosts.length === 0 ? (
        <div className="admin-empty-state">
          <i className="bi bi-check2-circle" style={{ fontSize: '2.5rem', opacity: 0.45 }} aria-hidden />
          <p className="mt-3 mb-0">No approved posts yet.</p>
          <p className="small mb-0">Posts from subcategory admins appear here once approved or published.</p>
        </div>
      ) : (
        <div className="admin-approved-posts">
          <div className="admin-approved-posts__toolbar">
            <span className="admin-approved-posts__count">
              {approvedPosts.length} approved {approvedPosts.length === 1 ? 'post' : 'posts'}
            </span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table admin-approved-posts__table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category / Subcategory</th>
                  <th>Posted by</th>
                  <th className="admin-approved-posts__actions-col" aria-label="Actions">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {approvedPosts.map((post) => {
                  const categoryLabel = [post.subCategory?.category?.name, post.subCategory?.name]
                    .filter(Boolean)
                    .join(' / ');
                  const author =
                    post.subCategoryAdmin?.name ??
                    post.subCategoryAdmin?.email ??
                    post.schoolAdmin?.name ??
                    '—';
                  return (
                    <tr key={post.id}>
                      <td>
                        <span className="admin-table__strong">{post.title}</span>
                        <span className="d-block mt-1">{statusPill(post.status)}</span>
                      </td>
                      <td>{categoryLabel || '—'}</td>
                      <td>{author}</td>
                      <td>
                        <div className="admin-table-actions admin-approved-posts__row-actions">
                          <button
                            type="button"
                            className="admin-icon-btn"
                            aria-label={`Preview ${post.title}`}
                            onClick={() => openPreview(post)}
                          >
                            <i className="bi bi-eye" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-btn--danger"
                            aria-label={`Delete ${post.title}`}
                            onClick={() => handleDeleteClick(post.id)}
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
            aria-labelledby="approved-post-preview-title"
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
              <h3 className="admin-modal__title" id="approved-post-preview-title">Post preview</h3>
              <p className="admin-form-hint mb-3">{previewPost.title}</p>
              <div
                className="admin-create-post-preview-toggle mb-3"
                role="tablist"
                aria-label="Preview device"
              >
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
                  categoryName={previewPost.subCategory?.category?.name ?? ''}
                  subCategoryName={previewPost.subCategory?.name ?? ''}
                  schoolName={user?.schoolName || user?.schoolDomain || 'Your school'}
                  eventDate={eventDateToInputValue(previewPost.eventDate ?? null)}
                  eventStartTime={eventTimeToInputValue(previewPost.eventStartTime ?? null)}
                  eventEndTime={eventTimeToInputValue(previewPost.eventEndTime ?? null)}
                  eventLocation={previewPost.eventLocation?.trim() ?? ''}
                  actionButtons={actionButtonsForApi(
                    parseStoredActionButtons(previewPost.actionButtons),
                  )}
                  coverSrc={
                    parseImageUrls(previewPost.imageUrls)[0]
                      ? imageSrc(parseImageUrls(previewPost.imageUrls)[0])
                      : ''
                  }
                  previewMode={previewMode}
                  accentColor={ADMIN_PORTAL_ACCENTS.school}
                  commentsEnabled={previewPost.commentsEnabled}
                />
              </div>
              <div className="admin-modal__footer admin-modal__footer--between mt-3">
                <button type="button" className="admin-btn-secondary" onClick={() => setPreviewPost(null)}>
                  Close
                </button>
                <button type="button" className="admin-btn-primary" onClick={handleEditFromPreview}>
                  Edit post
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {viewPost && isEditing ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          onClick={() => !saving && handleEditCancel()}
          role="presentation"
        >
          <div
            className="admin-modal admin-modal--xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="approved-post-modal-title"
          >
            <button
              type="button"
              className="admin-modal__close"
              aria-label="Close"
              onClick={() => !saving && handleEditCancel()}
            >
              <i className="bi bi-x-lg" aria-hidden />
            </button>
            <div className="admin-modal__body admin-modal__body--with-close admin-modal__scroll">
              <>
                  <h3 className="admin-modal__title" id="approved-post-modal-title">Edit post</h3>
                  <div className="mb-3">
                    <label className="admin-form-label" htmlFor="approved-edit-title">Title</label>
                    <input
                      id="approved-edit-title"
                      type="text"
                      className="form-control admin-form-control"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Post title"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="admin-form-label" htmlFor="approved-edit-desc">Description</label>
                    <textarea
                      id="approved-edit-desc"
                      className="form-control admin-form-control"
                      rows={4}
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Description"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="admin-form-label" htmlFor="approved-edit-link">External link</label>
                    <input
                      id="approved-edit-link"
                      type="url"
                      className="form-control admin-form-control"
                      value={editForm.externalLink}
                      onChange={(e) => setEditForm((f) => ({ ...f, externalLink: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <EventPostDetailFields
                    details={{
                      eventDate: editForm.eventDate,
                      eventStartTime: editForm.eventStartTime,
                      eventEndTime: editForm.eventEndTime,
                      eventLocation: editForm.eventLocation,
                    }}
                    onDetailsChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                    actionButtons={editActionButtons}
                    onActionButtonsChange={setEditActionButtons}
                  />
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="editCommentsEnabled"
                        checked={editForm.commentsEnabled}
                        onChange={(e) => setEditForm((f) => ({ ...f, commentsEnabled: e.target.checked }))}
                      />
                      <label className="form-check-label" htmlFor="editCommentsEnabled">
                        Allow users to comment
                      </label>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="admin-form-label">Images</label>
                    {editForm.imageUrls.length > 0 ? (
                      <div className="admin-create-post-upload-thumbs mb-2">
                        {editForm.imageUrls.map((url, i) => (
                          <div key={i} className="position-relative">
                            <img src={imageSrc(url)} alt="" width={72} height={72} />
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--danger position-absolute top-0 end-0"
                              style={{ transform: 'translate(25%, -25%)' }}
                              onClick={() => removeImageUrl(i)}
                              title="Remove image"
                              aria-label="Remove image"
                            >
                              <i className="bi bi-x" aria-hidden />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      className="d-none"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      className="admin-btn-secondary admin-btn-sm"
                      disabled={uploadingImages}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingImages ? 'Uploading…' : 'Choose images'}
                    </button>
                    <p className="admin-form-hint mt-2 mb-0">JPEG, PNG, GIF, WebP. Max 10MB each.</p>
                  </div>
                  <div className="admin-modal__footer admin-modal__footer--between">
                    <button type="button" className="admin-btn-secondary" onClick={handleEditCancel} disabled={saving}>
                      Cancel
                    </button>
                    <button type="button" className="admin-btn-primary" onClick={handleEditSave} disabled={saving}>
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
              </>
            </div>
          </div>
        </div>
      ) : null}

      {deleteId ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          onClick={() => !deleting && setDeleteId(null)}
          role="presentation"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal__body">
              <h3 className="admin-modal__title">Delete this post?</h3>
              <p className="admin-modal__text">This cannot be undone. The post will be removed from your school feed.</p>
              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => !deleting && setDeleteId(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button type="button" className="admin-btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
