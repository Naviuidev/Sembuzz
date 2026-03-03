import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SuperAdminNavbar } from '../components/SuperAdminNavbar';
import { SuperAdminSidebar } from '../components/SuperAdminSidebar';
import { StatusPopup } from '../components/StatusPopup';
import { supportService, type SuperAdminQuery } from '../services/support.service';
import { schoolsService, type School } from '../services/schools.service';

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

type QuerySource = 'school' | 'category' | 'subcategory' | 'super_admin';

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
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      pending: { bg: '#fff3cd', text: '#856404', border: '#ffc107' },
      in_progress: { bg: '#cfe2ff', text: '#084298', border: '#0d6efd' },
      resolved: { bg: '#d1e7dd', text: '#0f5132', border: '#198754' },
      responded: { bg: '#d1e7dd', text: '#0f5132', border: '#198754' },
    };
    const c = colors[status] || colors.pending;
    return (
      <span
        style={{
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          borderRadius: '50px',
          backgroundColor: c.bg,
          color: c.text,
          border: `1px solid ${c.border}`,
        }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
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
    <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: '0px' }}>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ fontWeight: '500', color: '#1a1f2e', padding: '1rem', borderBottom: 'none' }}>
                  Received from
                </th>
                <th style={{ fontWeight: '500', color: '#1a1f2e', padding: '1rem', borderBottom: 'none' }}>
                  Type
                </th>
                <th style={{ fontWeight: '500', color: '#1a1f2e', padding: '1rem', borderBottom: 'none' }}>
                  Details
                </th>
                <th style={{ fontWeight: '500', color: '#1a1f2e', padding: '1rem', borderBottom: 'none' }}>
                  Status
                </th>
                <th style={{ fontWeight: '500', color: '#1a1f2e', padding: '1rem', borderBottom: 'none' }}>
                  Date
                </th>
                <th style={{ fontWeight: '500', color: '#1a1f2e', padding: '1rem', borderBottom: 'none', width: '140px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {queries.map((query) => (
                <tr key={query.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '1rem', fontWeight: '500', color: '#1a1f2e', whiteSpace: 'nowrap' }}>
                    {currentSource === 'school' && 'School Admin'}
                    {currentSource === 'category' && 'Category Admin'}
                    {currentSource === 'subcategory' && 'Subcategory Admin'}
                    {currentSource === 'super_admin' && 'Super Admin (to Developer)'}
                  </td>
                  <td style={{ padding: '1rem', color: '#1a1f2e' }}>{getTypeLabel(query.type)}</td>
                  <td style={{ padding: '1rem' }}>
                    {query.type === 'schedule_meeting' ? (
                      <div style={{ fontSize: '0.875rem' }}>
                        <div>
                          <strong>Meeting:</strong>{' '}
                          {query.meetingType === 'google_meet' ? 'Google Meet' : 'Zoom'}
                        </div>
                        {query.timeZone && (
                          <div>
                            <strong>Timezone:</strong> {query.timeZone}
                          </div>
                        )}
                        {query.timeSlot && (
                          <div>
                            <strong>Time:</strong> {query.timeSlot}
                          </div>
                        )}
                        {query.meetingDate && (
                          <div>
                            <strong>Date:</strong>{' '}
                            {new Date(query.meetingDate).toLocaleDateString()}
                          </div>
                        )}
                        {query.description && (
                          <div className="mt-2" style={{ color: '#6c757d' }}>
                            {query.description}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                        {query.description || query.customMessage || 'No description'}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>{getStatusBadge(query.status)}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6c757d' }}>
                    {new Date(query.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div className="d-flex gap-2 align-items-center">
                      <button
                        type="button"
                        onClick={() => setViewQuery(query)}
                        className="btn btn-sm btn-outline-primary"
                        style={{ borderRadius: '6px', fontWeight: '500', fontSize: '0.875rem' }}
                        title="View"
                      >
                        <i className="bi bi-eye" />
                      </button>
                      {showReply && query.status !== 'responded' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedQueryForReply(query as unknown as SuperAdminQuery);
                            setReplySource(currentSource);
                            setShowReplyPopup(true);
                            setReplyMessage('');
                          }}
                          className="btn btn-sm"
                          style={{
                            backgroundColor: '#1a1f2e',
                            border: 'none',
                            borderRadius: '50px',
                            padding: '0.375rem 1rem',
                            color: '#fff',
                            fontWeight: '500',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                          }}
                        >
                          Reply
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(query, currentSource)}
                        className="btn btn-sm btn-outline-danger"
                        style={{ borderRadius: '6px' }}
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
      </div>
    </div>
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SuperAdminNavbar />
      <div className="d-flex">
        <SuperAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '0.5rem' }}>
            Queries & Help Requests
          </h1>
          <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: '1.5rem' }}>
            Select a school to view queries from admins, or view Super Admin to Developer queries (all).
          </p>

          {/* Step 1: Search bar + School cards + Super Admin to Developer */}
          {selectedSchoolId === null && source === null && selectedDate === null && (
            <>
              <div className="mb-4">
                <div className="position-relative" style={{ maxWidth: '400px' }}>
                  <i
                    className="bi bi-search position-absolute"
                    style={{
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6c757d',
                    }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search schools by name, ref number, or city..."
                    value={schoolSearchQuery}
                    onChange={(e) => setSchoolSearchQuery(e.target.value)}
                    style={{
                      borderRadius: '50px',
                      padding: '0.75rem 1rem 0.75rem 3rem',
                      fontSize: '1rem',
                      border: '1px solid #dee2e6',
                    }}
                  />
                </div>
              </div>
              {loadingSchools ? (
                <div className="text-center py-5">
                  <p style={{ color: '#6c757d' }}>Loading schools...</p>
                </div>
              ) : filteredSchools.length > 0 ? (
                <>
                  <div className="row g-3">
                    {filteredSchools.map((school) => (
                      <div key={school.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                        <div
                          onClick={() => {
                            setSelectedSchoolId(school.id);
                            setSource(null);
                            setSelectedDate(null);
                            setDateSearchQuery('');
                          }}
                          style={cardStyle}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                          }}
                        >
                          <h6
                            style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: '#1a1f2e',
                              margin: 0,
                            }}
                          >
                            {school.name}
                          </h6>
                          {school.refNum && (
                            <p style={{ color: '#6c757d', fontSize: '0.875rem', marginTop: '0.25rem', margin: 0 }}>
                              Ref: {school.refNum}
                            </p>
                          )}
                          {school.city && (
                            <p style={{ color: '#6c757d', fontSize: '0.8rem', margin: 0 }}>{school.city}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3" style={{ borderTop: '1px solid #dee2e6' }}>
                    <p className="text-muted small mb-2">Or view queries not tied to a school:</p>
                    <div className="col-12 col-sm-6 col-md-4 col-lg-3" style={{ maxWidth: '320px' }}>
                      <div
                        onClick={() => {
                          setSource('super_admin');
                          setSelectedDate('');
                        }}
                        style={cardStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <h6 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1f2e', margin: 0 }}>
                          Super Admin to Developer
                        </h6>
                        <p style={{ color: '#6c757d', fontSize: '0.75rem', marginTop: '0.25rem', margin: 0 }}>
                          (all queries — not tied to any school)
                        </p>
                        {isLoadingRaised ? (
                          <p style={{ color: '#6c757d', marginTop: '0.5rem', margin: 0 }}>Loading...</p>
                        ) : (
                          <p style={{ color: '#6c757d', marginTop: '0.5rem', margin: 0 }}>
                            {raisedQueries?.length ?? 0} queries
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="card border-0 shadow-sm p-5 text-center" style={{ borderRadius: '0px' }}>
                  <p className="text-muted mb-0">
                    {schoolSearchQuery ? 'No schools match your search.' : 'No schools found.'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Step 2: Source cards (after school selected) */}
          {selectedSchoolId !== null && source === null && selectedDate === null && (
            <div>
              {(bySchool.school.length === 0 && bySchool.category.length === 0 && bySchool.subcategory.length === 0 && !loadingSchool && !loadingCategory && !loadingSubcategory) && (
                <div className="alert alert-info mb-4" style={{ borderRadius: '0px' }} role="alert">
                  <strong>No queries from any admin for this school yet.</strong> The counts below are for this school only.
                </div>
              )}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', margin: 0 }}>
                  {selectedSchool?.name ?? 'School'} — Query sources
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSchoolId(null);
                    setSchoolSearchQuery('');
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
              <div className="row g-4">
                <div className="col-12 col-md-6 col-lg-3">
                  <div
                    onClick={() => {
                      setSource('school');
                      setSelectedDate('');
                    }}
                    style={cardStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <h6 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1f2e', margin: 0 }}>
                      From School Admins
                    </h6>
                    {loadingSchool ? (
                      <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>Loading...</p>
                    ) : (
                      <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>
                        {bySchool.school.length} queries
                      </p>
                    )}
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                  <div
                    onClick={() => {
                      setSource('category');
                      setSelectedDate('');
                    }}
                    style={cardStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <h6 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1f2e', margin: 0 }}>
                      From Category Admins
                    </h6>
                    {loadingCategory ? (
                      <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>Loading...</p>
                    ) : (
                      <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>
                        {bySchool.category.length} queries
                      </p>
                    )}
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                  <div
                    onClick={() => {
                      setSource('subcategory');
                      setSelectedDate('');
                    }}
                    style={cardStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <h6 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a1f2e', margin: 0 }}>
                      From Subcategory Admins
                    </h6>
                    {loadingSubcategory ? (
                      <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>Loading...</p>
                    ) : (
                      <p style={{ color: '#6c757d', marginTop: '0.75rem', margin: 0 }}>
                        {bySchool.subcategory.length} queries
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Date cards (when a school is selected, or when Super Admin to Developer chosen from step 1) */}
          {((selectedSchoolId !== null && source !== null) || (source === 'super_admin' && selectedSchoolId === null)) && selectedDate === '' && (
            <div>
              {source === 'super_admin' && (
                <div className="alert alert-secondary mb-3" style={{ borderRadius: '0px' }} role="alert">
                  {selectedSchool ? `Showing all Super Admin to Developer queries (not filtered by ${selectedSchool.name}).` : 'Showing all Super Admin to Developer queries.'}
                </div>
              )}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', margin: 0 }}>
                  {source === 'school' && 'Queries from School Admins'}
                  {source === 'category' && 'Queries from Category Admins'}
                  {source === 'subcategory' && 'Queries from Subcategory Admins'}
                  {source === 'super_admin' && 'Queries Raised by Super Admin to Developer'}
                  {selectedSchool && source !== 'super_admin' && ` — ${selectedSchool.name}`}
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
                    style={{
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6c757d',
                    }}
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <span style={{ color: '#1a1f2e', fontWeight: '500', fontSize: '1rem' }}>
                          {dateStr}
                        </span>
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

          {/* Step 4: Table view */}
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
              {renderQueriesTable(
                currentByDate[selectedDate] ?? [],
                true,
                source ?? 'super_admin',
              )}
            </div>
          )}

          {/* View Query Popup */}
          {viewQuery && (
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
                  <p className="text-muted small mb-3">{new Date(viewQuery.createdAt).toLocaleString()}</p>
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

          {/* Reply Popup */}
          {showReplyPopup && selectedQueryForReply && (
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
              onClick={() => {
                setShowReplyPopup(false);
                setSelectedQueryForReply(null);
                setReplySource(null);
                setReplyMessage('');
              }}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '2rem',
                  maxWidth: '500px',
                  width: '90%',
                  maxHeight: '80vh',
                  overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'normal', color: '#1a1f2e', margin: 0 }}>
                    Send Reply
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplyPopup(false);
                      setSelectedQueryForReply(null);
                      setReplySource(null);
                      setReplyMessage('');
                    }}
                    className="btn-close"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                    Reply Message
                  </label>
                  <textarea
                    className="form-control"
                    rows={6}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Enter your reply..."
                    style={{
                      borderRadius: '0px',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      border: '1px solid #dee2e6',
                      resize: 'vertical',
                    }}
                  />
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplyPopup(false);
                      setSelectedQueryForReply(null);
                      setReplySource(null);
                      setReplyMessage('');
                    }}
                    className="btn"
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #dee2e6',
                      borderRadius: '50px',
                      padding: '0.5rem 1.5rem',
                      color: '#1a1f2e',
                      fontWeight: '500',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedQueryForReply || !replyMessage.trim() || !replySource) return;
                      replyMutation.mutate({
                        queryId: selectedQueryForReply.id,
                        message: replyMessage.trim(),
                        replySource,
                      });
                    }}
                    disabled={!replyMessage.trim() || !replySource || replyMutation.isPending}
                    className="btn"
                    style={{
                      backgroundColor: '#1a1f2e',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '0.5rem 1.5rem',
                      color: '#fff',
                      fontWeight: '500',
                      opacity: !replyMessage.trim() || !replySource || replyMutation.isPending ? 0.7 : 1,
                      cursor: !replyMessage.trim() || !replySource || replyMutation.isPending ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}

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

          {deleteConfirmQuery && (
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
              onClick={() => !deleting && (setDeleteConfirmQuery(null), setDeleteSource(null))}
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
                      onClick={() => (setDeleteConfirmQuery(null), setDeleteSource(null))}
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

          <StatusPopup
            show={popupShow}
            type={popupType}
            message={popupMessage}
            onClose={() => setPopupShow(false)}
          />
        </div>
      </div>
    </div>
  );
};
