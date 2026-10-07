import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalPipelineRequestConversationView } from './ExternalPipelineRequestConversationView';
import { schoolAdminExternalPipelineService } from '../services/school-admin-external-pipeline.service';
import type { PipelineRequestRow } from '../services/external-admin-pipeline.service';
import { pipelineStatusLabel, pipelineStatusPillClass } from '../utils/externalPipelineStatus';
import { pipelineThreadMessages } from '../utils/externalPipelineThread';
import { getApiErrorMessage } from '../utils/apiError';

type ActionType = 'query' | 'approve' | 'reject' | 'ban';

export const SchoolAdminExternalAdminRequestsPanel = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationRequestId = searchParams.get('requestId');

  const [modal, setModal] = useState<{
    row: PipelineRequestRow;
    action: ActionType;
  } | null>(null);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['school-admin', 'external-pipeline', 'requests'],
    queryFn: schoolAdminExternalPipelineService.listRequests,
  });

  const openConversation = (requestId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('requestId', requestId);
    setSearchParams(next);
  };

  const closeConversation = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('requestId');
    setSearchParams(next);
  };

  const actionMutation = useMutation({
    mutationFn: async () => {
      if (!modal) throw new Error('No action');
      const { row, action } = modal;
      const msg = message.trim();
      if (action === 'query') {
        if (!msg) throw new Error('Query message is required.');
        return schoolAdminExternalPipelineService.sendQuery(row.id, msg);
      }
      if (action === 'approve') return schoolAdminExternalPipelineService.approve(row.id, msg || undefined);
      if (action === 'reject') return schoolAdminExternalPipelineService.reject(row.id, msg || undefined);
      return schoolAdminExternalPipelineService.ban(row.id, msg || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-admin', 'external-pipeline'] });
      setModal(null);
      setMessage('');
      setActionError(null);
    },
    onError: (err: unknown) => {
      setActionError(getApiErrorMessage(err, 'Action failed.'));
    },
  });

  const openModal = (row: PipelineRequestRow, action: ActionType) => {
    setModal({ row, action });
    setMessage('');
    setActionError(null);
  };

  const modalTitle =
    modal?.action === 'query'
      ? 'Send query to external admin'
      : modal?.action === 'approve'
        ? 'Approve pipeline access'
        : modal?.action === 'reject'
          ? 'Reject request'
          : 'Ban external admin';

  if (isLoading) {
    return <div className="admin-loading-state">Loading admin requests…</div>;
  }

  if (conversationRequestId) {
    return (
      <ExternalPipelineRequestConversationView
        role="school"
        requestId={conversationRequestId}
        preview={requests.find((r) => r.id === conversationRequestId) ?? null}
        onBack={closeConversation}
      />
    );
  }

  if (requests.length === 0) {
    return (
      <div className="admin-empty-state">
        <p>No external admin pipeline requests for your school yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>External admin</th>
              <th>Category</th>
              <th>Latest message</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((row) => {
              const thread = pipelineThreadMessages(row);
              const latest = thread[thread.length - 1];
              return (
                <tr key={row.id}>
                  <td>
                    <span className="admin-table__strong">{row.externalAdmin.name}</span>
                    <div className="small text-muted">{row.externalAdmin.email}</div>
                  </td>
                  <td>{row.externalCategory.name}</td>
                  <td className="small" style={{ maxWidth: 220 }}>
                    {latest ? (
                      <>
                        <span className="text-muted">
                          {latest.senderRole === 'school_admin' ? 'You: ' : 'External: '}
                        </span>
                        {latest.body.length > 100 ? `${latest.body.slice(0, 100)}…` : latest.body}
                      </>
                    ) : (
                      row.requestMessage ?? '—'
                    )}
                  </td>
                  <td>
                    <span className={pipelineStatusPillClass(row.status)}>{pipelineStatusLabel(row.status)}</span>
                  </td>
                  <td>
                    <div className="admin-table-actions justify-content-end flex-wrap">
                      <button
                        type="button"
                        className="admin-icon-btn admin-icon-btn--edit"
                        title="View conversation"
                        aria-label="View conversation"
                        onClick={() => openConversation(row.id)}
                      >
                        <i className="bi bi-eye" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary admin-btn-sm"
                        onClick={() => openModal(row, 'query')}
                      >
                        Send query
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary admin-btn-sm"
                        onClick={() => openModal(row, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary admin-btn-sm"
                        onClick={() => openModal(row, 'reject')}
                      >
                        Reject
                      </button>
                      <button type="button" className="admin-btn-danger admin-btn-sm" onClick={() => openModal(row, 'ban')}>
                        Ban
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          role="presentation"
          onClick={() => setModal(null)}
        >
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              <div className="admin-modal__head">
                <h2 className="admin-modal__title">{modalTitle}</h2>
              </div>
              <p className="admin-modal__text small text-muted mb-2">
                {modal.row.externalAdmin.name} · {modal.row.externalCategory.name}
              </p>
              <label className="form-label small fw-semibold">
                {modal.action === 'query' ? 'Query message *' : 'Message to external admin (optional)'}
              </label>
              <textarea
                className="form-control mb-3"
                rows={4}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {actionError ? <p className="small text-danger">{actionError}</p> : null}
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setModal(null)}>
                  Cancel
                </button>
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
    </>
  );
};
