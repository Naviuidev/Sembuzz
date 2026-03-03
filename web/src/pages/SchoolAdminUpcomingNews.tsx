import { useState, useEffect } from 'react';
import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import { publicEventsService, type CategoryPublic } from '../services/public-events.service';
import {
  schoolAdminUpcomingPostsService,
  type UpcomingPostItem,
} from '../services/school-admin-upcoming-posts.service';
import { imageSrc } from '../utils/image';

const MAX_IMAGES = 4;

function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Number of days in a month (1–12) for a given year (handles leap years). */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const SchoolAdminUpcomingNews = () => {
  const { user } = useSchoolAdminAuth();
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [posts, setPosts] = useState<UpcomingPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [scheduledToPreset, setScheduledToPreset] = useState<'today' | 'tomorrow' | 'dayAfter' | 'custom'>('tomorrow');
  const [customScheduledTo, setCustomScheduledTo] = useState(() => formatDateOnly(new Date()));
  // Custom date picker: month/day/year dropdowns; OK applies selection to customScheduledTo
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(() => new Date().getMonth() + 1);
  const [pickerDay, setPickerDay] = useState(() => new Date().getDate());
  const [viewingPost, setViewingPost] = useState<UpcomingPostItem | null>(null);

  useEffect(() => {
    if (!user?.schoolId) return;
    publicEventsService.getCategoriesBySchool(user.schoolId).then(setCategories).catch(() => setCategories([]));
  }, [user?.schoolId]);

  useEffect(() => {
    schoolAdminUpcomingPostsService
      .list()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subcategories = selectedCategory?.subcategories ?? [];

  useEffect(() => {
    if (!subcategories.some((s) => s.id === subCategoryId)) {
      setSubCategoryId(subcategories[0]?.id ?? '');
    }
  }, [categoryId, subcategories, subCategoryId]);

  // When switching to Custom, sync picker from current customScheduledTo (so Feb etc. works)
  useEffect(() => {
    if (scheduledToPreset !== 'custom') return;
    const match = customScheduledTo && /^(\d{4})-(\d{2})-(\d{2})$/.exec(customScheduledTo);
    if (match) {
      const y = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const d = parseInt(match[3], 10);
      const maxDay = daysInMonth(y, m);
      setPickerYear(y);
      setPickerMonth(m);
      setPickerDay(d <= maxDay ? d : maxDay);
    }
  }, [scheduledToPreset, customScheduledTo]);

  // Keep day valid when month/year change (e.g. March 31 → February → clamp to 28/29)
  useEffect(() => {
    if (scheduledToPreset !== 'custom') return;
    const maxDay = daysInMonth(pickerYear, pickerMonth);
    setPickerDay((d) => (d > maxDay ? maxDay : d < 1 ? 1 : d));
  }, [scheduledToPreset, pickerYear, pickerMonth]);

  const getScheduledTo = (): string => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (scheduledToPreset === 'today') return formatDateOnly(d);
    if (scheduledToPreset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      return formatDateOnly(d);
    }
    if (scheduledToPreset === 'dayAfter') {
      d.setDate(d.getDate() + 2);
      return formatDateOnly(d);
    }
    // Ensure ISO 8601 date (YYYY-MM-DD) for API validation
    return customScheduledTo && /^\d{4}-\d{2}-\d{2}$/.test(customScheduledTo) ? customScheduledTo : formatDateOnly(d);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId || !subCategoryId) {
      setError('Please fill title, category and subcategory.');
      return;
    }
    setPosting(true);
    setError(null);
    try {
      const created = await schoolAdminUpcomingPostsService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId,
        subCategoryId,
        imageUrls: imageUrls.length ? imageUrls : undefined,
        scheduledTo: getScheduledTo(),
      });
      setPosts((prev) => [created, ...prev]);
      setTitle('');
      setDescription('');
      setImageUrls([]);
      setError(null);
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: unknown } }).response : null;
      const data = res?.data;
      let msg: string | null = null;
      if (data && typeof data === 'object' && 'message' in data) {
        const m = (data as { message?: unknown }).message;
        msg = Array.isArray(m) ? (m as string[]).join('. ') : (typeof m === 'string' ? m : null);
      }
      setError(msg ?? 'Failed to create upcoming post.');
    } finally {
      setPosting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || imageUrls.length >= MAX_IMAGES) return;
    setUploadingImage(true);
    try {
      const { url } = await schoolAdminUpcomingPostsService.uploadImage(file);
      setImageUrls((prev) => [...prev, url].slice(0, MAX_IMAGES));
    } catch {
      setError('Failed to upload image.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this upcoming post?')) return;
    try {
      await schoolAdminUpcomingPostsService.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('Failed to delete.');
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
              Upcoming news
            </h1>
            <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: 0 }}>
              Create posts that will appear on the public feed on the date you choose. No approval needed.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger mb-4" style={{ borderRadius: 0 }} role="alert">
              {error}
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setError(null)} />
            </div>
          )}

          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 0 }}>
            <div className="card-body p-4">
              <h2 className="h5 mb-3" style={{ color: '#1a1f2e' }}>Create upcoming post</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Post title"
                    maxLength={500}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={3}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Subcategory</label>
                  <select
                    className="form-select"
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(e.target.value)}
                    disabled={!subcategories.length}
                  >
                    <option value="">Select subcategory</option>
                    {subcategories.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Images (up to {MAX_IMAGES})</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    disabled={uploadingImage || imageUrls.length >= MAX_IMAGES}
                    onChange={handleImageUpload}
                  />
                  {uploadingImage && <small className="text-muted">Uploading…</small>}
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="position-relative">
                        <img src={imageSrc(url)} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                        <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0" style={{ padding: '0.1rem 0.35rem' }} onClick={() => removeImage(i)} aria-label="Remove">×</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label">Scheduled to <span className="text-danger">*</span></label>
                  <div className="d-flex flex-wrap gap-3 align-items-center">
                    <label className="d-flex align-items-center gap-1">
                      <input type="radio" name="scheduledToPreset" checked={scheduledToPreset === 'today'} onChange={() => setScheduledToPreset('today')} />
                      <span>Today</span>
                    </label>
                    <label className="d-flex align-items-center gap-1">
                      <input type="radio" name="scheduledToPreset" checked={scheduledToPreset === 'tomorrow'} onChange={() => setScheduledToPreset('tomorrow')} />
                      <span>Tomorrow</span>
                    </label>
                    <label className="d-flex align-items-center gap-1">
                      <input type="radio" name="scheduledToPreset" checked={scheduledToPreset === 'dayAfter'} onChange={() => setScheduledToPreset('dayAfter')} />
                      <span>Day after tomorrow</span>
                    </label>
                    <label className="d-flex align-items-center gap-1">
                      <input type="radio" name="scheduledToPreset" checked={scheduledToPreset === 'custom'} onChange={() => setScheduledToPreset('custom')} />
                      <span>Custom</span>
                    </label>
                    {scheduledToPreset === 'custom' && (() => {
                      const maxDay = daysInMonth(pickerYear, pickerMonth);
                      const dayOptions = Array.from({ length: maxDay }, (_, i) => i + 1);
                      return (
                        <div className="w-100 mt-2 p-3 rounded border" style={{ backgroundColor: '#f8f9fa', borderColor: '#dee2e6' }}>
                          <div className="mb-2 small fw-medium text-secondary">Pick a date</div>
                          <div className="d-flex flex-row align-items-center gap-2 flex-nowrap" style={{ flexWrap: 'nowrap' }}>
                            <select
                              className="form-select"
                              style={{ width: 140, flexShrink: 0 }}
                              value={pickerMonth}
                              onChange={(e) => setPickerMonth(Number(e.target.value))}
                            >
                              {MONTHS.map((name, i) => (
                                <option key={name} value={i + 1}>{name}</option>
                              ))}
                            </select>
                            <select
                              className="form-select"
                              style={{ width: 80, flexShrink: 0 }}
                              value={pickerDay}
                              onChange={(e) => setPickerDay(Number(e.target.value))}
                            >
                              {dayOptions.map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                            <select
                              className="form-select"
                              style={{ width: 100, flexShrink: 0 }}
                              value={pickerYear}
                              onChange={(e) => setPickerYear(Number(e.target.value))}
                            >
                              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ flexShrink: 0 }}
                              onClick={() => {
                                const dd = String(pickerDay).padStart(2, '0');
                                const mm = String(pickerMonth).padStart(2, '0');
                                setCustomScheduledTo(`${pickerYear}-${mm}-${dd}`);
                              }}
                            >
                              OK
                            </button>
                          </div>
                          <div className="small text-muted mt-2">
                            {customScheduledTo && /^\d{4}-\d{2}-\d{2}$/.test(customScheduledTo)
                              ? `Selected: ${new Date(customScheduledTo + 'T12:00:00').toLocaleDateString()} — used when you click "Create upcoming post".`
                              : 'Choose month, day and year, then click OK.'}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={posting || !title.trim() || !categoryId || !subCategoryId}>
                  {posting ? 'Posting…' : 'Create upcoming post'}
                </button>
              </form>
            </div>
          </div>

          <div className="card border-0 shadow-sm" style={{ borderRadius: 0 }}>
            <div className="card-body p-4">
              <h2 className="h5 mb-2" style={{ color: '#1a1f2e' }}>Scheduled posts</h2>
              <p className="small mb-3" style={{ borderLeft: '3px solid #ffc107', backgroundColor: '#fffbf0', padding: '0.5rem 0.75rem', borderRadius: 4, color: '#856404' }}>
                <strong>Note:</strong> The created future news cannot be edited. If you need any corrections, delete and create the news again.
              </p>
              {loading ? (
                <p className="text-muted mb-0">Loading…</p>
              ) : posts.length === 0 ? (
                <p className="text-muted mb-0">No upcoming posts yet. Create one above.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ borderColor: '#eee' }}>
                    <thead style={{ backgroundColor: '#f8f9fa', color: '#1a1f2e' }}>
                      <tr>
                        <th>Title</th>
                        <th>From which category</th>
                        <th>From which subcategory</th>
                        <th>Scheduled to</th>
                        <th className="text-end">View</th>
                        <th className="text-end">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600, color: '#1a1f2e', maxWidth: 220 }}>{p.title}</td>
                          <td>{p.category?.name ?? '—'}</td>
                          <td>{p.subCategory?.name ?? '—'}</td>
                          <td>{new Date(p.scheduledTo).toLocaleDateString()}</td>
                          <td className="text-end">
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setViewingPost(p)}>View</button>
                          </td>
                          <td className="text-end">
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {viewingPost && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1} role="dialog">
              <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content" style={{ borderRadius: 0 }}>
                  <div className="modal-header">
                    <h5 className="modal-title" style={{ color: '#1a1f2e' }}>{viewingPost.title}</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setViewingPost(null)} />
                  </div>
                  <div className="modal-body">
                    <p className="small text-muted mb-2">
                      <strong>Category:</strong> {viewingPost.category?.name ?? '—'} · <strong>Subcategory:</strong> {viewingPost.subCategory?.name ?? '—'}
                    </p>
                    <p className="small text-muted mb-3">
                      <strong>Scheduled to:</strong> {new Date(viewingPost.scheduledTo).toLocaleDateString()}
                    </p>
                    {viewingPost.description && <p className="mb-3" style={{ color: '#333' }}>{viewingPost.description}</p>}
                    {viewingPost.imageUrls && (() => {
                      try {
                        const urls = JSON.parse(viewingPost.imageUrls) as string[];
                        if (Array.isArray(urls) && urls.length > 0) {
                          return (
                            <div className="d-flex flex-wrap gap-2">
                              {urls.map((url, i) => (
                                <img key={i} src={imageSrc(url)} alt="" style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />
                              ))}
                            </div>
                          );
                        }
                      } catch { /* ignore */ }
                      return null;
                    })()}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setViewingPost(null)}>Close</button>
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
