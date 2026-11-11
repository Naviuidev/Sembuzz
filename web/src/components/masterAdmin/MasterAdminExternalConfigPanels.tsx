import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalPipelineRequestConversationView } from '../ExternalPipelineRequestConversationView';
import { ExternalPostRequestConversationView } from '../ExternalPostRequestConversationView';
import { MasterAdminExternalPostPublishModal } from './MasterAdminExternalPostPublishModal';
import { masterAdminExternalConfigService } from '../../services/master-admin-external-config.service';
import type { PipelineRequestRow } from '../../services/external-admin-pipeline.service';
import type { ExternalPostRequestRow } from '../../services/external-admin-post-requests.service';
import { pipelineStatusLabel, pipelineStatusPillClass } from '../../utils/externalPipelineStatus';
import { pipelineThreadMessages } from '../../utils/externalPipelineThread';
import { externalPostStatusLabel, externalPostStatusPillClass } from '../../utils/externalPostRequestStatus';
import { postThreadMessages } from '../../utils/externalPostRequestThread';
import { getApiErrorMessage } from '../../utils/apiError';
import type { ExternalContentKind } from '../../services/master-admin-external-config.service';

type ActionType = 'query' | 'approve' | 'reject' | 'ban';

function externalQueryKey(schoolId: string) {
  return ['master-admin', 'external-config', schoolId] as const;
}

export function MasterAdminPipelineRequestsPanel({
  schoolId,
  conversationId,
  onOpenConversation,
  onCloseConversation,
}: {
  schoolId: string;
  conversationId: string | null;
  onOpenConversation: (id: string) => void;
  onCloseConversation: () => void;
}) {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ row: PipelineRequestRow; action: ActionType } | null>(null);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: [...externalQueryKey(schoolId), 'pipeline', 'requests'],
    queryFn: () => masterAdminExternalConfigService.listPipelineRequests(schoolId),
    enabled: Boolean(schoolId),
  });

  const actionMutation = useMutation({
    mutationFn: async () => {
      if (!modal) throw new Error('No action');
      const { row, action } = modal;
      const msg = message.trim();
      if (action === 'query') {
        if (!msg) throw new Error('Query message is required.');
        return masterAdminExternalConfigService.pipelineSendQuery(schoolId, row.id, msg);
      }
      if (action === 'approve') return masterAdminExternalConfigService.pipelineApprove(schoolId, row.id, msg || undefined);
      if (action === 'reject') return masterAdminExternalConfigService.pipelineReject(schoolId, row.id, msg || undefined);
      return masterAdminExternalConfigService.pipelineBan(schoolId, row.id, msg || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: externalQueryKey(schoolId) });
      setModal(null);
      setMessage('');
      setActionError(null);
    },
    onError: (err: unknown) => setActionError(getApiErrorMessage(err, 'Action failed.')),
  });

  const modalTitle =
    modal?.action === 'query'
      ? 'Send query to external admin'
      : modal?.action === 'approve'
        ? 'Approve pipeline access'
        : modal?.action === 'reject'
          ? 'Reject request'
          : 'Ban external admin';

  if (isLoading) return <p className="master-admin-detail-muted mb-0">Loading admin requests…</p>;

  if (conversationId) {
    return (
      <ExternalPipelineRequestConversationView
        role="master"
        schoolId={schoolId}
        requestId={conversationId}
        preview={requests.find((r) => r.id === conversationId) ?? null}
        onBack={onCloseConversation}
      />
    );
  }

  if (requests.length === 0) {
    return <p className="master-admin-detail-muted mb-0">No external admin pipeline requests for this school yet.</p>;
  }

  return (
    <>
      <div className="admin-table-wrap master-admin-school-table-wrap master-admin-school-table-wrap--posts">
        <table className="admin-table master-admin-school-table master-admin-posts-table">
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
                          {latest.senderRole === 'school_admin' ? 'School: ' : 'External: '}
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
                  <td className="text-end">
                    <div className="admin-table-actions justify-content-end flex-wrap">
                      <button
                        type="button"
                        className="admin-icon-btn admin-icon-btn--edit"
                        title="View conversation"
                        onClick={() => onOpenConversation(row.id)}
                      >
                        <i className="bi bi-eye" aria-hidden />
                      </button>
                      <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => setModal({ row, action: 'query' })}>
                        Send query
                      </button>
                      <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => setModal({ row, action: 'approve' })}>
                        Approve
                      </button>
                      <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => setModal({ row, action: 'reject' })}>
                        Reject
                      </button>
                      <button type="button" className="admin-btn-danger admin-btn-sm" onClick={() => setModal({ row, action: 'ban' })}>
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
        <div className="admin-modal-overlay admin-modal-overlay--elevated" role="presentation" onClick={() => setModal(null)}>
          <div className="admin-modal admin-modal--wide" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__body">
              <h2 className="admin-modal__title">{modalTitle}</h2>
              <p className="admin-form-hint mb-2">
                {modal.row.externalAdmin.name} · {modal.row.externalCategory.name}
              </p>
              <textarea className="form-control admin-form-control mb-3" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
              {actionError ? <p className="admin-form-hint admin-form-hint--error">{actionError}</p> : null}
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
}

