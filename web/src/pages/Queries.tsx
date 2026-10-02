import { useState, useMemo, type CSSProperties, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SuperAdminLayout } from '../components/SuperAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { StatusPopup } from '../components/StatusPopup';
import { supportService, type SuperAdminQuery } from '../services/support.service';
import { schoolsService, type School } from '../services/schools.service';
import { invalidateAdminActionItems } from '../services/admin-action-items.service';

type QuerySource = 'school' | 'category' | 'subcategory' | 'super_admin';

function AdminSearchField({
  value,
  onChange,
  placeholder,
  wide,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  wide?: boolean;
}) {
  return (
    <div className={`admin-search-wrap${wide ? ' admin-search-wrap--wide' : ''}`}>
      <i className="bi bi-search admin-search-icon" aria-hidden />
      <input
        type="search"
        className="form-control admin-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function QueryPickerCard({ onClick, title, meta }: { onClick: () => void; title: string; meta?: ReactNode }) {
  return (
    <button type="button" className="admin-picker-card" onClick={onClick}>
      <p className="admin-picker-card__title">{title}</p>
      {meta ? <p className="admin-picker-card__meta">{meta}</p> : null}
    </button>
  );
}

function StepHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="admin-step-header">
      <h2 className="admin-panel__title">{title}</h2>
      <button type="button" className="admin-btn-secondary" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

interface QueryRow {
  id: string;
  type: string;
  meetingType?: string;
  meetingDate?: string;
  timeZone?: string;
  timeSlot?: string;
  description?: string;
  customMessage?: string;
  attachmentUrl?: string | null;
  status: string;
  createdAt: string;
  schoolAdmin?: { name?: string; email?: string; school?: { id?: string; name?: string; refNum?: string } };
  categoryAdmin?: { name?: string; email?: string; school?: { id?: string; name?: string }; category?: { name: string } };
  subCategoryAdmin?: { name?: string; email?: string; school?: { id?: string; name?: string }; category?: { name: string }; subCategory?: { name: string } };
  superAdmin?: { id?: string; name?: string; email?: string };
  [k: string]: unknown;
}

function getSchoolIdFromRow(row: QueryRow, source: QuerySource): string | undefined {
  let id: string | undefined;
  if (source === 'school') id = row.schoolAdmin?.school?.id;
  else if (source === 'category') id = row.categoryAdmin?.school?.id;
  else if (source === 'subcategory') id = row.subCategoryAdmin?.school?.id;
  else id = undefined;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}

export const Queries = () => {
  const queryClient = useQueryClient();
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [source, setSource] = useState<QuerySource | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateSearchQuery, setDateSearchQuery] = useState('');
  const [showReplyPopup, setShowReplyPopup] = useState(false);
  const [selectedQueryForReply, setSelectedQueryForReply] = useState<SuperAdminQuery | null>(null);
  const [replySource, setReplySource] = useState<QuerySource | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [popupShow, setPopupShow] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState('');
  const [viewQuery, setViewQuery] = useState<QueryRow | null>(null);
  const [pendingDeletePopup, setPendingDeletePopup] = useState(false);
  const [deleteConfirmQuery, setDeleteConfirmQuery] = useState<QueryRow | null>(null);
  const [deleteSource, setDeleteSource] = useState<QuerySource | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: schools = [], isLoading: loadingSchools } = useQuery<School[]>({
    queryKey: ['schools'],
    queryFn: schoolsService.getAll,
  });

  const { data: raisedQueries, isLoading: isLoadingRaised } = useQuery<SuperAdminQuery[]>({
    queryKey: ['queries', 'raised'],
    queryFn: () => supportService.getQueries(),
  });
  const { data: fromSchool = [], isLoading: loadingSchool } = useQuery<QueryRow[]>({
    queryKey: ['queries', 'from-school'],
    queryFn: () => supportService.getQueriesFromSchoolAdmins(),
  });
  const { data: fromCategory = [], isLoading: loadingCategory } = useQuery<QueryRow[]>({
    queryKey: ['queries', 'from-category'],
    queryFn: () => supportService.getQueriesFromCategoryAdmins(),
  });
  const { data: fromSubcategory = [], isLoading: loadingSubcategory } = useQuery<QueryRow[]>({
    queryKey: ['queries', 'from-subcategory'],
    queryFn: () => supportService.getQueriesFromSubcategoryAdmins(),
  });

  const filteredSchools = useMemo(() => {
    if (!schoolSearchQuery.trim()) return schools;
    const q = schoolSearchQuery.toLowerCase();
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.refNum && s.refNum.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)),
    );
  }, [schools, schoolSearchQuery]);

  const bySchool = useMemo(() => {
    // Only include rows that belong to the selected school (strict: must have matching school id)
    const schoolFilter = (row: QueryRow, src: QuerySource) => {
      if (!selectedSchoolId) return false;
      const rowSchoolId = getSchoolIdFromRow(row, src);
      return rowSchoolId !== undefined && rowSchoolId === selectedSchoolId;
    };
    return {
      school: selectedSchoolId ? fromSchool.filter((r) => schoolFilter(r, 'school')) : [],
      category: selectedSchoolId ? fromCategory.filter((r) => schoolFilter(r, 'category')) : [],
      subcategory: selectedSchoolId ? fromSubcategory.filter((r) => schoolFilter(r, 'subcategory')) : [],
    };
  }, [fromSchool, fromCategory, fromSubcategory, selectedSchoolId]);

  const groupByDate = (list: QueryRow[]) => {
    const grouped: Record<string, QueryRow[]> = {};
    list.forEach((q) => {
      const key = new Date(q.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(q);
    });
    return grouped;
  };

  const raisedQueriesByDate = useMemo(
    () => groupByDate((raisedQueries ?? []) as unknown as QueryRow[]),
    [raisedQueries],
  );
  const schoolByDate = useMemo(() => groupByDate(bySchool.school), [bySchool.school]);
  const categoryByDate = useMemo(() => groupByDate(bySchool.category), [bySchool.category]);
  const subcategoryByDate = useMemo(() => groupByDate(bySchool.subcategory), [bySchool.subcategory]);

  const currentByDate =
    source === 'super_admin'
      ? raisedQueriesByDate
      : source === 'school'
        ? schoolByDate
        : source === 'category'
          ? categoryByDate
          : subcategoryByDate;

  const filteredDates = useMemo(() => {
    const dates = Object.keys(currentByDate);
    if (!dateSearchQuery) return dates;
    return dates.filter((d) => d.toLowerCase().includes(dateSearchQuery.toLowerCase()));
  }, [currentByDate, dateSearchQuery]);

  const replyMutation = useMutation({
    mutationFn: async ({
      queryId,
      message,
      replySource: src,
    }: {
      queryId: string;
      message: string;
      replySource: QuerySource;
    }) => {
      if (src === 'super_admin') return supportService.sendReply(queryId, message);
      if (src === 'school') return supportService.replyToSchoolAdmin(queryId, message);
      if (src === 'category') return supportService.replyToCategoryAdmin(queryId, message);
      return supportService.replyToSubcategoryAdmin(queryId, message);
    },
    onSuccess: (_, { replySource: src }) => {
      setPopupType('success');
      setPopupMessage('Reply sent successfully!');
      setPopupShow(true);
      setShowReplyPopup(false);
      setReplyMessage('');
      setSelectedQueryForReply(null);
      setReplySource(null);
      queryClient.invalidateQueries({ queryKey: ['queries'] });
      if (src === 'super_admin') queryClient.invalidateQueries({ queryKey: ['queries', 'raised'] });
      if (src === 'school') queryClient.invalidateQueries({ queryKey: ['queries', 'from-school'] });
      if (src === 'category') queryClient.invalidateQueries({ queryKey: ['queries', 'from-category'] });
      if (src === 'subcategory') queryClient.invalidateQueries({ queryKey: ['queries', 'from-subcategory'] });
      void invalidateAdminActionItems(queryClient, 'super-admin');
    },
    onError: (error: unknown) => {
      setPopupType('error');
      setPopupMessage(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to send reply',
      );
      setPopupShow(true);
    },
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      dev_support: 'Dev Support Help',
      features_not_working: 'Features Not Working',
      schedule_meeting: 'Schedule a Meeting',
      raise_issue: 'Raise an Issue',
      integrate_feature: 'Integrate New Feature',
      ui_change: 'UI Change Request',
      upscale_platform: 'Upscale Platform',
      custom_message: 'Custom Message',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const pillClass: Record<string, string> = {
      pending: 'admin-pill--status-pending',
      in_progress: 'admin-pill--status-progress',
      resolved: 'admin-pill--status-done',
      responded: 'admin-pill--status-done',
    };
    const label = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    return <span className={`admin-pill ${pillClass[status] ?? 'admin-pill--status-pending'}`}>{label}</span>;
  };

  const handleDeleteClick = (query: QueryRow, currentSource: QuerySource) => {
    if (query.status !== 'responded') {
      setPendingDeletePopup(true);
      return;
    }
    setDeleteConfirmQuery(query);
    setDeleteSource(currentSource);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmQuery || !deleteSource) return;
    setDeleting(true);
    try {
      if (deleteSource === 'super_admin') {
        await supportService.deleteSuperAdminQuery(deleteConfirmQuery.id);
        queryClient.invalidateQueries({ queryKey: ['queries', 'raised'] });
      } else if (deleteSource === 'school') {
        await supportService.deleteFromSchoolAdmins(deleteConfirmQuery.id);
        queryClient.invalidateQueries({ queryKey: ['queries', 'from-school'] });
      } else if (deleteSource === 'category') {
        await supportService.deleteFromCategoryAdmins(deleteConfirmQuery.id);
        queryClient.invalidateQueries({ queryKey: ['queries', 'from-category'] });
      } else {
        await supportService.deleteFromSubcategoryAdmins(deleteConfirmQuery.id);
        queryClient.invalidateQueries({ queryKey: ['queries', 'from-subcategory'] });
      }
      setDeleteConfirmQuery(null);
      setDeleteSource(null);
    } catch (err) {
      setPopupType('error');
      setPopupMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete.');
      setPopupShow(true);
    } finally {
      setDeleting(false);
    }
  };

  const renderQueriesTable = (queries: QueryRow[], showReply: boolean, currentSource: QuerySource) => (
    <section className="admin-panel mt-3" style={{ '--admin-accent': ADMIN_PORTAL_ACCENTS.super } as CSSProperties}>
      <div className="admin-panel__body admin-panel__body--flush-top p-0">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Received from</th>
                <th scope="col">Type</th>
                <th scope="col">Details</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((query) => (
                <tr key={query.id}>
                  <td className="admin-table__strong text-nowrap">
                    {currentSource === 'school' && 'School Admin'}
                    {currentSource === 'category' && 'Category Admin'}
                    {currentSource === 'subcategory' && 'Subcategory Admin'}
                    {currentSource === 'super_admin' && 'Super Admin → Developer'}
                  </td>
                  <td>{getTypeLabel(query.type)}</td>
                  <td>
                    {query.type === 'schedule_meeting' ? (
                      <div className="admin-table__details">
                        <div>
                          <strong>Meeting:</strong>{' '}
                          {query.meetingType === 'google_meet' ? 'Google Meet' : 'Zoom'}
                        </div>
                        {query.timeZone ? (
                          <div>
                            <strong>Timezone:</strong> {query.timeZone}
                          </div>
                        ) : null}
                        {query.timeSlot ? (
                          <div>
                            <strong>Time:</strong> {query.timeSlot}
                          </div>
                        ) : null}
                        {query.meetingDate ? (
                          <div>
                            <strong>Date:</strong> {new Date(query.meetingDate).toLocaleDateString()}
                          </div>
                        ) : null}
                        {query.description ? <div className="mt-1">{query.description}</div> : null}
                      </div>
                    ) : (
                      <div className="admin-table__details">
                        {query.description || query.customMessage || 'No description'}
                      </div>
                    )}
                  </td>
                  <td>{getStatusBadge(query.status)}</td>
                  <td>{new Date(query.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        type="button"
                        onClick={() => setViewQuery(query)}
                        className="admin-icon-btn admin-icon-btn--edit"
                        title="View details"
                        aria-label="View details"
                      >
                        <i className="bi bi-eye" aria-hidden />
                      </button>
                      {showReply && query.status !== 'responded' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedQueryForReply(query as unknown as SuperAdminQuery);
                            setReplySource(currentSource);
                            setShowReplyPopup(true);
                            setReplyMessage('');
                          }}
                          className="admin-btn-primary admin-btn-sm"
                        >
                          Reply
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(query, currentSource)}
                        className="admin-icon-btn admin-icon-btn--danger"
                        title="Delete"
                        aria-label="Delete query"
                      >
                        <i className="bi bi-trash" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );

  const selectedSchool = useMemo(
    () => (selectedSchoolId ? schools.find((s) => s.id === selectedSchoolId) : null),
    [schools, selectedSchoolId],
  );
  const loading =
    (source === 'super_admin' && isLoadingRaised) ||
    (source === 'school' && loadingSchool) ||
    (source === 'category' && loadingCategory) ||
    (source === 'subcategory' && loadingSubcategory);

  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.super } as CSSProperties;

  return (
    <SuperAdminLayout>
      <header className="admin-page-header">
        <h1 className="admin-page-title">Queries & help requests</h1>
        <p className="admin-page-subtitle">
          Pick a school to browse admin queries, or open Super Admin → Developer (all schools).
        </p>
      </header>

      <section className="admin-panel" style={panelStyle}>
        <div className="admin-panel__body">
          {selectedSchoolId === null && source === null && selectedDate === null && (
            <>
              <div className="mb-4">
                <AdminSearchField
                  value={schoolSearchQuery}
                  onChange={setSchoolSearchQuery}
                  placeholder="Search schools by name, ref, or city…"
                />
              </div>
              {loadingSchools ? (
                <div className="admin-loading-state">Loading schools…</div>
              ) : filteredSchools.length > 0 ? (
                <>
                  <div className="row g-3">
                    {filteredSchools.map((school) => (
                      <div key={school.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                        <QueryPickerCard
                          title={school.name}
                          meta={
                            <>
                              {school.refNum ? `Ref: ${school.refNum}` : null}
                              {school.refNum && school.city ? ' · ' : null}
                              {school.city ?? null}
                            </>
                          }
                          onClick={() => {
                            setSelectedSchoolId(school.id);
                            setSource(null);
                            setSelectedDate(null);
                            setDateSearchQuery('');
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="admin-queries-divider">
                    <p className="admin-form-section-lead mb-3">Not tied to a school</p>
                    <div className="row g-3">
                      <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                        <QueryPickerCard
                          title="Super Admin → Developer"
                          meta={
                            isLoadingRaised
                              ? 'Loading…'
                              : `${raisedQueries?.length ?? 0} queries (all schools)`
                          }
                          onClick={() => {
                            setSource('super_admin');
                            setSelectedDate('');
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="admin-empty-state">
                  <p>{schoolSearchQuery ? 'No schools match your search.' : 'No schools found.'}</p>
                </div>
              )}
            </>
          )}

          {selectedSchoolId !== null && source === null && selectedDate === null && (
            <div>
              {bySchool.school.length === 0 &&
              bySchool.category.length === 0 &&
              bySchool.subcategory.length === 0 &&
              !loadingSchool &&
              !loadingCategory &&
              !loadingSubcategory ? (
                <div className="admin-notice admin-notice--info" style={panelStyle} role="status">
                  <strong>No queries for this school yet.</strong> Counts below are scoped to this school only.
                </div>
              ) : null}
              <StepHeader
                title={`${selectedSchool?.name ?? 'School'} — sources`}
                onBack={() => {
                  setSelectedSchoolId(null);
                  setSchoolSearchQuery('');
                }}
              />
              <div className="row g-3">
                <div className="col-12 col-md-6 col-lg-4">
                  <QueryPickerCard
                    title="School admins"
                    meta={loadingSchool ? 'Loading…' : `${bySchool.school.length} queries`}
                    onClick={() => {
                      setSource('school');
                      setSelectedDate('');
                    }}
                  />
                </div>
                <div className="col-12 col-md-6 col-lg-4">
                  <QueryPickerCard
                    title="Category admins"
                    meta={loadingCategory ? 'Loading…' : `${bySchool.category.length} queries`}
                    onClick={() => {
                      setSource('category');
                      setSelectedDate('');
                    }}
                  />
                </div>
                <div className="col-12 col-md-6 col-lg-4">
                  <QueryPickerCard
                    title="Subcategory admins"
                    meta={loadingSubcategory ? 'Loading…' : `${bySchool.subcategory.length} queries`}
                    onClick={() => {
                      setSource('subcategory');
                      setSelectedDate('');
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {((selectedSchoolId !== null && source !== null) ||
            (source === 'super_admin' && selectedSchoolId === null)) &&
            selectedDate === '' && (
              <div>
                {source === 'super_admin' ? (
                  <div className="admin-notice admin-notice--muted" role="status">
                    {selectedSchool
                      ? `All Super Admin → Developer queries (not filtered by ${selectedSchool.name}).`
                      : 'All Super Admin → Developer queries.'}
                  </div>
                ) : null}
                <StepHeader
                  title={
                    source === 'school'
                      ? `School admins${selectedSchool ? ` · ${selectedSchool.name}` : ''}`
                      : source === 'category'
                        ? `Category admins${selectedSchool ? ` · ${selectedSchool.name}` : ''}`
                        : source === 'subcategory'
                          ? `Subcategory admins${selectedSchool ? ` · ${selectedSchool.name}` : ''}`
                          : 'Super Admin → Developer'
                  }
                  onBack={() => {
                    setSource(null);
                    setSelectedDate(null);
                    setDateSearchQuery('');
                  }}
                />
                <div className="mb-4">
                  <AdminSearchField
                    wide
                    value={dateSearchQuery}
                    onChange={setDateSearchQuery}
                    placeholder="Search dates…"
                  />
                </div>
                {loading ? (
                  <div className="admin-loading-state">Loading queries…</div>
                ) : filteredDates.length > 0 ? (
                  <div className="row g-3">
                    {filteredDates.map((dateStr) => (
                      <div key={dateStr} className="col-12 col-sm-6 col-md-4 col-lg-3">
                        <QueryPickerCard
                          title={dateStr}
                          meta={`${currentByDate[dateStr]?.length ?? 0} queries`}
                          onClick={() => setSelectedDate(dateStr)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty-state">
                    <p>No queries found.</p>
                  </div>
                )}
              </div>
            )}

          {source !== null && selectedDate !== null && selectedDate !== '' && (
            <div>
              <StepHeader title={`Queries · ${selectedDate}`} onBack={() => setSelectedDate('')} />
              {renderQueriesTable(currentByDate[selectedDate] ?? [], true, source ?? 'super_admin')}
            </div>
          )}
        </div>
      </section>

      {viewQuery ? (
        <div className="admin-modal-overlay" onClick={() => setViewQuery(null)} role="presentation">
          <div
            className="admin-modal admin-modal--wide"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal__body">
              <h3 className="admin-modal__title mb-2">
                    {viewQuery.superAdmin
                      ? 'Query to Developer'
                      : viewQuery.schoolAdmin
                        ? 'Query from School Admin'
                        : viewQuery.categoryAdmin
                          ? 'Query from Category Admin'
                          : viewQuery.subCategoryAdmin
                            ? 'Query from Subcategory Admin'
                            : 'Query details'}
              </h3>
                  {(viewQuery.schoolAdmin || viewQuery.categoryAdmin || viewQuery.subCategoryAdmin || viewQuery.superAdmin) && (
                    <p className="text-muted small mb-2">
                      {viewQuery.superAdmin && (
                        <>Raised by {viewQuery.superAdmin.name} ({viewQuery.superAdmin.email})</>
                      )}
                      {viewQuery.schoolAdmin && (
                        <>
                          {viewQuery.schoolAdmin.name}
                          {viewQuery.schoolAdmin.email && ` — ${viewQuery.schoolAdmin.email}`}
                          {viewQuery.schoolAdmin.school?.name && ` · ${viewQuery.schoolAdmin.school.name}`}
                        </>
                      )}
                      {viewQuery.categoryAdmin && (
                        <>
                          {viewQuery.categoryAdmin.name}
                          {viewQuery.categoryAdmin.email && ` — ${viewQuery.categoryAdmin.email}`}
                          {viewQuery.categoryAdmin.category?.name && ` · ${viewQuery.categoryAdmin.category.name}`}
                        </>
                      )}
                      {viewQuery.subCategoryAdmin && (
                        <>
                          {viewQuery.subCategoryAdmin.name}
                          {viewQuery.subCategoryAdmin.email && ` — ${viewQuery.subCategoryAdmin.email}`}
                          {viewQuery.subCategoryAdmin.category?.name && viewQuery.subCategoryAdmin.subCategory?.name && (
                            <> · {viewQuery.subCategoryAdmin.category.name} / {viewQuery.subCategoryAdmin.subCategory.name}</>
                          )}
                        </>
                      )}
                    </p>
                  )}
                  <p className="text-muted small mb-2">{getTypeLabel(viewQuery.type)}</p>
                  <div style={{ whiteSpace: 'pre-wrap', color: '#1a1f2e', marginBottom: '1rem' }}>
                    {viewQuery.description || viewQuery.customMessage || 'No message.'}
                  </div>
                  {viewQuery.type === 'schedule_meeting' && (viewQuery.meetingType || viewQuery.timeZone || viewQuery.timeSlot) && (
                    <p className="small text-muted mb-2">
                      {viewQuery.meetingType === 'google_meet' ? 'Google Meet' : viewQuery.meetingType === 'zoom' ? 'Zoom' : viewQuery.meetingType}
                      {viewQuery.timeZone && ` · ${viewQuery.timeZone}`}
                      {viewQuery.timeSlot && ` · ${viewQuery.timeSlot}`}
                      {viewQuery.meetingDate && ` · ${new Date(viewQuery.meetingDate).toLocaleDateString()}`}
                    </p>
                  )}
                  {viewQuery.attachmentUrl && (
                    <p className="small mb-2">
                      <a href={viewQuery.attachmentUrl} target="_blank" rel="noopener noreferrer">
                        View attachment
                      </a>
                    </p>
                  )}
              <p className="admin-form-hint mb-3">{new Date(viewQuery.createdAt).toLocaleString()}</p>
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setViewQuery(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showReplyPopup && selectedQueryForReply ? (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            setShowReplyPopup(false);
            setSelectedQueryForReply(null);
            setReplySource(null);
            setReplyMessage('');
          }}
          role="presentation"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal__body">
              <h3 className="admin-modal__title mb-3">Send reply</h3>
              <label className="admin-form-label" htmlFor="query-reply-message">
                Message
              </label>
              <textarea
                id="query-reply-message"
                className="form-control"
                rows={6}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Enter your reply…"
              />
              <div className="admin-modal__footer mt-3">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => {
                    setShowReplyPopup(false);
                    setSelectedQueryForReply(null);
                    setReplySource(null);
                    setReplyMessage('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => {
                    if (!selectedQueryForReply || !replyMessage.trim() || !replySource) return;
                    replyMutation.mutate({
                      queryId: selectedQueryForReply.id,
                      message: replyMessage.trim(),
                      replySource,
                    });
                  }}
                  disabled={!replyMessage.trim() || !replySource || replyMutation.isPending}
                >
                  {replyMutation.isPending ? 'Sending…' : 'Send reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDeletePopup ? (
        <div className="admin-modal-overlay" onClick={() => setPendingDeletePopup(false)} role="presentation">
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <div className="admin-modal__body">
              <p className="admin-modal__text mb-0">
                Respond to the query before deleting. Only replied queries can be removed.
              </p>
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-primary" onClick={() => setPendingDeletePopup(false)}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteConfirmQuery ? (
        <div
          className="admin-modal-overlay"
          onClick={() => !deleting && (setDeleteConfirmQuery(null), setDeleteSource(null))}
          role="presentation"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <div className="admin-modal__body">
              <h3 className="admin-modal__title">Delete query?</h3>
              <p className="admin-modal__text">This cannot be undone.</p>
              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  disabled={deleting}
                  onClick={() => (setDeleteConfirmQuery(null), setDeleteSource(null))}
                >
                  Cancel
                </button>
                <button type="button" className="admin-btn-danger" disabled={deleting} onClick={handleDeleteConfirm}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <StatusPopup show={popupShow} type={popupType} message={popupMessage} onClose={() => setPopupShow(false)} />
    </SuperAdminLayout>
  );
};
