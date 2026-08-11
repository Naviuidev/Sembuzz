import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { StudentChatGroupRequestItem } from '../services/subcategory-admin-student-chat-group-requests.service';

const TEXT_DARK = '#1a1f2e';

type ReviewService = {
  list: (status?: 'pending' | 'approved' | 'declined') => Promise<StudentChatGroupRequestItem[]>;
  approve: (id: string) => Promise<StudentChatGroupRequestItem>;
  decline: (id: string, reason?: string) => Promise<StudentChatGroupRequestItem>;
};

interface StudentChatGroupRequestReviewPanelProps {
  service: ReviewService;
  queryKeyPrefix: string;
}

export function StudentChatGroupRequestReviewPanel({
  service,
  queryKeyPrefix,
}: StudentChatGroupRequestReviewPanelProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'declined' | 'all'>('pending');
  const [actingId, setActingId] = useState<string | null>(null);
  const [declineModal, setDeclineModal] = useState<StudentChatGroupRequestItem | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: [queryKeyPrefix, 'student-chat-group-requests', filter],
    queryFn: () => service.list(filter === 'all' ? undefined : filter),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, 'student-chat-group-requests'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => service.approve(id),
    onSuccess: () => {
      setMessage('Student group request approved. The group is now available for member management.');
      setError(null);
      invalidate();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not approve request.';
      setError(typeof msg === 'string' ? msg : 'Could not approve request.');
    },
    onSettled: () => setActingId(null),
  });

  const declineMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => service.decline(id, reason),
    onSuccess: () => {
      setMessage('Request declined.');
      setError(null);
      setDeclineModal(null);
      setDeclineReason('');
      invalidate();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not decline request.';
      setError(typeof msg === 'string' ? msg : 'Could not decline request.');
    },
    onSettled: () => setActingId(null),
  });

  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 0 }}>
      <div className="card-body">
        <h2 className="h6 mb-2" style={{ color: TEXT_DARK }}>
          Student group requests
        </h2>
        <p className="text-muted small mb-3">
          Review student chat group creation requests from sub-category admins. Either category admin
          or school admin can approve or decline.
        </p>

        {message ? <div className="alert alert-success py-2">{message}</div> : null}
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}

        <div className="btn-group mb-3" role="group">
          {(['pending', 'approved', 'declined', 'all'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`btn btn-sm ${filter === tab ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setFilter(tab)}
            >
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-muted mb-0">Loading requests…</p>
        ) : requests.length === 0 ? (
          <p className="text-muted mb-0">No requests in this list.</p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {requests.map((row) => (
              <div key={row.id} className="border rounded p-3">
                <div className="d-flex flex-wrap align-items-start gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(26,31,46,0.1)',
                      color: TEXT_DARK,
                      fontWeight: 600,
                    }}
                  >
                    {row.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <div className="fw-semibold" style={{ color: TEXT_DARK }}>
                      {row.name}
                    </div>
                    <div className="small text-muted">
                      {row.visibility === 'private' ? 'Private' : 'Public'} group · Requested by{' '}
                      {row.subCategoryAdmin.name} ({row.subCategoryAdmin.email})
                    </div>
                    <div className="small text-muted">
                      {new Date(row.createdAt).toLocaleString()}
                      {row.description ? ` · ${row.description}` : ''}
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
                        Approve
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
      </div>

      {declineModal ? (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={() => setDeclineModal(null)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Decline request</h5>
                <button type="button" className="btn-close" onClick={() => setDeclineModal(null)} />
              </div>
              <div className="modal-body">
                <p className="mb-2">
                  Decline student group <strong>{declineModal.name}</strong>?
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
    </div>
  );
}