function isPendingPostStatus(status: string) {
  return status === 'pending' || status === 'query';
}

function canPublishRow(row: ExternalPostRequestRow) {
  return row.status !== 'approved';
}

function ExternalPostTableCreateToolbar({
  label,
  onCreate,
}: {
  label: string;
  onCreate: () => void;
}) {
  return (
    <div className="master-admin-ext-config-table-toolbar d-flex justify-content-end mb-0 px-3 pt-3 pb-2">
      <button type="button" className="admin-btn-primary" onClick={onCreate}>
        <i className="bi bi-plus-lg me-2" aria-hidden />
        {label}
      </button>
    </div>
  );
}

export function MasterAdminExternalPostRequestsPanel({
  schoolId,
  schoolName,
  contentType,
  conversationId,
  createButtonLabel,
  onStartCreate,
  onOpenConversation,
  onCloseConversation,
}: {
  schoolId: string;
  schoolName: string;
  contentType: ExternalContentKind;
  conversationId: string | null;
  createButtonLabel: string;
  onStartCreate: () => void;
  onOpenConversation: (id: string) => void;
  onCloseConversation: () => void;
}) {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ row: ExternalPostRequestRow; action: ActionType } | null>(null);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [publishRow, setPublishRow] = useState<ExternalPostRequestRow | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: [...externalQueryKey(schoolId), 'posts', 'requests'],
    queryFn: () => masterAdminExternalConfigService.listPostRequests(schoolId),
    enabled: Boolean(schoolId),
  });

  const filtered = useMemo(() => {
    return requests.filter((r) => r.contentType === contentType);
  }, [requests, contentType]);

  const actionMutation = useMutation({
    mutationFn: async () => {
      if (!modal) throw new Error('No action');
      const { row, action } = modal;
      const msg = message.trim();
      if (action === 'query') {
        if (!msg) throw new Error('Query message is required.');
        return masterAdminExternalConfigService.postSendQuery(schoolId, row.id, msg);
      }
      if (action === 'approve') return masterAdminExternalConfigService.postApprove(schoolId, row.id, msg || undefined);
      if (action === 'reject') return masterAdminExternalConfigService.postReject(schoolId, row.id, msg || undefined);
      return masterAdminExternalConfigService.postBan(schoolId, row.id, msg || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: externalQueryKey(schoolId) });
      setModal(null);
      setMessage('');
      setActionError(null);
    },
    onError: (err: unknown) => setActionError(getApiErrorMessage(err, 'Action failed.')),
  });

  const createToolbar =
    !conversationId && onStartCreate ? (
      <ExternalPostTableCreateToolbar label={createButtonLabel} onCreate={onStartCreate} />
    ) : null;

  if (isLoading) {
    return (
      <>
        {createToolbar}
        <p className="master-admin-detail-muted mb-0 px-3 pb-3">Loading post approvals…</p>
      </>
    );
  }

  if (conversationId) {
    return (
      <ExternalPostRequestConversationView
        role="master"
        schoolId={schoolId}
        requestId={conversationId}
        preview={requests.find((r) => r.id === conversationId) ?? null}
        onBack={onCloseConversation}
      />
    );
  }

  if (filtered.length === 0) {
    const emptyLabels: Record<ExternalContentKind, string> = {
      job: 'No job share posts have been created for this school yet.',
      offer: 'No offers have been created for this school yet.',
      campaign: 'No campaigns have been created for this school yet.',
    };
    return (
      <>
        {createToolbar}
        <p className="master-admin-detail-muted mb-0 px-3 pb-3">{emptyLabels[contentType]}</p>
      </>
    );
  }

  return (
    <>
      {createToolbar}
      <div className="admin-table-wrap master-admin-school-table-wrap master-admin-school-table-wrap--posts">
        <table className="admin-table master-admin-school-table master-admin-posts-table">
          <thead>
            <tr>
              <th>External admin</th>
              <th>Category</th>
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
                  <td className="small" style={{ maxWidth: 240 }}>
                    <div className="admin-table__strong">{row.title}</div>
                    {latest ? (
                      <div className="text-muted">
                        {latest.senderRole === 'school_admin' ? 'School: ' : 'External: '}
                        {latest.body.length > 60 ? `${latest.body.slice(0, 60)}…` : latest.body}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <span className={externalPostStatusPillClass(row.status)}>{externalPostStatusLabel(row.status)}</span>
                  </td>
                  <td className="text-end">
                    <div className="admin-table-actions admin-table-actions--nowrap justify-content-end">
                      <button type="button" className="admin-icon-btn admin-icon-btn--edit" onClick={() => onOpenConversation(row.id)}>
                        <i className="bi bi-eye" aria-hidden />
                      </button>
                      {canPublishRow(row) ? (
                        <button
                          type="button"
                          className="admin-btn-primary admin-btn-sm"
                          onClick={() => setPublishRow(row)}
                        >
                          Ready to publish
                        </button>
                      ) : null}
                      {isPendingPostStatus(row.status) ? (
                        <>
                          <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => setModal({ row, action: 'query' })}>
                            Send query
                          </button>
                          <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => setModal({ row, action: 'approve' })}>
                            Approve
                          </button>
                          <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => setModal({ row, action: 'reject' })}>
                            Reject
                          </button>
                          <button type="button" className="admin-btn-danger admin-btn-sm" onClick={() => setModal({ row, action: 'ban' })}>
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
      {publishRow ? (
        <MasterAdminExternalPostPublishModal
          postId={publishRow.id}
          postTitle={publishRow.title}
          schoolId={schoolId}
          schoolName={schoolName}
          contentKind={(publishRow.contentType as ExternalContentKind) ?? contentType}
          onClose={() => setPublishRow(null)}
          onPublished={() => {
            queryClient.invalidateQueries({ queryKey: externalQueryKey(schoolId) });
          }}
        />
      ) : null}
      {modal ? (
        <div className="admin-modal-overlay admin-modal-overlay--elevated" role="presentation" onClick={() => setModal(null)}>
          <div className="admin-modal admin-modal--wide" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__body">
              <h2 className="admin-modal__title">Review post</h2>
              <p className="admin-form-hint mb-2">{modal.row.title}</p>
              <textarea className="form-control admin-form-control mb-3" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
              {actionError ? <p className="admin-form-hint admin-form-hint--error">{actionError}</p> : null}
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button type="button" className="admin-btn-primary" disabled={actionMutation.isPending} onClick={() => actionMutation.mutate()}>
                  {actionMutation.isPending ? 'Saving…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
