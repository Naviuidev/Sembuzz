import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryAdminNavbar } from '../components/CategoryAdminNavbar';
import { CategoryAdminSidebar } from '../components/CategoryAdminSidebar';
import { StatusPopup } from '../components/StatusPopup';
import { categoryAdminEventsService } from '../services/category-admin-events.service';

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

const queryKey = ['category-admin', 'events', 'approved'] as const;

export const CategoryAdminApprovedPosts = () => {
  const queryClient = useQueryClient();
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [popupShow, setPopupShow] = useState<boolean>(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState<string>('');

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

  const selectedPost = useMemo(
    () => approvedEvents.find((e) => e.id === selectedPostId) ?? null,
    [approvedEvents, selectedPostId],
  );

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => categoryAdminEventsService.deleteApproved(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setShowDeleteConfirm(false);
      setSelectedPostId('');
      setPopupType('success');
      setPopupMessage('Post deleted successfully!');
      setPopupShow(true);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setShowDeleteConfirm(false);
      setPopupType('error');
      setPopupMessage(err?.response?.data?.message ?? 'Failed to delete post');
      setPopupShow(true);
    },
  });

  const handleDelete = () => {
    if (!selectedPostId) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!selectedPostId) return;
    deleteMutation.mutate(selectedPostId);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <CategoryAdminNavbar />
      <div className="d-flex">
        <CategoryAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'normal',
            color: '#1a1f2e',
            marginBottom: '2rem'
          }}>
            Approved post
          </h1>

          {/* Search Bar - same style as Edit School */}
          <div className="mb-4" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
            <div style={{ position: 'relative' }}>
              <i
                className="bi bi-search"
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                  fontSize: '1.1rem'
                }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Search approved posts"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  borderRadius: '50px',
                  padding: '0.75rem 1rem 0.75rem 3rem',
                  fontSize: '1rem',
                  border: '1px solid #dee2e6'
                }}
              />
            </div>
          </div>

          {/* List view: cards with title + posted date only */}
          {!selectedPostId && (
            <div className="row g-3 justify-content-center mb-4">
              {isLoading ? (
                <div className="col-12 text-center py-5">
                  <div className="spinner-border text-secondary" role="status" />
                  <p className="mt-2 mb-0" style={{ color: '#6c757d' }}>Loading…</p>
                </div>
              ) : error ? (
                <div className="col-12 text-center py-5">
                  <p style={{ color: '#dc3545' }}>Failed to load approved posts</p>
                </div>
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <div key={event.id} className="col-md-3 col-sm-6">
                    <div
                      onClick={() => setSelectedPostId(event.id)}
                      style={{
                        border: '1px solid rgb(26, 31, 46)',
                        borderRadius: '4px',
                        padding: '1.5rem',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: '0.3s',
                        minHeight: '100px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        color: '#1a1f2e'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 2%)';
                      }}
                    >
                      {(() => {
                        const images = parseImageUrls(event.imageUrls).slice(0, 4);
                        return images.length > 0 ? (
                          <div className="d-flex gap-1 mb-2 rounded overflow-hidden" style={{ minHeight: '56px' }}>
                            {images.map((url, i) => (
                              <img
                                key={i}
                                src={imageSrc(url)}
                                alt=""
                                style={{
                                  width: images.length === 1 ? '100%' : undefined,
                                  flex: images.length > 1 ? 1 : undefined,
                                  height: '56px',
                                  objectFit: 'cover'
                                }}
                              />
                            ))}
                          </div>
                        ) : null;
                      })()}
                      <span style={{
                        color: '#1a1f2e',
                        fontWeight: '500',
                        fontSize: '1rem',
                        marginBottom: '0.5rem'
                      }}>
                        {event.title}
                      </span>
                      <span style={{
                        color: '#6c757d',
                        fontSize: '0.875rem'
                      }}>
                        {formatDate(event.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center py-5">
                  <p style={{ color: '#6c757d' }}>
                    {searchQuery ? 'No posts found matching your search.' : 'No approved posts yet.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Detail view: post details + Delete */}
          {selectedPostId && selectedPost && (
            <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'normal',
                    color: '#1a1f2e',
                    margin: 0
                  }}>
                    Post details
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSelectedPostId('')}
                    className="btn"
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #dee2e6',
                      borderRadius: '50px',
                      padding: '0.5rem 1rem',
                      color: '#1a1f2e',
                      fontWeight: '500'
                    }}
                  >
                    <i className="bi bi-arrow-left me-2" />
                    Back to list
                  </button>
                </div>

                <div className="mb-4">
                  <h3 style={{ fontSize: '1.25rem', color: '#1a1f2e', marginBottom: '1rem' }}>
                    {selectedPost.title}
                  </h3>
                  {selectedPost.description && (
                    <p style={{ color: '#1a1f2e', marginBottom: '1rem' }}>{selectedPost.description}</p>
                  )}
                  {selectedPost.externalLink && (
                    <p className="mb-2">
                      <strong>Link:</strong>{' '}
                      <a href={selectedPost.externalLink} target="_blank" rel="noopener noreferrer">
                        {selectedPost.externalLink}
                      </a>
                    </p>
                  )}
                  <p className="mb-1"><strong>Subcategory:</strong> {selectedPost.subCategory?.name ?? '—'}</p>
                  <p className="mb-1"><strong>Submitted by:</strong> {selectedPost.subCategoryAdmin?.name ?? '—'} ({selectedPost.subCategoryAdmin?.email ?? '—'})</p>
                  <p className="mb-1"><strong>Posted date:</strong> {formatDate(selectedPost.updatedAt)}</p>
                  <p className="mb-2"><strong>Comments:</strong> {selectedPost.commentsEnabled ? 'Enabled' : 'Disabled'}</p>
                  {(() => {
                    const images = parseImageUrls(selectedPost.imageUrls).slice(0, 4);
                    return images.length > 0 ? (
                      <div className="mb-0">
                        <strong>Images:</strong>
                        <div className="d-flex flex-wrap gap-2 mt-1">
                          {images.map((url, i) => {
                            const src = imageSrc(url);
                            return (
                              <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={src}
                                  alt=""
                                  style={{
                                    maxHeight: '80px',
                                    maxWidth: '120px',
                                    objectFit: 'cover',
                                    border: '1px solid #dee2e6'
                                  }}
                                />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Actions: Preview (opens users' website), Delete */}
                <div className="d-flex justify-content-between align-items-center pt-4" style={{ borderTop: '1px solid #dee2e6' }}>
                  <div className="d-flex gap-2">
                    {selectedPost.schoolId && (
                      <a
                        href={`/events?schoolId=${encodeURIComponent(selectedPost.schoolId)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{
                          backgroundColor: '#1a1f2e',
                          border: 'none',
                          borderRadius: '50px',
                          padding: '0.5rem 1.5rem',
                          color: '#fff',
                          fontWeight: '500',
                          transition: 'all 0.3s',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#333';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1a1f2e';
                        }}
                      >
                        Preview
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="btn"
                      style={{
                        backgroundColor: '#dc3545',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                        opacity: deleteMutation.isPending ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!deleteMutation.isPending) {
                          e.currentTarget.style.backgroundColor = '#c82333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!deleteMutation.isPending) {
                          e.currentTarget.style.backgroundColor = '#dc3545';
                        }
                      }}
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete post'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal - same style as Edit School */}
      {showDeleteConfirm && selectedPost && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content" style={{ borderRadius: '0px' }}>
              <div className="modal-header border-0">
                <h5 className="modal-title" style={{ color: '#1a1f2e' }}>
                  Confirm delete
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteConfirm(false)}
                />
              </div>
              <div className="modal-body">
                <p style={{ color: '#6c757d' }}>
                  Are you sure you want to delete <strong>{selectedPost.title}</strong>?
                  This action cannot be undone and will remove the post from the website.
                </p>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #dee2e6',
                    borderRadius: '50px',
                    padding: '0.5rem 1.5rem',
                    color: '#1a1f2e',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  style={{
                    backgroundColor: '#dc3545',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '0.5rem 1.5rem',
                    color: '#fff',
                    fontWeight: '500',
                    opacity: deleteMutation.isPending ? 0.7 : 1
                  }}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <StatusPopup
        show={popupShow}
        type={popupType}
        message={popupMessage}
        onClose={() => setPopupShow(false)}
      />
    </div>
  );
};
