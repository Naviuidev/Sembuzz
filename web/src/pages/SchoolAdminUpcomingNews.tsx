import { useState, useEffect, useRef, type CSSProperties, type FormEvent } from 'react';
import { SchoolAdminLayout } from '../components/SchoolAdminLayout';
import { CreatePostLivePreview } from '../components/CreatePostLivePreview';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import { publicEventsService, type CategoryPublic } from '../services/public-events.service';
import {
  schoolAdminUpcomingPostsService,
  type UpcomingPostItem,
} from '../services/school-admin-upcoming-posts.service';
import { imageSrc } from '../utils/image';
import { getApiErrorMessage } from '../utils/apiError';

const MAX_IMAGES = 4;
const TITLE_MAX = 500;

function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parsePostImages(imageUrls: string | null): string[] {
  if (!imageUrls) return [];
  try {
    const parsed = JSON.parse(imageUrls);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

function formatScheduledLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

type SchedulePreset = 'today' | 'tomorrow' | 'dayAfter' | 'custom';

const SCHEDULE_PRESETS: { id: SchedulePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'dayAfter', label: 'Day after tomorrow' },
  { id: 'custom', label: 'Custom date' },
];

export const SchoolAdminUpcomingNews = () => {
  const { user } = useSchoolAdminAuth();
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.school } as CSSProperties;
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [scheduledToPreset, setScheduledToPreset] = useState<SchedulePreset>('tomorrow');
  const [customScheduledTo, setCustomScheduledTo] = useState(() => formatDateOnly(new Date()));
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(() => new Date().getMonth() + 1);
  const [pickerDay, setPickerDay] = useState(() => new Date().getDate());

  const [previewPost, setPreviewPost] = useState<UpcomingPostItem | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'web'>('mobile');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.schoolId) return;
    publicEventsService.getCategoriesBySchool(user.schoolId).then(setCategories).catch(() => setCategories([]));
  }, [user?.schoolId]);

  useEffect(() => {
    if (categories.length && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

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
    return customScheduledTo && /^\d{4}-\d{2}-\d{2}$/.test(customScheduledTo)
      ? customScheduledTo
      : formatDateOnly(d);
  };

  const scheduledSummary = formatScheduledLabel(getScheduledTo() + 'T12:00:00');

  const handleSubmit = async (e: FormEvent) => {
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
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to create upcoming post.'));
    } finally {
      setPosting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || imageUrls.length >= MAX_IMAGES) return;
    setUploadingImage(true);
    setError(null);
    try {
      const { url } = await schoolAdminUpcomingPostsService.uploadImage(file);
      setImageUrls((prev) => [...prev, url].slice(0, MAX_IMAGES));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to upload image.'));
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setError(null);
    try {
      await schoolAdminUpcomingPostsService.delete(deleteId);
      setPosts((prev) => prev.filter((p) => p.id !== deleteId));
      if (previewPost?.id === deleteId) setPreviewPost(null);
      setDeleteId(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to delete.'));
    } finally {
      setDeleting(false);
    }
  };

  const applyCustomDate = () => {
    const dd = String(pickerDay).padStart(2, '0');
    const mm = String(pickerMonth).padStart(2, '0');
    setCustomScheduledTo(`${pickerYear}-${mm}-${dd}`);
  };

  const maxPickerDay = daysInMonth(pickerYear, pickerMonth);
  const dayOptions = Array.from({ length: maxPickerDay }, (_, i) => i + 1);

  const livePreviewCategory = selectedCategory?.name ?? '';
  const livePreviewSub = subcategories.find((s) => s.id === subCategoryId)?.name ?? '';

  return (
    <SchoolAdminLayout>
      <div className="admin-upcoming-news-page">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">Upcoming news</h1>
          <p className="admin-page-subtitle">
            Schedule posts to appear on the public feed on the date you choose. No approval required.
          </p>
        </header>

        {error ? (
          <div className="admin-notice mb-3">
            <p className="admin-form-hint admin-form-hint--error mb-0">{error}</p>
          </div>
        ) : null}

        <div className="admin-upcoming-news-layout">
          <section className="admin-panel admin-upcoming-news-compose" style={panelStyle}>
            <div className="admin-panel__body">
              <h2 className="admin-panel__title">Create upcoming post</h2>
              <p className="admin-form-hint mb-3">
                Publishing on: <strong>{scheduledSummary}</strong>
              </p>

              <form className="admin-upcoming-news-form" onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="admin-form-label" htmlFor="upcoming-title">Title</label>
                  <input
                    id="upcoming-title"
                    type="text"
                    className="form-control admin-form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                    placeholder="Post title"
                    maxLength={TITLE_MAX}
                    required
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="admin-form-label" htmlFor="upcoming-category">Category</label>
                    <select
                      id="upcoming-category"
                      className="form-select admin-form-control"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="admin-form-label" htmlFor="upcoming-subcategory">Subcategory</label>
                    <select
                      id="upcoming-subcategory"
                      className="form-select admin-form-control"
                      value={subCategoryId}
                      onChange={(e) => setSubCategoryId(e.target.value)}
                      disabled={!subcategories.length}
                      required
                    >
                      {subcategories.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="admin-form-label" htmlFor="upcoming-description">Description</label>
                  <textarea
                    id="upcoming-description"
                    className="form-control admin-form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description for students"
                    rows={4}
                  />
                </div>

                <div className="mb-3">
                  <label className="admin-form-label">Scheduled to</label>
                  <div className="admin-dashboard-badges admin-upcoming-news-schedule-badges">
                    {SCHEDULE_PRESETS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        className={`admin-dashboard-badge${scheduledToPreset === id ? ' is-active' : ''}`}
                        onClick={() => setScheduledToPreset(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {scheduledToPreset === 'custom' ? (
                    <div className="admin-upcoming-news-date-picker mt-3">
                      <p className="admin-form-label mb-2">Pick a date</p>
                      <div className="admin-upcoming-news-date-picker__row">
                        <select
                          className="form-select admin-form-control"
                          value={pickerMonth}
                          onChange={(e) => setPickerMonth(Number(e.target.value))}
                          aria-label="Month"
                        >
                          {MONTHS.map((name, i) => (
                            <option key={name} value={i + 1}>{name}</option>
                          ))}
                        </select>
                        <select
                          className="form-select admin-form-control"
                          value={pickerDay}
                          onChange={(e) => setPickerDay(Number(e.target.value))}
                          aria-label="Day"
                        >
                          {dayOptions.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <select
                          className="form-select admin-form-control"
                          value={pickerYear}
                          onChange={(e) => setPickerYear(Number(e.target.value))}
                          aria-label="Year"
                        >
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={applyCustomDate}>
                          Apply
                        </button>
                      </div>
                      <p className="admin-form-hint mt-2 mb-0">
                        Selected: {formatScheduledLabel(customScheduledTo + 'T12:00:00')}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mb-4">
                  <label className="admin-form-label">Images (up to {MAX_IMAGES})</label>
                  <div className="admin-create-post-upload-zone">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="admin-create-post-file-input"
                      tabIndex={-1}
                      aria-hidden
                      disabled={uploadingImage || imageUrls.length >= MAX_IMAGES}
                      onChange={handleImageUpload}
                    />
                    <button
                      type="button"
                      className="admin-btn-secondary admin-btn-sm"
                      disabled={uploadingImage || imageUrls.length >= MAX_IMAGES}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingImage ? 'Uploading…' : 'Choose images'}
                    </button>
                    {imageUrls.length > 0 ? (
                      <div className="admin-create-post-upload-thumbs">
                        {imageUrls.map((url, i) => (
                          <div key={url} className="position-relative">
                            <img src={imageSrc(url)} alt="" width={72} height={72} loading="lazy" />
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--danger position-absolute top-0 end-0"
                              style={{ transform: 'translate(25%, -25%)' }}
                              aria-label="Remove image"
                              onClick={() => removeImage(i)}
                            >
                              <i className="bi bi-x" aria-hidden />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={posting || !title.trim() || !categoryId || !subCategoryId}
                >
                  {posting ? 'Creating…' : 'Create upcoming post'}
                </button>
              </form>
            </div>
          </section>

          <aside className="admin-upcoming-news-preview-col">
            <div className="admin-create-post-preview-card">
              <h2 className="admin-panel__title mb-2" style={{ fontSize: '1rem' }}>Live preview</h2>
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
              <CreatePostLivePreview
                title={title}
                description={description}
                categoryName={livePreviewCategory}
                subCategoryName={livePreviewSub}
                schoolName={user?.schoolName || user?.schoolDomain || 'Your school'}
                eventDate=""
                eventStartTime=""
                eventEndTime=""
                eventLocation=""
                actionButtons={[]}
                coverSrc={imageUrls[0] ? imageSrc(imageUrls[0]) : ''}
                previewMode={previewMode}
                accentColor={ADMIN_PORTAL_ACCENTS.school}
                commentsEnabled={false}
              />
            </div>
          </aside>
        </div>

        <section className="admin-panel admin-upcoming-news-list" style={panelStyle}>
          <div className="admin-panel__body">
            <h2 className="admin-panel__title">Scheduled posts</h2>
            <div className="admin-notice admin-notice--info mb-3">
              <p className="mb-0 small">
                Scheduled posts cannot be edited. To make changes, delete the post and create a new one.
              </p>
            </div>

            {loading ? (
              <div className="admin-loading-state">
                <div className="spinner-border text-secondary" role="status" />
                <p className="mt-2 mb-0">Loading scheduled posts…</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="admin-empty-state">
                <i className="bi bi-calendar-event" style={{ fontSize: '2.5rem', opacity: 0.45 }} aria-hidden />
                <p className="mt-3 mb-0">No upcoming posts yet.</p>
                <p className="small mb-0">Create one using the form above.</p>
              </div>
            ) : (
              <>
                <p className="admin-approved-posts__count mb-3">
                  {posts.length} scheduled {posts.length === 1 ? 'post' : 'posts'}
                </p>
                <div className="admin-table-wrap">
                  <table className="admin-table admin-upcoming-news__table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category / Subcategory</th>
                        <th>Scheduled to</th>
                        <th className="admin-approved-posts__actions-col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((p) => {
                        const cat = [p.category?.name, p.subCategory?.name].filter(Boolean).join(' / ');
                        return (
                          <tr key={p.id}>
                            <td>
                              <span className="admin-table__strong">{p.title}</span>
                            </td>
                            <td>{cat || '—'}</td>
                            <td>{formatScheduledLabel(p.scheduledTo)}</td>
                            <td>
                              <div className="admin-table-actions admin-approved-posts__row-actions">
                                <button
                                  type="button"
                                  className="admin-icon-btn"
                                  aria-label={`Preview ${p.title}`}
                                  onClick={() => {
                                    setPreviewPost(p);
                                    setPreviewMode('mobile');
                                  }}
                                >
                                  <i className="bi bi-eye" aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  className="admin-icon-btn admin-icon-btn--danger"
                                  aria-label={`Delete ${p.title}`}
                                  onClick={() => setDeleteId(p.id)}
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
              </>
            )}
          </div>
        </section>
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
            aria-labelledby="upcoming-preview-title"
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
              <h3 className="admin-modal__title" id="upcoming-preview-title">Post preview</h3>
              <p className="admin-form-hint mb-1">{previewPost.title}</p>
              <p className="admin-form-hint mb-3">
                Goes live: {formatScheduledLabel(previewPost.scheduledTo)}
              </p>
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
                  categoryName={previewPost.category?.name ?? ''}
                  subCategoryName={previewPost.subCategory?.name ?? ''}
                  schoolName={user?.schoolName || previewPost.school?.name || 'Your school'}
                  schoolLogoUrl={previewPost.school?.image ?? null}
                  eventDate=""
                  eventStartTime=""
                  eventEndTime=""
                  eventLocation=""
                  actionButtons={[]}
                  coverSrc={
                    parsePostImages(previewPost.imageUrls)[0]
                      ? imageSrc(parsePostImages(previewPost.imageUrls)[0])
                      : ''
                  }
                  previewMode={previewMode}
                  accentColor={ADMIN_PORTAL_ACCENTS.school}
                  commentsEnabled={false}
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

      {deleteId ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          onClick={() => !deleting && setDeleteId(null)}
          role="presentation"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal__body">
              <h3 className="admin-modal__title">Delete scheduled post?</h3>
              <p className="admin-modal__text">This cannot be undone. The post will not appear on the feed.</p>
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
    </SchoolAdminLayout>
  );
};
