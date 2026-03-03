import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';
import {
  subcategoryAdminQueriesService,
  type FromSchoolAdminQueryItem,
  type FromCategoryAdminQueryItem,
} from '../services/subcategory-admin-queries.service';

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

type QuerySource = 'school_admin' | 'category_admin';

type QueryRow =
  | (FromSchoolAdminQueryItem & { _source: 'school_admin' })
  | (FromCategoryAdminQueryItem & { _source: 'category_admin' });

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

export const SubCategoryAdminQueries = () => {
  const { token } = useSubCategoryAdminAuth();
  const [source, setSource] = useState<QuerySource | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateSearchQuery, setDateSearchQuery] = useState('');
  const [viewQuery, setViewQuery] = useState<QueryRow | null>(null);
  const [replyQuery, setReplyQuery] = useState<QueryRow | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: ({
      queryId,
      message,
      replySource,
    }: {
      queryId: string;
      message: string;
      replySource: QuerySource;
    }) =>
      replySource === 'school_admin'
        ? subcategoryAdminQueriesService.replyToSchoolAdmin(queryId, message, token)
        : subcategoryAdminQueriesService.replyToCategoryAdmin(queryId, message, token),
    onSuccess: (_, { replySource }) => {
      setReplyQuery(null);
      setReplyMessage('');
      setError(null);
      if (replySource === 'school_admin') {
        queryClient.invalidateQueries({ queryKey: ['subcategory-admin-queries-from-school'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['subcategory-admin-queries-from-category'] });
      }
    },
    onError: (err) => {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send reply.');
    },
  });

  const handleReplySubmit = () => {
    if (!replyQuery || !replyMessage.trim()) return;
    replyMutation.mutate({
      queryId: replyQuery.id,
      message: replyMessage.trim(),
      replySource: replyQuery._source,
    });
  };

  const { data: fromSchool = [], isLoading: loadingSchool } = useQuery({
    queryKey: ['subcategory-admin-queries-from-school', token ?? ''],
    queryFn: () => subcategoryAdminQueriesService.listFromSchoolAdmins(token),
    enabled: !!token,
  });

  const { data: fromCategory = [], isLoading: loadingCategory } = useQuery({
    queryKey: ['subcategory-admin-queries-from-category', token ?? ''],
    queryFn: () => subcategoryAdminQueriesService.listFromCategoryAdmins(token),
    enabled: !!token,
  });

  const schoolRows: QueryRow[] = useMemo(
    () => fromSchool.map((q) => ({ ...q, _source: 'school_admin' as const })),
    [fromSchool],
  );
  const categoryRows: QueryRow[] = useMemo(
    () => fromCategory.map((q) => ({ ...q, _source: 'category_admin' as const })),
    [fromCategory],
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

  const schoolByDate = useMemo(() => groupByDate(schoolRows), [schoolRows]);
  const categoryByDate = useMemo(() => groupByDate(categoryRows), [categoryRows]);

  const currentByDate = source === 'school_admin' ? schoolByDate : categoryByDate;

  const filteredDates = useMemo(() => {
    const dates = Object.keys(currentByDate);
    if (!dateSearchQuery) return dates;
    return dates.filter((d) => d.toLowerCase().includes(dateSearchQuery.toLowerCase()));
  }, [currentByDate, dateSearchQuery]);

  const renderTable = (rows: QueryRow[]) => (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead style={{ backgroundColor: '#f8f9fa' }}>
          <tr>
            <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Received from</th>
            <th style={{ fontWeight: '600', color: '#1a1f2e' }}>From</th>
            <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Type</th>
            {source === 'school_admin' && <th style={{ fontWeight: '600', color: '#1a1f2e' }}>School</th>}
            {source === 'category_admin' && <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Category</th>}
            <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Status</th>
            <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Date</th>
            <th style={{ fontWeight: '600', color: '#1a1f2e' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => (
            <tr key={q.id}>
              <td style={{ fontWeight: '500', color: '#1a1f2e', whiteSpace: 'nowrap' }}>
                {q._source === 'school_admin' && 'School Admin'}
                {q._source === 'category_admin' && 'Category Admin'}
              </td>
              <td>
                {q._source === 'school_admin' && (
                  <>
                    <span style={{ fontWeight: '500' }}>{q.schoolAdmin.name}</span>
                    <br />
                    <span className="text-muted small">{q.schoolAdmin.email}</span>
                  </>
                )}
                {q._source === 'category_admin' && (
                  <>
                    <span style={{ fontWeight: '500' }}>{q.categoryAdmin.name}</span>
                    <br />
                    <span className="text-muted small">{q.categoryAdmin.email}</span>
                  </>
                )}
              </td>
              <td>{typeLabel[q.type] || q.type}</td>
              {source === 'school_admin' && q._source === 'school_admin' && (
                <td>{q.schoolAdmin.school.name}</td>
              )}
              {source === 'category_admin' && q._source === 'category_admin' && (
                <td>{q.categoryAdmin.category.name}</td>
              )}
              <td>
                <span className={`badge ${q.status === 'responded' ? 'bg-success' : 'bg-warning text-dark'}`}>
                  {q.status === 'responded' ? 'Replied' : q.status === 'pending' ? 'Pending' : q.status}
                </span>
              </td>
              <td style={{ color: '#6c757d', fontSize: '0.9rem' }}>{formatDate(q.createdAt)}</td>
              <td>
                <div className="d-flex gap-2 align-items-center">
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ border: '1px solid #dee2e6', borderRadius: '50px', padding: '0.35rem 0.75rem', color: '#1a1f2e', fontWeight: '500' }}
                    onClick={() => setViewQuery(q)}
                    title="View"
                  >
                    <i className="bi bi-eye" />
                  </button>
                  {q.status !== 'responded' && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.35rem 0.75rem',
                        color: '#fff',
                        fontWeight: '500',
                      }}
                      onClick={() => {
                        setReplyQuery(q);
                        setReplyMessage('');
                      }}
                      title="Reply to this query"
                    >
                      Reply
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const loading = (source === 'school_admin' && loadingSchool) || (source === 'category_admin' && loadingCategory);

  return (
    <SubCategoryAdminLayout>
      <div style={{ flex: 1, padding: '2rem' }}>
        <div className="mb-4">
          <h1 style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '0.5rem' }}>
            Queries
          </h1>
          <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: 0 }}>
            View queries you received from school admins and category admins
          </p>
        </div>
        {error && (
          <div className="alert alert-danger mb-4" style={{ borderRadius: '0px' }}>
            {error}
          </div>
        )}

        {/* Step 1: Two source cards */}
        {source === null && selectedDate === null && (
          <div className="row g-4">
            <div className="col-12 col-md-6">
              <div
                onClick={() => {
                  setSource('school_admin');
                  setSelectedDate('');
                }}
                style={cardStyle}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
              >
                <h6 style={{ fontSize: '1rem', fontWeight: '600', color: '#1a1f2e', margin: 0 }}>
                  Received from School Admin
                </h6>
                {loadingSchool ? (
                  <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>Loading...</p>
                ) : (
                  <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>{fromSchool.length} queries</p>
                )}
              </div>
            </div>
            <div className="col-12 col-md-6">
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
                  Received from Category Admin
                </h6>
                {loadingCategory ? (
                  <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>Loading...</p>
                ) : (
                  <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>{fromCategory.length} queries</p>
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
                {source === 'school_admin' && 'Queries received from School Admin'}
                {source === 'category_admin' && 'Queries received from Category Admin'}
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

        {/* View popup (school admin query) */}
        {viewQuery && viewQuery._source === 'school_admin' && (
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
              style={{ borderRadius: '0px', minWidth: '400px', maxWidth: '560px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-body p-4">
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '1rem' }}>
                  Query from {viewQuery.schoolAdmin.name}
                </h3>
                <p className="text-muted small mb-2">
                  {viewQuery.schoolAdmin.school.name} · {typeLabel[viewQuery.type] || viewQuery.type}
                </p>
                {viewQuery.description && (
                  <p style={{ whiteSpace: 'pre-wrap', color: '#6c757d', marginBottom: '1rem' }}>{viewQuery.description}</p>
                )}
                {viewQuery.type === 'schedule_meeting' && (
                  <p className="small text-muted mb-2">
                    {viewQuery.meetingType === 'google_meet' ? 'Google Meet' : viewQuery.meetingType === 'zoom' ? 'Zoom' : viewQuery.meetingType}{' '}
                    · {viewQuery.timeZone} · {viewQuery.timeSlot}
                  </p>
                )}
                {viewQuery.attachmentUrl && (
                  <p className="small mb-2">
                    <a href={viewQuery.attachmentUrl} target="_blank" rel="noopener noreferrer">View attachment</a>
                  </p>
                )}
                <p className="text-muted small mb-3">{formatDate(viewQuery.createdAt)}</p>
                <div className="d-flex justify-content-end">
                  <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid #dee2e6', borderRadius: '50px', padding: '0.5rem 1.5rem', color: '#1a1f2e', fontWeight: '500' }} onClick={() => setViewQuery(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View popup (category admin query) */}
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
              style={{ borderRadius: '0px', minWidth: '400px', maxWidth: '560px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}
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
                    {viewQuery.meetingType === 'google_meet' ? 'Google Meet' : viewQuery.meetingType === 'zoom' ? 'Zoom' : viewQuery.meetingType}{' '}
                    · {viewQuery.timeZone} · {viewQuery.timeSlot}
                  </p>
                )}
                {viewQuery.attachmentUrl && (
                  <p className="small mb-2">
                    <a href={viewQuery.attachmentUrl} target="_blank" rel="noopener noreferrer">View attachment</a>
                  </p>
                )}
                <p className="text-muted small mb-3">{formatDate(viewQuery.createdAt)}</p>
                <div className="d-flex justify-content-end">
                  <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid #dee2e6', borderRadius: '50px', padding: '0.5rem 1.5rem', color: '#1a1f2e', fontWeight: '500' }} onClick={() => setViewQuery(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reply popup */}
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
            onClick={() => !replyMutation.isPending && (setReplyQuery(null), setReplyMessage(''))}
          >
            <div
              className="card border-0 shadow-lg"
              style={{ borderRadius: '0px', minWidth: '400px', maxWidth: '500px', width: '90%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-body p-4">
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '1rem' }}>
                  Reply to {replyQuery._source === 'school_admin' ? replyQuery.schoolAdmin.name : replyQuery.categoryAdmin.name}
                </h3>
                <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>Your reply</label>
                <textarea
                  className="form-control mb-3"
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply…"
                  style={{ borderRadius: '0px', border: '1px solid #dee2e6' }}
                  disabled={replyMutation.isPending}
                />
                <div className="d-flex justify-content-end gap-3">
                  <button
                    type="button"
                    className="btn"
                    style={{ backgroundColor: 'transparent', border: '1px solid #dee2e6', borderRadius: '50px', padding: '0.5rem 1.5rem', color: '#1a1f2e', fontWeight: '500' }}
                    disabled={replyMutation.isPending}
                    onClick={() => { setReplyQuery(null); setReplyMessage(''); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ backgroundColor: '#1a1f2e', border: 'none', borderRadius: '50px', padding: '0.5rem 1.5rem', color: '#fff', fontWeight: '500' }}
                    disabled={replyMutation.isPending || !replyMessage.trim()}
                    onClick={handleReplySubmit}
                  >
                    {replyMutation.isPending ? 'Sending…' : 'Send reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SubCategoryAdminLayout>
  );
};
