import { useState, useMemo, type CSSProperties, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { StatusPopup } from '../components/StatusPopup';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';
import {
  subcategoryAdminQueriesService,
  type FromSchoolAdminQueryItem,
  type FromCategoryAdminQueryItem,
} from '../services/subcategory-admin-queries.service';
import { invalidateAdminActionItems } from '../services/admin-action-items.service';

type QuerySource = 'school_admin' | 'category_admin';

type QueryRow =
  | (FromSchoolAdminQueryItem & { _source: 'school' })
  | (FromCategoryAdminQueryItem & { _source: 'category' });

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

function getStatusBadge(status: string) {
  const pillClass: Record<string, string> = {
    pending: 'admin-pill--status-pending',
    responded: 'admin-pill--status-done',
  };
  const label =
    status === 'responded' ? 'Replied' : status === 'pending' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`admin-pill ${pillClass[status] ?? 'admin-pill--status-pending'}`}>{label}</span>;
}

const SOURCE_TITLES: Record<QuerySource, string> = {
  school_admin: 'Queries from School Admin',
  category_admin: 'Queries from Category Admin',
};

export const SubCategoryAdminQueries = () => {
  const queryClient = useQueryClient();
  const { token } = useSubCategoryAdminAuth();
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.subcategory } as CSSProperties;

  const [source, setSource] = useState<QuerySource | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateSearchQuery, setDateSearchQuery] = useState('');
  const [viewQuery, setViewQuery] = useState<QueryRow | null>(null);
  const [replyQuery, setReplyQuery] = useState<QueryRow | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [pendingDeletePopup, setPendingDeletePopup] = useState(false);
  const [deleteConfirmRow, setDeleteConfirmRow] = useState<QueryRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [popupShow, setPopupShow] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState('');

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
    () => fromSchool.map((q) => ({ ...q, _source: 'school' as const })),
    [fromSchool],
  );
  const categoryRows: QueryRow[] = useMemo(
    () => fromCategory.map((q) => ({ ...q, _source: 'category' as const })),
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

  const replyMutation = useMutation({
    mutationFn: ({
      queryId,
      message,
      replySource,
    }: {
      queryId: string;
      message: string;
      replySource: QuerySource;
    }) => {
      if (replySource === 'school_admin') {
        return subcategoryAdminQueriesService.replyToSchoolAdmin(queryId, message, token);
      }
      return subcategoryAdminQueriesService.replyToCategoryAdmin(queryId, message, token);
    },
    onSuccess: () => {
      setReplyQuery(null);
      setReplyMessage('');
      setPopupType('success');
      setPopupMessage('Reply sent successfully.');
      setPopupShow(true);
      queryClient.invalidateQueries({ queryKey: ['subcategory-admin-queries-from-school'] });
      queryClient.invalidateQueries({ queryKey: ['subcategory-admin-queries-from-category'] });
      void invalidateAdminActionItems(queryClient, 'subcategory-admin');
    },
    onError: (err) => {
      setPopupType('error');
      setPopupMessage(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send reply.',
      );
      setPopupShow(true);
    },
  });

  const handleReplySubmit = () => {
    if (!replyQuery || !replyMessage.trim() || !source) return;
    const replySource = replyQuery._source === 'school' ? 'school_admin' : 'category_admin';
    replyMutation.mutate({
      queryId: replyQuery.id,
      message: replyMessage.trim(),
      replySource,
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
      if (deleteConfirmRow._source === 'school') {
        await subcategoryAdminQueriesService.deleteFromSchoolAdmin(deleteConfirmRow.id);
        queryClient.invalidateQueries({ queryKey: ['subcategory-admin-queries-from-school'] });
      } else {
        await subcategoryAdminQueriesService.deleteFromCategoryAdmin(deleteConfirmRow.id);
        queryClient.invalidateQueries({ queryKey: ['subcategory-admin-queries-from-category'] });
      }
      setDeleteConfirmRow(null);
      void invalidateAdminActionItems(queryClient, 'subcategory-admin');
    } catch (err) {
      setPopupType('error');
      setPopupMessage(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete.',
      );
      setPopupShow(true);
    } finally {
      setDeleting(false);
    }
  };

  const loading =
    (source === 'school_admin' && loadingSchool) || (source === 'category_admin' && loadingCategory);

  const canReply = (q: QueryRow) => {
    if (q.status === 'responded' || !source) return false;
    if (source === 'school_admin' && q._source === 'school') return true;
    if (source === 'category_admin' && q._source === 'category') return true;
    return false;
  };

  const renderDetailsCell = (q: QueryRow) => {
    if (q.type === 'schedule_meeting') {
      return (
        <div className="admin-table__details">
          <div>
            <strong>Meeting:</strong>{' '}
            {q.meetingType === 'google_meet' ? 'Google Meet' : q.meetingType === 'zoom' ? 'Zoom' : q.meetingType}
          </div>
          {q.timeZone ? <div><strong>Timezone:</strong> {q.timeZone}</div> : null}
          {q.timeSlot ? <div><strong>Time:</strong> {q.timeSlot}</div> : null}
          {q.description ? <div className="mt-1">{q.description}</div> : null}
        </div>
      );
    }
    const text = q.description || 'No message';
    return <div className="admin-table__details">{text}</div>;
  };

  const renderFromCell = (q: QueryRow) => {
    if (q._source === 'school') {
      return (
        <>
          <span className="admin-table__strong">{q.schoolAdmin.name}</span>
          <div className="admin-form-hint">{q.schoolAdmin.email}</div>
          <div className="admin-form-hint">{q.schoolAdmin.school.name}</div>
        </>
      );
    }
    if (q._source === 'category') {
      return (
        <>
          <span className="admin-table__strong">{q.categoryAdmin.name}</span>
          <div className="admin-form-hint">{q.categoryAdmin.email}</div>
          <div className="admin-form-hint">{q.categoryAdmin.category.name}</div>
        </>
      );
    }
    return null;
  };

  const renderTable = (rows: QueryRow[]) => (
    <section className="admin-panel mt-3" style={panelStyle}>
      <div className="admin-panel__body admin-panel__body--flush-top p-0">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Received from</th>
                <th scope="col">From</th>
                <th scope="col">Type</th>
                <th scope="col">Details</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.id}>
                  <td className="admin-table__strong text-nowrap">
                    {q._source === 'school' && 'School Admin'}
                    {q._source === 'category' && 'Category Admin'}
                  </td>
                  <td>{renderFromCell(q)}</td>
                  <td>{typeLabel[q.type] || q.type}</td>
                  <td>{renderDetailsCell(q)}</td>
                  <td>{getStatusBadge(q.status)}</td>
                  <td>{formatDate(q.createdAt)}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        type="button"
                        onClick={() => setViewQuery(q)}
                        className="admin-icon-btn admin-icon-btn--edit"
                        title="View details"
                        aria-label="View details"
                      >
                        <i className="bi bi-eye" aria-hidden />
                      </button>
                      {canReply(q) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyQuery(q);
                            setReplyMessage('');
                          }}
                          className="admin-btn-primary admin-btn-sm"
                        >
'Reply'
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(q)}
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

  const replyTitle = () => {
    if (!replyQuery) return 'Send reply';
    if (replyQuery._source === 'school') return `Reply to ${replyQuery.schoolAdmin.name}`;
    return `Reply to ${replyQuery.categoryAdmin.name}`;
  };

  const viewModalTitle = () => {
    if (!viewQuery) return 'Query details';
    if (viewQuery._source === 'school') return `Query from ${viewQuery.schoolAdmin.name}`;
    if (viewQuery._source === 'category') return `Query from ${viewQuery.categoryAdmin.name}`;
    return 'Query details';
  };

  const viewModalMeta = () => {
    if (!viewQuery) return null;
    if (viewQuery._source === 'school') {
      return (
        <>
          {viewQuery.schoolAdmin.email} · {viewQuery.schoolAdmin.school.name} · {typeLabel[viewQuery.type] || viewQuery.type}
        </>
      );
    }
    if (viewQuery._source === 'category') {
      return (
        <>
          {viewQuery.categoryAdmin.email} · {viewQuery.categoryAdmin.category.name} ·{' '}
          {typeLabel[viewQuery.type] || viewQuery.type}
        </>
      );
    }
    return null;
  };

  const viewModalBody = () => {
    if (!viewQuery) return null;
    const message = viewQuery.description;
    return message || 'No message.';
  };

  return (
    <SubCategoryAdminLayout>
      <header className="admin-page-header" style={panelStyle}>
        <h1 className="admin-page-title">Queries</h1>
        <p className="admin-page-subtitle">
          Queries received from school and category admins. Reply or remove replied items.
        </p>
      </header>

      {source === null && selectedDate === null ? (
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <QueryPickerCard
              title="School Admin"
              meta={loadingSchool ? 'Loading…' : `${fromSchool.length} queries`}
              onClick={() => {
                setSource('school_admin');
                setSelectedDate('');
              }}
            />
          </div>
          <div className="col-12 col-md-6">
            <QueryPickerCard
              title="Category Admin"
              meta={loadingCategory ? 'Loading…' : `${fromCategory.length} queries`}
              onClick={() => {
                setSource('category_admin');
                setSelectedDate('');
              }}
            />
          </div>
        </div>
      ) : null}

      {source !== null ? (
        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__body">
          {source !== null && selectedDate === '' && (
            <div>
              <StepHeader
                title={SOURCE_TITLES[source]}
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
              {(currentByDate[selectedDate] ?? []).length === 0 ? (
                <div className="admin-empty-state mt-3">
                  <p>No queries for this date.</p>
                </div>
              ) : (
                renderTable(currentByDate[selectedDate] ?? [])
              )}
            </div>
          )}
          </div>
        </section>
      ) : null}

      {viewQuery ? (
        <div className="admin-modal-overlay" onClick={() => setViewQuery(null)} role="presentation">
          <div
            className="admin-modal admin-modal--wide"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal__body">
              <h3 className="admin-modal__title mb-2">{viewModalTitle()}</h3>
              <p className="text-muted small mb-2">{viewModalMeta()}</p>
              <div style={{ whiteSpace: 'pre-wrap', color: '#1a1f2e', marginBottom: '1rem' }}>{viewModalBody()}</div>
              {viewQuery.type === 'schedule_meeting' && (
                <p className="small text-muted mb-2">
                  {viewQuery.meetingType === 'google_meet' ? 'Google Meet' : viewQuery.meetingType === 'zoom' ? 'Zoom' : viewQuery.meetingType}
                  {viewQuery.timeZone && ` · ${viewQuery.timeZone}`}
                  {viewQuery.timeSlot && ` · ${viewQuery.timeSlot}`}
                </p>
              )}
              {viewQuery.attachmentUrl ? (
                <p className="small mb-2">
                  <a href={viewQuery.attachmentUrl} target="_blank" rel="noopener noreferrer">View attachment</a>
                </p>
              ) : null}
              <p className="admin-form-hint mb-3">{formatDate(viewQuery.createdAt)}</p>
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setViewQuery(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {replyQuery ? (
        <div
          className="admin-modal-overlay"
          onClick={() => !replyMutation.isPending && (setReplyQuery(null), setReplyMessage(''))}
          role="presentation"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal__body">
              <h3 className="admin-modal__title mb-3">{replyTitle()}</h3>
              <label className="admin-form-label" htmlFor="subcategory-admin-query-reply">
                Your reply
              </label>
              <textarea
                id="subcategory-admin-query-reply"
                className="form-control admin-form-control"
                rows={5}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply…"
                disabled={replyMutation.isPending}
              />
              <div className="admin-modal__footer mt-3">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  disabled={replyMutation.isPending}
                  onClick={() => {
                    setReplyQuery(null);
                    setReplyMessage('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={replyMutation.isPending || !replyMessage.trim()}
                  onClick={handleReplySubmit}
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

      {deleteConfirmRow ? (
        <div
          className="admin-modal-overlay"
          onClick={() => !deleting && setDeleteConfirmRow(null)}
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
                  onClick={() => setDeleteConfirmRow(null)}
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
    </SubCategoryAdminLayout>
  );
};
