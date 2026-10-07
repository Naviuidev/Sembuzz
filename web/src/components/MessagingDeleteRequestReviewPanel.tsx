import { useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateAdminActionItemsForPrefix } from '../services/admin-action-items.service';

const TEXT_DARK = '#1a1f2e';

type DeleteRequestRow = {
  id: string;
  status: 'pending' | 'approved' | 'declined';
  note: string | null;
  declineReason: string | null;
  createdAt: string;
  subCategoryAdmin: { name: string; email: string };
};

type ReviewService = {
  list: (status?: 'pending' | 'approved' | 'declined') => Promise<DeleteRequestRow[]>;
  approve: (id: string) => Promise<unknown>;
  decline: (id: string, reason?: string) => Promise<unknown>;
};

interface MessagingDeleteRequestReviewPanelProps {
  panelStyle?: CSSProperties;
  title: string;
  description: string;
  queryKeyPrefix: string;
  queryKey: string;
  service: ReviewService;
  renderTargetName: (row: DeleteRequestRow) => string;
  renderTargetMeta?: (row: DeleteRequestRow) => string;
  approveSuccessMessage: string;
}

export function MessagingDeleteRequestReviewPanel({
  panelStyle,
  title,
  description,
  queryKeyPrefix,
  queryKey,
  service,
  renderTargetName,
  renderTargetMeta,
  approveSuccessMessage,
}: MessagingDeleteRequestReviewPanelProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'declined' | 'all'>('pending');
  const [actingId, setActingId] = useState<string | null>(null);
  const [declineModal, setDeclineModal] = useState<DeleteRequestRow | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: [queryKeyPrefix, queryKey, filter],
    queryFn: () => service.list(filter === 'all' ? undefined : filter),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, queryKey] });
    invalidateAdminActionItemsForPrefix(queryClient, queryKeyPrefix);
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => service.approve(id),
    onSuccess: () => {
      setMessage(approveSuccessMessage);
      setError(null);
      invalidate();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not approve delete request.';
      setError(typeof msg === 'string' ? msg : 'Could not approve delete request.');
    },
    onSettled: () => setActingId(null),
  });

  const declineMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => service.decline(id, reason),
    onSuccess: () => {
      setMessage('Delete request declined.');
      setError(null);
      setDeclineModal(null);
      setDeclineReason('');
      invalidate();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not decline delete request.';
      setError(typeof msg === 'string' ? msg : 'Could not decline delete request.');
    },
    onSettled: () => setActingId(null),
  });

  const body = (
    <>
        <p className="admin-form-hint mb-3">{description}</p>

        {message ? (
          <div className="admin-notice admin-notice--info mb-3">
            <p className="mb-0">{message}</p>
          </div>
        ) : null}
        {error ? (
          <p className="admin-form-hint admin-form-hint--error mb-3">{error}</p>
        ) : null}

        <nav className="admin-dashboard-badges mb-3" aria-label={`${title} filter`}>
          {(['pending', 'approved', 'declined', 'all'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`admin-dashboard-badge${filter === tab ? ' is-active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        {isLoading ? (
          <p className="admin-form-hint mb-0">Loading delete requests…</p>
        ) : requests.length === 0 ? (
          <p className="admin-form-hint mb-0">No delete requests in this list.</p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {requests.map((row) => (
              <div key={row.id} className="border rounded p-3">
                <div className="d-flex flex-wrap align-items-start gap-3">
                  <div className="flex-grow-1 min-w-0">
                    <div className="fw-semibold" style={{ color: TEXT_DARK }}>
                      {renderTargetName(row)}
                    </div>
                    {renderTargetMeta ? (
                      <div className="small text-muted">{renderTargetMeta(row)}</div>
                    ) : null}
                    <div className="small text-muted">
                      Requested by {row.subCategoryAdmin.name} ({row.subCategoryAdmin.email})
                    </div>
                    <div className="small text-muted">
                      {new Date(row.createdAt).toLocaleString()}
                      {row.note ? ` · ${row.note}` : ''}
                    </div>
                    {row.status === 'declined' && row.declineReason ? (
                      <div className="small text-danger mt-1">Declined: {row.declineReason}</div>
                    ) : null}
                  </div>
                  {row.status === 'pending' ? (
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-dark"
                        disabled={actingId === row.id}
                        onClick={() => {
                          setActingId(row.id);
                          setMessage(null);
                          setError(null);
                          approveMutation.mutate(row.id);
                        }}
                      >
                        Approve delete
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        disabled={actingId === row.id}
                        onClick={() => {
                          setDeclineModal(row);
                          setDeclineReason('');
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`badge ${row.status === 'approved' ? 'bg-success' : 'bg-danger'}`}
                    >
                      {row.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </>
  );

  return (
    <>
      {panelStyle ? (
        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">{title}</h2>
          </div>
          <div className="admin-panel__body">{body}</div>
        </section>
      ) : (
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 0 }}>
          <div className="card-body">
            <h2 className="h6 mb-2" style={{ color: TEXT_DARK }}>
              {title}
            </h2>
            {body}
          </div>
        </div>
      )}

      {declineModal ? (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={() => setDeclineModal(null)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Decline delete request</h5>
                <button type="button" className="btn-close" onClick={() => setDeclineModal(null)} />
              </div>
              <div className="modal-body">
                <p className="mb-2">
                  Decline deletion of <strong>{renderTargetName(declineModal)}</strong>?
                </p>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Optional reason for the sub-category admin"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeclineModal(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={actingId === declineModal.id}
                  onClick={() => {
                    setActingId(declineModal.id);
                    declineMutation.mutate({
                      id: declineModal.id,
                      reason: declineReason.trim() || undefined,
                    });
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
