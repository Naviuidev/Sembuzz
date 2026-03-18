import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryAdminNavbar } from '../components/CategoryAdminNavbar';
import { CategoryAdminSidebar } from '../components/CategoryAdminSidebar';
import {
  categoryAdminBlogsService,
  type BlogForCategoryAdmin,
  type UpdateBlogDto,
} from '../services/category-admin-blogs.service';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
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

function imageSrc(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_BASE.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

type Tab = 'pending' | 'library';

export const CategoryAdminBlogs = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editBlog, setEditBlog] = useState<BlogForCategoryAdmin | null>(null);
  const [editForm, setEditForm] = useState<UpdateBlogDto>({});
  const [revertBlog, setRevertBlog] = useState<BlogForCategoryAdmin | null>(null);
  const [revertNotes, setRevertNotes] = useState('');
  const [rejectBlog, setRejectBlog] = useState<BlogForCategoryAdmin | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [approveBlog, setApproveBlog] = useState<BlogForCategoryAdmin | null>(null);
  const [deleteBlog, setDeleteBlog] = useState<BlogForCategoryAdmin | null>(null);

  const pendingQ = useQuery({
    queryKey: ['category-admin', 'blogs', 'pending'],
    queryFn: () => categoryAdminBlogsService.getPending(),
    enabled: tab === 'pending',
  });

  const libraryQ = useQuery({
    queryKey: ['category-admin', 'blogs', 'approved'],
    queryFn: () => categoryAdminBlogsService.getApproved(),
    enabled: tab === 'library',
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['category-admin', 'blogs'] });
  };

  const updateM = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBlogDto }) =>
      categoryAdminBlogsService.update(id, dto),
    onSuccess: () => {
      invalidate();
      setEditBlog(null);
    },
  });

  const revertM = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      categoryAdminBlogsService.revert(id, notes),
    onSuccess: () => {
      invalidate();
      setRevertBlog(null);
      setRevertNotes('');
    },
  });

  const rejectM = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      categoryAdminBlogsService.reject(id, notes),
    onSuccess: () => {
      invalidate();
      setRejectBlog(null);
      setRejectNotes('');
    },
  });

  const approveM = useMutation({
    mutationFn: (id: string) => categoryAdminBlogsService.approve(id),
    onSuccess: () => {
      invalidate();
      setApproveBlog(null);
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => categoryAdminBlogsService.deleteApproved(id),
    onSuccess: (_data, deletedId) => {
      invalidate();
      setDeleteBlog(null);
      setExpandedId((cur) => (cur === deletedId ? null : cur));
    },
  });

  const pending = pendingQ.data ?? [];
  const library = libraryQ.data ?? [];

  const btn = {
    borderRadius: '0px',
    padding: '0.35rem 0.6rem',
    fontSize: '0.8rem',
    marginRight: '0.35rem',
    marginBottom: '0.25rem',
  } as const;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <CategoryAdminNavbar />
      <div className="d-flex">
        <CategoryAdminSidebar />
        <div style={{ flex: 1, padding: '2rem', minHeight: 'calc(100vh - 60px)' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e' }}>Blogs</h1>
          <p className="text-muted mb-4">
            Approve submissions to make them public (same as news). View approved blogs below.
          </p>

          <ul className="nav nav-tabs mb-4" style={{ borderRadius: 0 }}>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${tab === 'pending' ? 'active' : ''}`}
                onClick={() => setTab('pending')}
              >
                Pending approval
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${tab === 'library' ? 'active' : ''}`}
                onClick={() => setTab('library')}
              >
                View approved blogs
              </button>
            </li>
          </ul>

          {tab === 'pending' && (
            <>
              {pendingQ.isLoading && <p>Loading…</p>}
              {pending.length === 0 && !pendingQ.isLoading && (
                <p className="text-muted">No blog posts awaiting approval.</p>
              )}
              <div className="table-responsive card border-0 shadow-sm" style={{ borderRadius: 0 }}>
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Subcategory</th>
                      <th>Author</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((row) => (
                      <React.Fragment key={row.id}>
                        <tr>
                          <td>{row.title}</td>
                          <td>{row.subCategory?.name}</td>
                          <td>
                            {row.subCategoryAdmin?.name}
                            <br />
                            <small className="text-muted">{row.subCategoryAdmin?.email}</small>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              style={btn}
                              onClick={() =>
                                setExpandedId(expandedId === row.id ? null : row.id)
                              }
                            >
                              {expandedId === row.id ? 'Hide' : 'View'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              style={btn}
                              onClick={() => {
                                setEditBlog(row);
                                setEditForm({
                                  title: row.title,
                                  content: row.content,
                                  coverImageUrl: row.coverImageUrl,
                                });
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-success btn-sm text-white"
                              style={btn}
                              onClick={() => setApproveBlog(row)}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-warning btn-sm"
                              style={btn}
                              onClick={() => setRevertBlog(row)}
                            >
                              Suggest changes
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm text-white"
                              style={btn}
                              onClick={() => setRejectBlog(row)}
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                        {expandedId === row.id && (
                          <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <td colSpan={4} className="p-3">
                              <div style={{ whiteSpace: 'pre-wrap' }} className="mb-2">
                                {row.content}
                              </div>
                              {row.coverImageUrl && (
                                <img
                                  src={imageSrc(row.coverImageUrl)}
                                  alt=""
                                  style={{ maxHeight: 140 }}
                                  className="mb-2"
                                />
                              )}
                              {parseImageUrls(row.imageUrls).map((u, i) => (
                                <img
                                  key={i}
                                  src={imageSrc(u)}
                                  alt=""
                                  className="me-2 mb-2"
                                  style={{ maxHeight: 100 }}
                                />
                              ))}
                              <p className="small text-muted mb-0">
                                Submitted {formatDate(row.createdAt)}
                              </p>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'library' && (
            <>
              {libraryQ.isLoading && <p>Loading…</p>}
              {library.length === 0 && !libraryQ.isLoading && (
                <p className="text-muted">No blogs yet. Approve submissions to see them here.</p>
              )}
              <div className="table-responsive card border-0 shadow-sm" style={{ borderRadius: 0 }}>
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Subcategory</th>
                      <th>Author</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {library.map((row) => (
                      <React.Fragment key={row.id}>
                        <tr>
                          <td>{row.title}</td>
                          <td>
                            <span className="badge bg-success" style={{ borderRadius: 0 }}>
                              Live (public)
                            </span>
                          </td>
                          <td>{row.subCategory?.name}</td>
                          <td>{row.subCategoryAdmin?.name}</td>
                          <td className="text-nowrap">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              style={btn}
                              onClick={() =>
                                setExpandedId(expandedId === row.id ? null : row.id)
                              }
                            >
                              {expandedId === row.id ? 'Hide' : 'View'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm border-0"
                              style={btn}
                              title="Delete blog"
                              aria-label="Delete blog"
                              disabled={deleteM.isPending}
                              onClick={() => setDeleteBlog(row)}
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </td>
                        </tr>
                        {expandedId === row.id && (
                          <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <td colSpan={5} className="p-3">
                              <div style={{ whiteSpace: 'pre-wrap' }}>{row.content}</div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {deleteBlog && (
            <div
              className="modal d-block"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              tabIndex={-1}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content" style={{ borderRadius: 0 }}>
                  <div className="modal-header">
                    <h5 className="modal-title">Delete blog</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setDeleteBlog(null)}
                      aria-label="Close"
                    />
                  </div>
                  <div className="modal-body">
                    <p className="mb-2">
                      Permanently delete <strong>{deleteBlog.title}</strong>? It will disappear from
                      the public Events feed and Blogs page.
                    </p>
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ borderRadius: 0 }}
                        disabled={deleteM.isPending}
                        onClick={() => setDeleteBlog(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ borderRadius: 0 }}
                        disabled={deleteM.isPending}
                        onClick={() => deleteM.mutate(deleteBlog.id)}
                      >
                        {deleteM.isPending ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {approveBlog && (
            <div
              className="modal d-block"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              tabIndex={-1}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content" style={{ borderRadius: 0 }}>
                  <div className="modal-header">
                    <h5 className="modal-title">Approve blog</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setApproveBlog(null)}
                    />
                  </div>
                  <div className="modal-body">
                    <p className="mb-3">
                      <strong>{approveBlog.title}</strong>
                    </p>
                    <p className="text-muted small mb-3">
                      This will make the blog public on the Events feed and Blogs page — same as
                      approving news.
                    </p>
                    <button
                      type="button"
                      className="btn text-white"
                      style={{ backgroundColor: '#1a1f2e', borderRadius: 0 }}
                      disabled={approveM.isPending}
                      onClick={() => approveM.mutate(approveBlog.id)}
                    >
                      {approveM.isPending ? 'Approving…' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {editBlog && (
            <div
              className="modal d-block"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              tabIndex={-1}
            >
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content" style={{ borderRadius: 0 }}>
                  <div className="modal-header">
                    <h5 className="modal-title">Edit before approval</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setEditBlog(null)}
                    />
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Title</label>
                      <input
                        className="form-control"
                        style={{ borderRadius: 0 }}
                        value={editForm.title ?? ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Content</label>
                      <textarea
                        className="form-control"
                        style={{ borderRadius: 0, minHeight: 200 }}
                        value={editForm.content ?? ''}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, content: e.target.value }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="btn text-white"
                      style={{ backgroundColor: '#1a1f2e', borderRadius: 0 }}
                      disabled={updateM.isPending}
                      onClick={() =>
                        editBlog &&
                        updateM.mutate({ id: editBlog.id, dto: editForm })
                      }
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {revertBlog && (
            <div
              className="modal d-block"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              tabIndex={-1}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content" style={{ borderRadius: 0 }}>
                  <div className="modal-header">
                    <h5 className="modal-title">Suggest changes</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setRevertBlog(null)}
                    />
                  </div>
                  <div className="modal-body">
                    <textarea
                      className="form-control mb-2"
                      style={{ borderRadius: 0, minHeight: 100 }}
                      placeholder="Feedback for the author…"
                      value={revertNotes}
                      onChange={(e) => setRevertNotes(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-warning"
                      style={{ borderRadius: 0 }}
                      disabled={!revertNotes.trim() || revertM.isPending}
                      onClick={() =>
                        revertBlog &&
                        revertM.mutate({
                          id: revertBlog.id,
                          notes: revertNotes.trim(),
                        })
                      }
                    >
                      Send back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {rejectBlog && (
            <div
              className="modal d-block"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
              tabIndex={-1}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content" style={{ borderRadius: 0 }}>
                  <div className="modal-header">
                    <h5 className="modal-title">Reject blog</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setRejectBlog(null)}
                    />
                  </div>
                  <div className="modal-body">
                    <textarea
                      className="form-control mb-2"
                      style={{ borderRadius: 0, minHeight: 100 }}
                      placeholder="Reason (required)…"
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-danger text-white"
                      style={{ borderRadius: 0 }}
                      disabled={!rejectNotes.trim() || rejectM.isPending}
                      onClick={() =>
                        rejectBlog &&
                        rejectM.mutate({
                          id: rejectBlog.id,
                          notes: rejectNotes.trim(),
                        })
                      }
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
