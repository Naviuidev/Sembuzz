import { useState, useEffect } from 'react';
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

export function SchoolAdminPostsListPanel() {
  const [posts, setPosts] = useState<SchoolAdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewPost, setViewPost] = useState<SchoolAdminPost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await schoolAdminPostsService.deletePost(deleteId);
      setPosts((prev) => prev.filter((p) => p.id !== deleteId));
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

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending approval', className: 'bg-warning text-dark' },
      scheduled: { label: 'Scheduled', className: 'bg-info text-dark' },
      published: { label: 'Published', className: 'bg-success' },
      approved: { label: 'Published', className: 'bg-success' },
      reverted: { label: 'Changes requested', className: 'bg-secondary' },
      schedule_missed: { label: 'Schedule missed', className: 'bg-danger' },
      cancelled: { label: 'Cancelled', className: 'bg-secondary' },
    };
    const s = map[status] || { label: status, className: 'bg-secondary' };
    return <span className={`badge ${s.className}`}>{s.label}</span>;
  };

  return (
    <>
      {error ? (
        <div className="admin-notice mb-3">
          <p className="admin-form-hint admin-form-hint--error mb-0">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status" />
          <p className="mt-2 mb-0 text-muted">Loading posts…</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-file-post admin-empty-icon" aria-hidden />
          <p className="text-muted mb-0 mt-2">No posts yet.</p>
          <p className="text-muted small mt-1">Posts created by subcategory admins will appear here.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category / Subcategory</th>
                <th>Status</th>
                <th>Posted by</th>
                <th>Date</th>
                <th style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <span className="fw-medium">{post.title}</span>
                  </td>
                  <td className="small">
                    {post.subCategory?.category?.name ?? '—'} / {post.subCategory?.name ?? '—'}
                  </td>
                  <td>{statusBadge(post.status)}</td>
                  <td className="small">
                    {post.subCategoryAdmin?.name ?? post.subCategoryAdmin?.email ?? '—'}
                  </td>
                  <td className="text-muted small">{formatDate(post.createdAt)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="admin-btn-secondary admin-btn-sm"
                        onClick={() => setViewPost(post)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="admin-btn-danger admin-btn-sm"
                        onClick={() => setDeleteId(post.id)}
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

      {viewPost ? (
        <div className="admin-modal-overlay" onClick={() => setViewPost(null)} role="presentation">
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="school-admin-post-view-title"
          >
            <div className="admin-modal__body">
              <h3 className="admin-modal__title" id="school-admin-post-view-title">{viewPost.title}</h3>
              <div className="mb-3">
                {statusBadge(viewPost.status)}
                <span className="ms-2 text-muted small">
                  {viewPost.subCategory?.category?.name} / {viewPost.subCategory?.name}
                </span>
              </div>
              {viewPost.description ? (
                <p className="mb-3 text-muted" style={{ whiteSpace: 'pre-wrap' }}>{viewPost.description}</p>
              ) : null}
              {parseImageUrls(viewPost.imageUrls).length > 0 ? (
                <div className="mb-3">
                  <span className="text-muted small d-block mb-2">Images</span>
                  <div className="d-flex flex-wrap gap-2">
                    {parseImageUrls(viewPost.imageUrls).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt=""
                          style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover', borderRadius: 6 }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
              {viewPost.externalLink ? (
                <p className="mb-2">
                  <a href={viewPost.externalLink} target="_blank" rel="noopener noreferrer">External link</a>
                </p>
              ) : null}
              <p className="text-muted small mb-3">
                Posted by {viewPost.subCategoryAdmin?.name ?? viewPost.subCategoryAdmin?.email} ·{' '}
                {formatDate(viewPost.createdAt)}
              </p>
              {viewPost.status === 'reverted' && viewPost.revertNotes ? (
                <div className="admin-notice mb-3">
                  <p className="mb-0 small"><strong>Revert notes:</strong> {viewPost.revertNotes}</p>
                </div>
              ) : null}
              <div className="d-flex justify-content-end">
                <button type="button" className="admin-btn-secondary" onClick={() => setViewPost(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteId ? (
        <div
          className="admin-modal-overlay"
          onClick={() => !deleting && setDeleteId(null)}
          role="presentation"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal__body">
              <h3 className="admin-modal__title">Confirm delete</h3>
              <p className="text-muted">Are you sure you want to delete this post? This cannot be undone.</p>
              <div className="d-flex justify-content-end gap-2">
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
