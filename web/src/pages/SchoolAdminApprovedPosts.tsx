import { useState, useEffect, useMemo, useRef } from 'react';
import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
import {
  schoolAdminPostsService,
  type SchoolAdminPost,
} from '../services/school-admin-posts.service';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
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

/** First ~40 words of text */
function firstWords(text: string | null, maxWords = 40): string {
  if (!text || !text.trim()) return '';
  const words = text.trim().split(/\s+/).slice(0, maxWords);
  return words.join(' ') + (words.length >= maxWords ? '…' : '');
}

export const SchoolAdminApprovedPosts = () => {
  const [posts, setPosts] = useState<SchoolAdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewPost, setViewPost] = useState<SchoolAdminPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    externalLink: string;
    imageUrls: string[];
  }>({ title: '', description: '', externalLink: '', imageUrls: [] });
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const approvedPosts = useMemo(
    () => posts.filter((p) => p.status === 'approved'),
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

  const handleView = (post: SchoolAdminPost) => {
    setViewPost(post);
    setIsEditing(false);
    setEditForm({
      title: post.title,
      description: post.description ?? '',
      externalLink: post.externalLink ?? '',
      imageUrls: parseImageUrls(post.imageUrls),
    });
  };

  const handleEditClick = () => setIsEditing(true);

  const handleEditCancel = () => setIsEditing(false);

  const handleEditSave = async () => {
    if (!viewPost) return;
    setSaving(true);
    setError(null);
    try {
      const imageUrlsFiltered = editForm.imageUrls.map((u) => u.trim()).filter(Boolean);
      const updated = await schoolAdminPostsService.updatePost(viewPost.id, {
        title: editForm.title.trim() || undefined,
        description: editForm.description.trim() || undefined,
        externalLink: editForm.externalLink.trim() || undefined,
        imageUrls: imageUrlsFiltered.length > 0 ? imageUrlsFiltered : [],
      });
      setPosts((prev) => prev.map((p) => (p.id === viewPost.id ? updated : p)));
      setViewPost(updated);
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
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SchoolAdminNavbar />
      <div className="d-flex">
        <SchoolAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <div className="mb-4">
            <h1 style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '0.5rem' }}>
              Approved posts
            </h1>
            <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: 0 }}>
              Approved posts from subcategory admins. View, edit (title, description, link, images), or delete.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger mb-4" style={{ borderRadius: '0px' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-secondary" />
              <p className="mt-2 mb-0 text-muted">Loading approved posts…</p>
            </div>
          ) : approvedPosts.length === 0 ? (
            <div className="card border-0 shadow-sm p-5 text-center" style={{ borderRadius: '0px' }}>
              <i className="bi bi-globe" style={{ fontSize: '3rem', color: '#6c757d' }} />
              <p className="text-muted mb-0 mt-2">No approved posts yet.</p>
            </div>
          ) : (
            <div className="row g-4">
              {approvedPosts.map((post) => {
                const images = parseImageUrls(post.imageUrls);
                const firstImg = images[0] ?? null;
                return (
                  <div key={post.id} className="col-12 col-sm-6 col-lg-4">
                    <div
                      className="card border-0 shadow-sm h-100"
                      style={{ borderRadius: '0px', overflow: 'hidden' }}
                    >
                      {firstImg && (
                        <div
                          style={{
                            height: '180px',
                            backgroundColor: '#eee',
                            backgroundImage: `url(${firstImg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                      )}
                      <div className="card-body p-3">
                        <h5 className="card-title mb-2" style={{ fontSize: '1.1rem', color: '#1a1f2e', fontWeight: '600' }}>
                          {post.title}
                        </h5>
                        <p className="card-text small text-muted mb-3" style={{ minHeight: '3.6em' }}>
                          {firstWords(post.description, 40)}
                        </p>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            border: '1px solid #dee2e6',
                            borderRadius: '50px',
                            padding: '0.35rem 1rem',
                            color: '#1a1f2e',
                            fontWeight: '500',
                          }}
                          onClick={() => handleView(post)}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* View / Edit modal */}
      {viewPost && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
          }}
          onClick={() => !isEditing && setViewPost(null)}
        >
          <div
            className="card border-0 shadow-lg"
            style={{
              borderRadius: '0px',
              minWidth: '400px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-body p-4">
              {isEditing ? (
                <>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1a1f2e', marginBottom: '1rem' }}>
                    Edit post
                  </h3>
                  <div className="mb-3">
                    <label className="form-label small fw-500" style={{ color: '#1a1f2e' }}>
                      Title
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Post title"
                      style={{ borderRadius: '0px' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-500" style={{ color: '#1a1f2e' }}>
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Description"
                      style={{ borderRadius: '0px' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-500" style={{ color: '#1a1f2e' }}>
                      External link
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      value={editForm.externalLink}
                      onChange={(e) => setEditForm((f) => ({ ...f, externalLink: e.target.value }))}
                      placeholder="https://..."
                      style={{ borderRadius: '0px' }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-500" style={{ color: '#1a1f2e' }}>
                      Images
                    </label>
                    {editForm.imageUrls.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {editForm.imageUrls.map((url, i) => (
                          <div key={i} className="position-relative d-inline-block">
                            <img
                              src={url}
                              alt=""
                              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '6px', border: '1px solid #dee2e6' }}
                            />
                            <button
                              type="button"
                              className="position-absolute top-0 end-0 btn btn-sm btn-danger rounded-circle p-0"
                              style={{ width: 22, height: 22, fontSize: '0.75rem', lineHeight: 1 }}
                              onClick={() => removeImageUrl(i)}
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                      className="btn btn-sm"
                      style={{
                        border: '1px solid #dee2e6',
                        borderRadius: '0px',
                        padding: '0.4rem 0.9rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                      }}
                      disabled={uploadingImages}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingImages ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" />
                          Uploading…
                        </>
                      ) : (
                        <>Choose file(s)</>
                      )}
                    </button>
                    <span className="text-muted small ms-2">JPEG, PNG, GIF, WebP. Max 10MB each.</span>
                  </div>
                  <div className="d-flex justify-content-end gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                      }}
                      onClick={handleEditCancel}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      style={{ borderRadius: '50px', padding: '0.5rem 1rem', fontWeight: '500' }}
                      onClick={handleEditSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" />
                          Saving…
                        </>
                      ) : (
                        'Update'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '1rem' }}>
                    {viewPost.title}
                  </h3>
                  <p className="text-muted small mb-2">
                    {viewPost.subCategory?.category?.name} / {viewPost.subCategory?.name}
                  </p>
                  {viewPost.description && (
                    <p className="mb-3" style={{ whiteSpace: 'pre-wrap', color: '#6c757d' }}>
                      {viewPost.description}
                    </p>
                  )}
                  {parseImageUrls(viewPost.imageUrls).length > 0 && (
                    <div className="mb-3">
                      <div className="d-flex flex-wrap gap-2">
                        {parseImageUrls(viewPost.imageUrls).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="d-block">
                            <img
                              src={url}
                              alt=""
                              style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover', borderRadius: '6px' }}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewPost.externalLink && (
                    <p className="mb-2">
                      <a href={viewPost.externalLink} target="_blank" rel="noopener noreferrer">
                        External link
                      </a>
                    </p>
                  )}
                  <p className="text-muted small mb-3">
                    Posted by {viewPost.subCategoryAdmin?.name ?? viewPost.subCategoryAdmin?.email} ·{' '}
                    {formatDate(viewPost.createdAt)}
                  </p>
                  <div className="d-flex justify-content-end gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1rem',
                        color: '#fff',
                        fontWeight: '500',
                      }}
                      onClick={handleEditClick}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                      }}
                      onClick={() => setViewPost(null)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      style={{ borderRadius: '50px', padding: '0.5rem 1rem', fontWeight: '500' }}
                      onClick={() => handleDeleteClick(viewPost.id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1060,
          }}
          onClick={() => !deleting && setDeleteId(null)}
        >
          <div
            className="card border-0 shadow-lg"
            style={{ borderRadius: '0px', minWidth: '400px', maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-body p-4">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '1rem' }}>
                Confirm Delete
              </h3>
              <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
                Are you sure you want to delete this post? This cannot be undone.
              </p>
              <div className="d-flex justify-content-end gap-3">
                <button
                  type="button"
                  onClick={() => !deleting && setDeleteId(null)}
                  disabled={deleting}
                  className="btn"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #dee2e6',
                    borderRadius: '50px',
                    padding: '0.5rem 1.5rem',
                    color: '#1a1f2e',
                    fontWeight: '500',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="btn btn-danger"
                  style={{ borderRadius: '50px', padding: '0.5rem 1.5rem', fontWeight: '500' }}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" />
                      Deleting…
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
