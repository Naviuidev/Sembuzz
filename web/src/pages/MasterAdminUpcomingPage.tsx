import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MasterAdminLayout } from '../components/MasterAdminLayout';
import { CreatePostLivePreview } from '../components/CreatePostLivePreview';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import {
  masterAdminSchoolsService,
  type MasterAdminSchoolUpcomingRow,
} from '../services/master-admin-schools.service';
import { imageSrc } from '../utils/image';

function formatPostDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatScheduledLabel(iso: string) {
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

function parsePostImages(imageUrls: string | null): string[] {
  if (!imageUrls) return [];
  try {
    const parsed = JSON.parse(imageUrls) as unknown;
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function scheduleTimingPill(scheduledTo: string) {
  const when = startOfDay(new Date(scheduledTo));
  const today = startOfDay(new Date());
  if (Number.isNaN(when.getTime())) {
    return <span className="admin-pill admin-pill--neutral">—</span>;
  }
  if (when.getTime() === today.getTime()) {
    return <span className="admin-pill admin-pill--status-progress">Goes live today</span>;
  }
  if (when > today) {
    return <span className="admin-pill admin-pill--status-pending">Scheduled</span>;
  }
  return <span className="admin-pill admin-pill--status-done">Past schedule</span>;
}

function descriptionExcerpt(text: string | null | undefined, max = 80) {
  const t = text?.trim() ?? '';
  if (!t) return '—';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function MasterAdminUpcomingPage() {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [previewPost, setPreviewPost] = useState<MasterAdminSchoolUpcomingRow | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'web'>('web');

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['master-admin', 'schools'],
    queryFn: () => masterAdminSchoolsService.list(),
  });

  const schoolOptions = useMemo(() => schools.filter((s) => s.isActive), [schools]);
  const selectedSchool = schoolOptions.find((s) => s.id === selectedSchoolId);

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'schools', selectedSchoolId, 'upcoming'],
    queryFn: () => masterAdminSchoolsService.listUpcoming(selectedSchoolId),
    enabled: Boolean(selectedSchoolId),
  });

  const createPostHref = selectedSchoolId
    ? `/master-admin/posts?schoolId=${encodeURIComponent(selectedSchoolId)}`
    : '/master-admin/posts';

  return (
    <MasterAdminLayout>
      <div className="admin-posts-page master-admin-posts-hub">
        <header className="admin-page-header master-admin-posts-page__header" style={panelStyle}>
          <div className="master-admin-posts-page__header-row">
            <div>
              <h1 className="admin-page-title mb-1">Upcoming news</h1>
              <p className="admin-page-subtitle mb-0">
                {selectedSchoolId
                  ? `Scheduled and upcoming posts for ${selectedSchool?.name ?? 'this school'} that are not live yet.`
                  : 'Select a school to view posts waiting to go live.'}
              </p>
            </div>
          </div>
        </header>

        <section className="admin-panel master-admin-posts-school-filter" style={panelStyle}>
          <div className="admin-panel__body">
            <label className="admin-form-label" htmlFor="ma-upcoming-filter-school">
              Select school
            </label>
            <select
              id="ma-upcoming-filter-school"
              className="form-select admin-form-control master-admin-posts-school-filter__select"
              value={selectedSchoolId}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value);
                setPreviewPost(null);
              }}
              disabled={schoolsLoading}
            >
              <option value="">Choose school…</option>
              {schoolOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {selectedSchool ? (
              <p className="admin-form-hint mb-0 mt-2">
                Viewing: <strong>{selectedSchool.name}</strong>
              </p>
            ) : null}
          </div>
        </section>

        {selectedSchoolId ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body admin-panel__body--flush-top">
              <div className="master-admin-ext-config-table-toolbar d-flex justify-content-end mb-0 px-3 pt-3 pb-2">
                <Link to={createPostHref} className="admin-btn-primary">
                  <i className="bi bi-plus-lg me-2" aria-hidden />
                  Create post
                </Link>
              </div>

              <div className="admin-notice admin-notice--info mx-3 mb-3">
                <p className="mb-0 small">
                  Includes calendar upcoming posts (school admin Upcoming news) and feed posts scheduled with a publish
                  time. Items disappear from this list after they go live.
                </p>
              </div>

              {isLoading ? (
                <p className="master-admin-detail-muted mb-0 px-3 pb-3">Loading upcoming news…</p>
              ) : isError ? (
                <p className="master-admin-detail-muted mb-0 px-3 pb-3">Could not load upcoming news.</p>
              ) : items.length === 0 ? (
                <p className="master-admin-detail-muted mb-0 px-3 pb-3">No upcoming news scheduled for this school yet.</p>
              ) : (
                <div className="admin-table-wrap master-admin-school-table-wrap master-admin-school-table-wrap--posts px-3 pb-3">
                  <p className="admin-approved-posts__count mb-3">
                    {items.length} scheduled {items.length === 1 ? 'post' : 'posts'}
                  </p>
                  <table className="admin-table master-admin-school-table master-admin-posts-table">
                    <thead>
                      <tr>
                        <th className="master-admin-posts-table__col-title">Title</th>
                        <th>Category</th>
                        <th>Subcategory</th>
                        <th>Description</th>
                        <th>Images</th>
                        <th>Scheduled for</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row) => {
                        const images = parsePostImages(row.imageUrls);
                        return (
                          <tr key={row.id}>
                            <td className="master-admin-posts-table__col-title">
                              <span className="admin-table__strong">{row.title}</span>
                            </td>
                            <td>{row.category?.name ?? '—'}</td>
                            <td>{row.subCategory?.name ?? '—'}</td>
                            <td className="small text-muted" style={{ maxWidth: 200 }}>
                              {descriptionExcerpt(row.description)}
                            </td>
                            <td>{images.length > 0 ? images.length : '—'}</td>
                            <td className="master-admin-posts-table__published">{formatPostDate(row.scheduledTo)}</td>
                            <td>{scheduleTimingPill(row.scheduledTo)}</td>
                            <td className="master-admin-posts-table__published">{formatPostDate(row.createdAt)}</td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="admin-icon-btn admin-icon-btn--edit"
                                aria-label={`Preview ${row.title}`}
                                onClick={() => {
                                  setPreviewPost(row);
                                  setPreviewMode('web');
                                }}
                              >
                                <i className="bi bi-eye" aria-hidden />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body">
              <p className="master-admin-detail-muted mb-0">Choose a school above to view scheduled upcoming news.</p>
            </div>
          </section>
        )}
      </div>

      {previewPost ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          role="presentation"
          onClick={() => setPreviewPost(null)}
        >
          <div
            className="admin-modal admin-modal--preview-post"
            role="dialog"
            aria-modal
            aria-labelledby="ma-upcoming-preview-title"
            onClick={(e) => e.stopPropagation()}
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
              <h3 className="admin-modal__title" id="ma-upcoming-preview-title">
                Upcoming post preview
              </h3>
              <p className="admin-form-hint mb-1">{previewPost.title}</p>
              <p className="admin-form-hint mb-3">
                Goes live: <strong>{formatPostDate(previewPost.scheduledTo)}</strong>
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
                  schoolName={previewPost.school?.name ?? selectedSchool?.name ?? ''}
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
                  accentColor={ADMIN_PORTAL_ACCENTS.master}
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
    </MasterAdminLayout>
  );
}
