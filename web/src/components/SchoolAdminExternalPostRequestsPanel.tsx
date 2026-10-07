import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalPostRequestConversationView } from './ExternalPostRequestConversationView';
import {
  schoolAdminExternalPostRequestsService,
  type ExternalPostRequestRow,
} from '../services/school-admin-external-post-requests.service';
import { externalPostStatusLabel, externalPostStatusPillClass } from '../utils/externalPostRequestStatus';
import { postThreadMessages } from '../utils/externalPostRequestThread';
import { getApiErrorMessage } from '../utils/apiError';
import { externalPostContentTypeLabel } from '../utils/externalOfferPostView';

type ActionType = 'query' | 'approve' | 'reject' | 'ban';

function isPendingStatus(status: string) {
  return status === 'pending' || status === 'query';
}

export const SchoolAdminExternalPostRequestsPanel = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const postRequestId = searchParams.get('postRequestId');
  const postFilter = searchParams.get('postFilter') === 'approved' ? 'approved' : 'pending';

  const [modal, setModal] = useState<{ row: ExternalPostRequestRow; action: ActionType } | null>(null);
  const [successPopup, setSuccessPopup] = useState<{ title: string; body: string } | null>(null);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const successCopy: Record<ActionType, { title: string; body: string }> = {
    approve: {
      title: 'Post approved',
      body: 'This external post has been approved for your school. The external admin can see the update in their portal.',
    },
    query: {
      title: 'Query sent',
      body: 'Your message was sent to the external admin. They can reply in the post conversation.',
    },
    reject: {
      title: 'Post rejected',
      body: 'The external post was rejected. The external admin can see your review in the conversation.',
    },
    ban: {
      title: 'Post banned',
      body: 'This external admin is blocked from posting to your school for this request.',
    },
  };

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['school-admin', 'external-post-requests', 'requests'],
    queryFn: schoolAdminExternalPostRequestsService.listRequests,
  });

  const filtered = useMemo(() => {
    if (postFilter === 'approved') {
      return requests.filter((r) => r.status === 'approved');
    }
    return requests.filter((r) => isPendingStatus(r.status));
  }, [requests, postFilter]);

  const openConversation = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'post-approval');
    next.set('postFilter', postFilter);
    next.set('postRequestId', id);
    setSearchParams(next);
  };

  const closeConversation = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('postRequestId');
    setSearchParams(next);
  };

  const actionMutation = useMutation({
    mutationFn: async () => {
      if (!modal) throw new Error('No action');
      const { row, action } = modal;
      const msg = message.trim();
      if (action === 'query') {
        if (!msg) throw new Error('Query message is required.');
        await schoolAdminExternalPostRequestsService.sendQuery(row.id, msg);
        return action;
      }
      if (action === 'approve') {
        await schoolAdminExternalPostRequestsService.approve(row.id, msg || undefined);
        return action;
      }
      if (action === 'reject') {
        await schoolAdminExternalPostRequestsService.reject(row.id, msg || undefined);
        return action;
      }
      await schoolAdminExternalPostRequestsService.ban(row.id, msg || undefined);
      return action;
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ['school-admin', 'external-post-requests'] });
      setModal(null);
      setMessage('');
      setActionError(null);
      setSuccessPopup(successCopy[action]);
      if (postRequestId) closeConversation();
    },
    onError: (err: unknown) => setActionError(getApiErrorMessage(err, 'Action failed.')),
  });

  const openModal = (row: ExternalPostRequestRow, action: ActionType) => {
    setModal({ row, action });
    setMessage('');
    setActionError(null);
  };

  const modalTitle =
    modal?.action === 'query'
      ? 'Send query to external admin'
      : modal?.action === 'approve'
        ? 'Approve post'
        : modal?.action === 'reject'
          ? 'Reject post'
          : 'Ban external admin posts';

  if (isLoading) return <div className="admin-loading-state">Loading post approvals…</div>;

  if (postRequestId) {
    return (
      <ExternalPostRequestConversationView
        role="school"
        requestId={postRequestId}
        preview={requests.find((r) => r.id === postRequestId) ?? null}
        onBack={closeConversation}
      />
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="admin-empty-state">
        <p>
          {postFilter === 'approved'
            ? 'No approved external posts yet.'
            : 'No pending external post submissions.'}
        </p>
      </div>
    );
  }

  const showActions = postFilter === 'pending';

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>External admin</th>
              <th>Category</th>
              <th>Type</th>
              <th>Post</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const thread = postThreadMessages(row);
              const latest = thread[thread.length - 1];
              return (
                <tr key={row.id}>
                  <td>
                    <span className="admin-table__strong">{row.externalAdmin?.name ?? '—'}</span>
                  </td>
                  <td>{row.externalCategory.name}</td>
                  <td className="small text-muted">{externalPostContentTypeLabel(row)}</td>
                  <td className="small" style={{ maxWidth: 240 }}>
                    <div className="admin-table__strong">{row.title}</div>
                    {latest ? (
                      <div className="text-muted">
                        {latest.senderRole === 'school_admin' ? 'You: ' : 'External: '}
                        {latest.body.length > 60 ? `${latest.body.slice(0, 60)}…` : latest.body}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <span className={externalPostStatusPillClass(row.status)}>{externalPostStatusLabel(row.status)}</span>
                  </td>
                  <td>
                    <div className="admin-table-actions admin-table-actions--nowrap justify-content-end">
                      <button
                        type="button"
                        className="admin-icon-btn admin-icon-btn--edit"
                        title="View post & conversation"
                        aria-label="View details"
                        onClick={() => openConversation(row.id)}
                      >
                        <i className="bi bi-eye" aria-hidden />
                      </button>
                      {showActions ? (
                        <>
                          <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => openModal(row, 'query')}>
                            Send query
                          </button>
                          <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => openModal(row, 'approve')}>
                            Approve
                          </button>
                          <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => openModal(row, 'reject')}>
                            Reject
                          </button>
                          <button type="button" className="admin-btn-danger admin-btn-sm" onClick={() => openModal(row, 'ban')}>
                            Ban
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal ? (
        <div className="admin-modal-overlay admin-modal-overlay--elevated" role="presentation" onClick={() => setModal(null)}>
          <div className="admin-modal admin-modal--wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__body">
              <div className="admin-modal__head">
                <h2 className="admin-modal__title">{modalTitle}</h2>
              </div>
              <p className="admin-modal__text small text-muted mb-2">{modal.row.title}</p>
              <label className="form-label small fw-semibold">
                {modal.action === 'query' ? 'Query message *' : 'Message to external admin (optional)'}
              </label>
              <textarea className="form-control mb-3" rows={4} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} />
              {actionError ? <p className="small text-danger">{actionError}</p> : null}
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button
                  type="button"
                  className={modal.action === 'ban' ? 'admin-btn-danger' : 'admin-btn-primary'}
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate()}
                >
                  {actionMutation.isPending ? 'Saving…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {successPopup ? (
        <div className="admin-modal-overlay admin-modal-overlay--elevated" role="presentation" onClick={() => setSuccessPopup(null)}>
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-labelledby="school-external-post-success-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body admin-modal__body--with-close">
              <button type="button" className="admin-modal__close" aria-label="Close" onClick={() => setSuccessPopup(null)}>
                <i className="bi bi-x-lg" aria-hidden />
              </button>
              <div className="admin-modal__head">
                <i className="bi bi-check-circle-fill admin-modal__icon admin-modal__icon--success" aria-hidden />
                <h2 id="school-external-post-success-title" className="admin-modal__title">{successPopup.title}</h2>
              </div>
              <p className="admin-modal__text">{successPopup.body}</p>
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-primary" onClick={() => setSuccessPopup(null)}>OK</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
