import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import {
  schoolAdminQueriesService,
  type CategoryAdminQueryItem,
  type RaisedToSuperAdminQueryItem,
  type SubCategoryAdminQueryItem,
} from '../services/school-admin-queries.service';

const cardStyle = {
  border: '1px solid rgb(26, 31, 46)',
  borderRadius: '4px',
  padding: '1.5rem',
  backgroundColor: 'white',
  cursor: 'pointer',
  transition: '0.3s',
  textAlign: 'center' as const,
  minHeight: '100px',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  color: '#1a1f2e',
};

type QuerySource = 'super_admin' | 'category_admin' | 'subcategory_admin';

type QueryRow =
  | (RaisedToSuperAdminQueryItem & { _source: 'super_admin' })
  | (CategoryAdminQueryItem & { _source: 'category_admin' })
  | (SubCategoryAdminQueryItem & { _source: 'subcategory_admin' });

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

const typeLabel: Record<string, string> = {
  custom_message: 'Custom Message',
  schedule_meeting: 'Schedule a Meeting',
};

function getDateKey(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const SchoolAdminQueries = () => {
  const queryClient = useQueryClient();
  const { token } = useSchoolAdminAuth();
  const [source, setSource] = useState<QuerySource | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateSearchQuery, setDateSearchQuery] = useState('');
  const [viewQuery, setViewQuery] = useState<QueryRow | null>(null);
  const [replyQuery, setReplyQuery] = useState<QueryRow | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingDeletePopup, setPendingDeletePopup] = useState(false);
  const [deleteConfirmRow, setDeleteConfirmRow] = useState<QueryRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: raisedToSuperAdmin = [], isLoading: loadingSuperAdmin } = useQuery({
    queryKey: ['school-admin-queries-raised-to-super-admin', token ?? ''],
    queryFn: () => schoolAdminQueriesService.listRaisedToSuperAdmin(token),
    enabled: !!token,
  });

  const { data: fromCategoryAdmins = [], isLoading: loadingCategory } = useQuery({
    queryKey: ['school-admin-queries-from-category-admins', token ?? ''],
    queryFn: () => schoolAdminQueriesService.listFromCategoryAdmins(token),
    enabled: !!token,
  });

  const { data: fromSubCategoryAdmins = [], isLoading: loadingSubcategory } = useQuery({
    queryKey: ['school-admin-queries-from-subcategory-admins', token ?? ''],
    queryFn: () => schoolAdminQueriesService.listFromSubCategoryAdmins(token),
    enabled: !!token,
  });

  const superAdminRows: QueryRow[] = useMemo(
    () => raisedToSuperAdmin.map((q) => ({ ...q, _source: 'super_admin' as const })),
    [raisedToSuperAdmin],
  );
  const categoryRows: QueryRow[] = useMemo(
    () => fromCategoryAdmins.map((q) => ({ ...q, _source: 'category_admin' as const })),
    [fromCategoryAdmins],
  );
  const subcategoryRows: QueryRow[] = useMemo(
    () => fromSubCategoryAdmins.map((q) => ({ ...q, _source: 'subcategory_admin' as const })),
    [fromSubCategoryAdmins],
  );

  const groupByDate = (list: QueryRow[]) => {
    const grouped: Record<string, QueryRow[]> = {};
    list.forEach((q) => {
      const key = getDateKey(q.createdAt);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(q);
    });
    return grouped;
  };

  const superAdminByDate = useMemo(() => groupByDate(superAdminRows), [superAdminRows]);
  const categoryByDate = useMemo(() => groupByDate(categoryRows), [categoryRows]);
  const subcategoryByDate = useMemo(() => groupByDate(subcategoryRows), [subcategoryRows]);

  const currentByDate =
    source === 'super_admin'
      ? superAdminByDate
      : source === 'category_admin'
        ? categoryByDate
        : subcategoryByDate;

  const filteredDates = useMemo(() => {
    const dates = Object.keys(currentByDate);
    if (!dateSearchQuery) return dates;
    return dates.filter((d) => d.toLowerCase().includes(dateSearchQuery.toLowerCase()));
  }, [currentByDate, dateSearchQuery]);

  const replyMutation = useMutation({
    mutationFn: ({
      queryId,
      message,
      replySource,
    }: {
      queryId: string;
      message: string;
      replySource: 'category_admin' | 'subcategory_admin';
    }) =>
      replySource === 'category_admin'
        ? schoolAdminQueriesService.replyToCategoryAdmin(queryId, message, token)
        : schoolAdminQueriesService.replyToSubcategoryAdmin(queryId, message, token),
    onSuccess: () => {
      setReplyQuery(null);
      setReplyMessage('');
      setSending(false);
      queryClient.invalidateQueries({ queryKey: ['school-admin-queries-from-category-admins'] });
      queryClient.invalidateQueries({ queryKey: ['school-admin-queries-from-subcategory-admins'] });
    },
    onError: () => setSending(false),
  });

  const handleReplySubmit = () => {
    if (!replyQuery || !replyMessage.trim() || (replyQuery._source !== 'category_admin' && replyQuery._source !== 'subcategory_admin')) return;
    setSending(true);
    replyMutation.mutate({
      queryId: replyQuery.id,
      message: replyMessage.trim(),
      replySource: replyQuery._source,
    });
  };

  const handleDeleteClick = (q: QueryRow) => {
    if (q.status !== 'responded') {
      setPendingDeletePopup(true);
      return;
    }
    setDeleteConfirmRow(q);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmRow) return;
    setDeleting(true);
    try {
      if (deleteConfirmRow._source === 'super_admin') {
        await schoolAdminQueriesService.deleteRaised(deleteConfirmRow.id);
        queryClient.invalidateQueries({ queryKey: ['school-admin-queries-raised-to-super-admin'] });
      } else if (deleteConfirmRow._source === 'category_admin') {
        await schoolAdminQueriesService.deleteFromCategoryAdmin(deleteConfirmRow.id);
        queryClient.invalidateQueries({ queryKey: ['school-admin-queries-from-category-admins'] });
      } else {
        await schoolAdminQueriesService.deleteFromSubcategoryAdmin(deleteConfirmRow.id);
        queryClient.invalidateQueries({ queryKey: ['school-admin-queries-from-subcategory-admins'] });
      }
      setDeleteConfirmRow(null);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete.';
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const loading =
    (source === 'super_admin' && loadingSuperAdmin) ||
    (source === 'category_admin' && loadingCategory) ||
    (source === 'subcategory_admin' && loadingSubcategory);

  const renderTable = (rows: QueryRow[]) => (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead style={{ backgroundColor: '#f8f9fa' }}>
          <tr>
            <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Received from</th>
            <th style={{ fontWeight: '600', color: '#1a1f2e' }}>From / Type</th>
            {source === 'category_admin' && <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Category</th>}
            {source === 'subcategory_admin' && <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Category / Subcategory</th>}
            <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Status</th>
            <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Date</th>
            <th style={{ fontWeight: '600', color: '#1a1f2e', width: '140px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => (
            <tr key={q.id}>
              <td style={{ fontWeight: '500', color: '#1a1f2e', whiteSpace: 'nowrap' }}>
                {q._source === 'super_admin' && 'Raised by you'}
                {q._source === 'category_admin' && 'Category Admin'}
                {q._source === 'subcategory_admin' && 'Subcategory Admin'}
              </td>
              <td>
                {q._source === 'super_admin' && (
                  <>
                    <span className="small">{typeLabel[q.type] || q.type}</span>
                    {(q.description || (q as RaisedToSuperAdminQueryItem).description) && (
                      <p className="small text-muted mb-0 mt-1" style={{ maxWidth: '200px' }}>
                        {((q as RaisedToSuperAdminQueryItem).description || '').slice(0, 80)}
                        {((q as RaisedToSuperAdminQueryItem).description?.length ?? 0) > 80 ? '…' : ''}
                      </p>
                    )}
                  </>
                )}
                {q._source === 'category_admin' && (
                  <>
                    <span style={{ fontWeight: '500' }}>{q.categoryAdmin.name}</span>
                    <br />
                    <span className="text-muted small">{q.categoryAdmin.email}</span>
                    <br />
                    <span className="small">{typeLabel[q.type] || q.type}</span>
                  </>
                )}
                {q._source === 'subcategory_admin' && (
                  <>
                    <span style={{ fontWeight: '500' }}>{q.subCategoryAdmin.name}</span>
                    <br />
                    <span className="text-muted small">{q.subCategoryAdmin.email}</span>
                    <br />
                    <span className="small">{typeLabel[q.type] || q.type}</span>
                  </>
                )}
              </td>
              {source === 'category_admin' && q._source === 'category_admin' && (
                <td>{q.categoryAdmin.category.name}</td>
              )}
              {source === 'subcategory_admin' && q._source === 'subcategory_admin' && (
                <td>
                  {q.subCategoryAdmin.category.name} / {q.subCategoryAdmin.subCategory.name}
                </td>
              )}
              <td>
                <span
                  className={`badge ${q.status === 'responded' ? 'bg-success' : 'bg-warning text-dark'}`}
                >
                  {q.status === 'responded' ? 'Replied' : q.status === 'pending' ? 'Pending' : q.status}
                </span>
              </td>
              <td style={{ color: '#6c757d', fontSize: '0.9rem' }}>{formatDate(q.createdAt)}</td>
              <td>
                <div className="d-flex gap-2 align-items-center">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    style={{ borderRadius: '6px' }}
                    onClick={() => setViewQuery(q)}
                    title="View"
                  >
                    <i className="bi bi-eye" />
                  </button>
                  {(source === 'category_admin' && q._source === 'category_admin' && q.status !== 'responded') ||
                    (source === 'subcategory_admin' && q._source === 'subcategory_admin' && q.status !== 'responded') ? (
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontWeight: '500',
                        padding: '0.35rem 0.75rem',
                      }}
                      onClick={() => {
                        setReplyQuery(q);
                        setReplyMessage('');
                      }}
                      title="Reply"
                    >
                      Reply
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    style={{ borderRadius: '6px' }}
                    onClick={() => handleDeleteClick(q)}
                    title="Delete"
                  >
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SchoolAdminNavbar />
      <div className="d-flex">
        <SchoolAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <div className="mb-4">
            <h1 style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '0.5rem' }}>
              Queries
            </h1>
            <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: 0 }}>
              Queries you raised to Super Admin, and queries from Category Admins and Subcategory Admins
            </p>
          </div>
          {error && (
            <div className="alert alert-danger mb-4" style={{ borderRadius: '0px' }}>
              {error}
            </div>
          )}

          {/* Step 1: Three source cards */}
          {source === null && selectedDate === null && (
            <div className="row g-4">
              <div className="col-12 col-md-6 col-lg-4">
                <div
                  onClick={() => {
                    setSource('super_admin');
                    setSelectedDate('');
                  }}
                  style={cardStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                >
                  <h6 style={{ fontSize: '1rem', fontWeight: '600', color: '#1a1f2e', margin: 0 }}>
                    From Super Admin
                  </h6>
                  <p style={{ color: '#6c757d', fontSize: '0.875rem', marginTop: '0.5rem', margin: 0 }}>
                    Queries raised by you to Super Admin
                  </p>
                  {loadingSuperAdmin ? (
                    <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>Loading...</p>
                  ) : (
                    <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>{raisedToSuperAdmin.length} queries</p>
                  )}
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div
                  onClick={() => {
                    setSource('category_admin');
                    setSelectedDate('');
                  }}
                  style={cardStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                >
                  <h6 style={{ fontSize: '1rem', fontWeight: '600', color: '#1a1f2e', margin: 0 }}>
                    From Category Admin
                  </h6>
                  {loadingCategory ? (
                    <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>Loading...</p>
                  ) : (
                    <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>{fromCategoryAdmins.length} queries</p>
                  )}
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div
                  onClick={() => {
                    setSource('subcategory_admin');
                    setSelectedDate('');
                  }}
                  style={cardStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                >
                  <h6 style={{ fontSize: '1rem', fontWeight: '600', color: '#1a1f2e', margin: 0 }}>
                    From Sub Category Admin
                  </h6>
                  {loadingSubcategory ? (
                    <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>Loading...</p>
                  ) : (
                    <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>{fromSubCategoryAdmins.length} queries</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Date cards */}
          {source !== null && selectedDate === '' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', margin: 0 }}>
                  {source === 'super_admin' && 'Queries raised by you to Super Admin'}
                  {source === 'category_admin' && 'Queries from Category Admin'}
                  {source === 'subcategory_admin' && 'Queries from Sub Category Admin'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSource(null);
                    setSelectedDate(null);
                    setDateSearchQuery('');
                  }}
                  className="btn"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #dee2e6',
                    borderRadius: '50px',
                    padding: '0.5rem 1rem',
                    color: '#1a1f2e',
                    fontWeight: '500',
                  }}
                >
                  Back
                </button>
              </div>
              <div className="mb-4">
                <div className="position-relative">
                  <i
                    className="bi bi-search position-absolute"
                    style={{ left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search dates..."
                    value={dateSearchQuery}
                    onChange={(e) => setDateSearchQuery(e.target.value)}
                    style={{
                      borderRadius: '50px',
                      padding: '0.75rem 1rem 0.75rem 3rem',
                      fontSize: '1rem',
                      border: '1px solid #dee2e6',
                    }}
                  />
                </div>
              </div>
              {loading ? (
                <div className="text-center py-5">
                  <p style={{ color: '#6c757d' }}>Loading queries...</p>
                </div>
              ) : filteredDates.length > 0 ? (
                <div className="row g-3">
                  {filteredDates.map((dateStr) => (
                    <div key={dateStr} className="col-12 col-sm-6 col-md-4 col-lg-3">
                      <div
                        onClick={() => setSelectedDate(dateStr)}
                        style={cardStyle}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                      >
                        <span style={{ color: '#1a1f2e', fontWeight: '500', fontSize: '1rem' }}>{dateStr}</span>
                        <span style={{ color: '#6c757d', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          {currentByDate[dateStr]?.length ?? 0} queries
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card border-0 shadow-sm p-5 text-center" style={{ borderRadius: '0px' }}>
                  <p className="text-muted mb-0">No queries found.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Table for selected date */}
          {source !== null && selectedDate !== null && selectedDate !== '' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', margin: 0 }}>
                  Queries — {selectedDate}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="btn"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #dee2e6',
                    borderRadius: '50px',
                    padding: '0.5rem 1rem',
                    color: '#1a1f2e',
                    fontWeight: '500',
                  }}
                >
                  Back
                </button>
              </div>
              <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
                <div className="card-body p-4">
                  {renderTable(currentByDate[selectedDate] ?? [])}
                </div>
              </div>
            </div>
          )}

          {/* View popup — super admin (raised by you) */}
          {viewQuery && viewQuery._source === 'super_admin' && (
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
              onClick={() => setViewQuery(null)}
            >
              <div
                className="card border-0 shadow-lg"
                style={{
                  borderRadius: '0px',
                  minWidth: '400px',
                  maxWidth: '560px',
                  width: '90%',
                  maxHeight: '90vh',
                  overflow: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-4">
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '1rem' }}>
                    Query to Super Admin
                  </h3>
                  <p className="text-muted small mb-2">{typeLabel[viewQuery.type] || viewQuery.type}</p>
                  {(viewQuery as RaisedToSuperAdminQueryItem).description && (
                    <p style={{ whiteSpace: 'pre-wrap', color: '#6c757d', marginBottom: '1rem' }}>
                      {(viewQuery as RaisedToSuperAdminQueryItem).description}
                    </p>
                  )}
                  {viewQuery.type === 'schedule_meeting' && (
                    <p className="small text-muted mb-2">
                      {viewQuery.meetingType === 'google_meet'
                        ? 'Google Meet'
                        : viewQuery.meetingType === 'zoom'
                          ? 'Zoom'
                          : viewQuery.meetingType}{' '}
                      · {viewQuery.timeZone} · {viewQuery.timeSlot}
                    </p>
                  )}
                  {(viewQuery as RaisedToSuperAdminQueryItem).attachmentUrl && (
                    <p className="small mb-2">
                      <a
                        href={(viewQuery as RaisedToSuperAdminQueryItem).attachmentUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View attachment
                      </a>
                    </p>
                  )}
                  <p className="text-muted small mb-3">{formatDate(viewQuery.createdAt)}</p>
                  <div className="d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                      }}
                      onClick={() => setViewQuery(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View popup — category admin */}
          {viewQuery && viewQuery._source === 'category_admin' && (
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
              onClick={() => setViewQuery(null)}
            >
              <div
                className="card border-0 shadow-lg"
                style={{
                  borderRadius: '0px',
                  minWidth: '400px',
                  maxWidth: '560px',
                  width: '90%',
                  maxHeight: '90vh',
                  overflow: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-4">
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '1rem' }}>
                    Query from {viewQuery.categoryAdmin.name}
                  </h3>
                  <p className="text-muted small mb-2">
                    {viewQuery.categoryAdmin.category.name} · {typeLabel[viewQuery.type] || viewQuery.type}
                  </p>
                  {viewQuery.description && (
                    <p style={{ whiteSpace: 'pre-wrap', color: '#6c757d', marginBottom: '1rem' }}>{viewQuery.description}</p>
                  )}
                  {viewQuery.type === 'schedule_meeting' && (
                    <p className="small text-muted mb-2">
                      {viewQuery.meetingType === 'google_meet' ? 'Google Meet' : viewQuery.meetingType === 'zoom' ? 'Zoom' : viewQuery.meetingType} · {viewQuery.timeZone} · {viewQuery.timeSlot}
                    </p>
                  )}
                  {viewQuery.attachmentUrl && (
                    <p className="small mb-2">
                      <a href={viewQuery.attachmentUrl} target="_blank" rel="noopener noreferrer">
                        View attachment
                      </a>
                    </p>
                  )}
                  <p className="text-muted small mb-3">{formatDate(viewQuery.createdAt)}</p>
                  <div className="d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                      }}
                      onClick={() => setViewQuery(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View popup — subcategory admin */}
          {viewQuery && viewQuery._source === 'subcategory_admin' && (
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
              onClick={() => setViewQuery(null)}
            >
              <div
                className="card border-0 shadow-lg"
                style={{
                  borderRadius: '0px',
                  minWidth: '400px',
                  maxWidth: '560px',
                  width: '90%',
                  maxHeight: '90vh',
                  overflow: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-4">
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '1rem' }}>
                    Query from {viewQuery.subCategoryAdmin.name}
                  </h3>
                  <p className="text-muted small mb-2">
                    {viewQuery.subCategoryAdmin.category.name} / {viewQuery.subCategoryAdmin.subCategory.name} · {typeLabel[viewQuery.type] || viewQuery.type}
                  </p>
                  {viewQuery.description && (
                    <p style={{ whiteSpace: 'pre-wrap', color: '#6c757d', marginBottom: '1rem' }}>{viewQuery.description}</p>
                  )}
                  {viewQuery.type === 'schedule_meeting' && (
                    <p className="small text-muted mb-2">
                      {viewQuery.meetingType === 'google_meet' ? 'Google Meet' : viewQuery.meetingType === 'zoom' ? 'Zoom' : viewQuery.meetingType} · {viewQuery.timeZone} · {viewQuery.timeSlot}
                    </p>
                  )}
                  {viewQuery.attachmentUrl && (
                    <p className="small mb-2">
                      <a href={viewQuery.attachmentUrl} target="_blank" rel="noopener noreferrer">
                        View attachment
                      </a>
                    </p>
                  )}
                  <p className="text-muted small mb-3">{formatDate(viewQuery.createdAt)}</p>
                  <div className="d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                      }}
                      onClick={() => setViewQuery(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reply popup — category admin or subcategory admin */}
          {replyQuery && (
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
              onClick={() => !sending && (setReplyQuery(null), setReplyMessage(''))}
            >
              <div
                className="card border-0 shadow-lg"
                style={{ borderRadius: '0px', minWidth: '400px', maxWidth: '500px', width: '90%' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-4">
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '1rem' }}>
                    Reply to {replyQuery._source === 'category_admin' ? replyQuery.categoryAdmin.name : replyQuery._source === 'subcategory_admin' ? replyQuery.subCategoryAdmin.name : ''}
                  </h3>
                  <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                    Your reply
                  </label>
                  <textarea
                    className="form-control mb-3"
                    rows={4}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply…"
                    style={{ borderRadius: '0px', border: '1px solid #dee2e6' }}
                    disabled={sending}
                  />
                  <div className="d-flex justify-content-end gap-3">
                    <button
                      type="button"
                      className="btn"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                      }}
                      disabled={sending}
                      onClick={() => {
                        setReplyQuery(null);
                        setReplyMessage('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                      }}
                      disabled={sending || !replyMessage.trim()}
                      onClick={handleReplySubmit}
                    >
                      {sending ? 'Sending…' : 'Send reply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending delete popup — respond first */}
          {pendingDeletePopup && (
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
              onClick={() => setPendingDeletePopup(false)}
            >
              <div
                className="card border-0 shadow-lg"
                style={{ borderRadius: '0px', minWidth: '360px', maxWidth: '440px', width: '90%' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-4">
                  <p className="mb-0" style={{ color: '#1a1f2e' }}>
                    Respond to the query in order to delete it. Only replied queries can be deleted.
                  </p>
                  <div className="d-flex justify-content-end mt-3">
                    <button
                      type="button"
                      className="btn"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.25rem',
                        color: '#fff',
                        fontWeight: '500',
                      }}
                      onClick={() => setPendingDeletePopup(false)}
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirm delete popup */}
          {deleteConfirmRow && (
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
              onClick={() => !deleting && setDeleteConfirmRow(null)}
            >
              <div
                className="card border-0 shadow-lg"
                style={{ borderRadius: '0px', minWidth: '360px', maxWidth: '440px', width: '90%' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-4">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                    Delete query?
                  </h3>
                  <p className="text-muted small mb-3">This cannot be undone.</p>
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1.25rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                      }}
                      disabled={deleting}
                      onClick={() => setDeleteConfirmRow(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ borderRadius: '50px', padding: '0.5rem 1.25rem', fontWeight: '500' }}
                      disabled={deleting}
                      onClick={handleDeleteConfirm}
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
      </div>
    </div>
  );
};
