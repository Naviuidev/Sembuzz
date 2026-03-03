import { useState, useEffect } from 'react';
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

export const SchoolAdminPosts = () => {
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

  const handleView = (post: SchoolAdminPost) => {
    setViewPost(post);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

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
      pending: { label: 'Pending', className: 'bg-warning text-dark' },
      approved: { label: 'Approved', className: 'bg-success' },
      reverted: { label: 'Reverted', className: 'bg-secondary' },
    };
    const s = map[status] || { label: status, className: 'bg-secondary' };
    return <span className={`badge ${s.className}`}>{s.label}</span>;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SchoolAdminNavbar />
      <div className="d-flex">
        <SchoolAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <div className="mb-4">
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 'normal',
                color: '#1a1f2e',
                marginBottom: '0.5rem',
              }}
            >
              Posts
            </h1>
            <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: 0 }}>
              All posts posted within your school. View details or delete. Edit is available only to Category admin.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger mb-4" style={{ borderRadius: '0px' }}>
              {error}
            </div>
          )}

          <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-secondary" />
                  <p className="mt-2 mb-0 text-muted">Loading posts…</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-file-post" style={{ fontSize: '3rem', color: '#6c757d' }} />
                  <p className="text-muted mb-0 mt-2">No posts yet.</p>
                  <p className="text-muted small mt-1">Posts created by subcategory admins will appear here.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Title</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Category / Subcategory</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Status</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Posted by</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Date</th>
                        <th style={{ fontWeight: '600', color: '#1a1f2e', width: '140px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((post) => (
                        <tr key={post.id}>
                          <td>
                            <span style={{ fontWeight: '500' }}>{post.title}</span>
                          </td>
                          <td style={{ fontSize: '0.9rem' }}>
                            {post.subCategory?.category?.name ?? '—'} / {post.subCategory?.name ?? '—'}
                          </td>
                          <td>{statusBadge(post.status)}</td>
                          <td style={{ fontSize: '0.9rem' }}>
                            {post.subCategoryAdmin?.name ?? post.subCategoryAdmin?.email ?? '—'}
                          </td>
                          <td style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                            {formatDate(post.createdAt)}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleView(post)}
                                style={{ borderRadius: '6px' }}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDeleteClick(post.id)}
                                style={{ borderRadius: '6px' }}
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
          </div>
        </div>
      </div>

      {/* View popup – custom style */}
      {viewPost && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
          }}
          onClick={() => setViewPost(null)}
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
              <h3
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'normal',
                  color: '#1a1f2e',
                  marginBottom: '1rem',
                }}
              >
                {viewPost.title}
              </h3>
              <div className="mb-3">
                {statusBadge(viewPost.status)}
                <span className="ms-2 text-muted small">
                  {viewPost.subCategory?.category?.name} / {viewPost.subCategory?.name}
                </span>
              </div>
              {viewPost.description && (
                <p className="mb-3" style={{ whiteSpace: 'pre-wrap', color: '#6c757d' }}>
                  {viewPost.description}
                </p>
              )}
              {parseImageUrls(viewPost.imageUrls).length > 0 && (
                <div className="mb-3">
                  <span className="text-muted small d-block mb-2">Images:</span>
                  <div className="d-flex flex-wrap gap-2">
                    {parseImageUrls(viewPost.imageUrls).map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="d-block"
                      >
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
              {viewPost.status === 'reverted' && viewPost.revertNotes && (
                <div className="alert alert-secondary mt-2 mb-3 small">
                  <strong>Revert notes:</strong> {viewPost.revertNotes}
                </div>
              )}
              <div className="d-flex justify-content-end gap-3">
                <button
                  type="button"
                  onClick={() => setViewPost(null)}
                  className="btn"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #dee2e6',
                    borderRadius: '50px',
                    padding: '0.5rem 1.5rem',
                    color: '#1a1f2e',
                    fontWeight: '500',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm popup – custom style */}
      {deleteId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
          }}
          onClick={() => !deleting && setDeleteId(null)}
        >
          <div
            className="card border-0 shadow-lg"
            style={{
              borderRadius: '0px',
              minWidth: '400px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-body p-4">
              <h3
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'normal',
                  color: '#1a1f2e',
                  marginBottom: '1rem',
                }}
              >
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
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting) e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="btn"
                  style={{
                    backgroundColor: '#dc3545',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '0.5rem 1.5rem',
                    color: '#fff',
                    fontWeight: '500',
                    transition: 'all 0.3s',
                    opacity: deleting ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting) e.currentTarget.style.backgroundColor = '#c82333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                  }}
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
