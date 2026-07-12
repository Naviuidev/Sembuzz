import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { imageSrc, isImageIconValue } from '../utils/image';
import type { ClubGroupChatRequestItem } from '../services/subcategory-admin-club-group-chat-requests.service';

const TEXT_DARK = '#1a1f2e';

type ReviewService = {
  list: (status?: 'pending' | 'approved' | 'declined') => Promise<ClubGroupChatRequestItem[]>;
  approve: (id: string) => Promise<ClubGroupChatRequestItem>;
  decline: (id: string, reason?: string) => Promise<ClubGroupChatRequestItem>;
};

function ClubIcon({ icon, name }: { icon: string; name: string }) {
  if (isImageIconValue(icon) || icon.startsWith('http') || icon.startsWith('/')) {
    return (
      <img
        src={imageSrc(icon)}
        alt={name}
        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
      />
    );
  }
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        backgroundColor: 'rgba(26,31,46,0.1)',
        color: TEXT_DARK,
        fontWeight: 600,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

interface ClubGroupChatRequestReviewPanelProps {
  service: ReviewService;
  queryKeyPrefix: string;
}

export function ClubGroupChatRequestReviewPanel({
  service,
  queryKeyPrefix,
}: ClubGroupChatRequestReviewPanelProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'declined' | 'all'>('pending');
  const [actingId, setActingId] = useState<string | null>(null);
  const [declineModal, setDeclineModal] = useState<ClubGroupChatRequestItem | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: [queryKeyPrefix, 'club-group-chat-requests', filter],
    queryFn: () => service.list(filter === 'all' ? undefined : filter),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, 'club-group-chat-requests'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => service.approve(id),
    onSuccess: () => {
      setMessage('Group chat request approved. The club group chat is now enabled.');
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
    <div>
      <p className="text-muted mb-3">
        Review group chat setup requests from sub-category admins. Approving creates the club group chat for students.
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
        <p className="text-muted">Loading requests…</p>
      ) : requests.length === 0 ? (
        <p className="text-muted">No requests in this list.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {requests.map((row) => (
            <div key={row.id} className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body d-flex flex-wrap align-items-center gap-3">
                <ClubIcon icon={row.icon} name={row.pageName} />
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-semibold" style={{ color: TEXT_DARK }}>
                    {row.pageName}
                  </div>
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
                  Decline group chat for <strong>{declineModal.pageName}</strong>?
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
