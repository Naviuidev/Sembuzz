import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SubCategoryExternalPostConversationView } from './SubCategoryExternalPostConversationView';
import { subcategoryAdminExternalConfigService, type SubcategoryExternalPostRow } from '../services/subcategory-admin-external-config.service';
import { externalPostStatusLabel, externalPostStatusPillClass } from '../utils/externalPostRequestStatus';
import { getApiErrorMessage } from '../utils/apiError';

type Action = 'query' | 'approve' | 'reject' | 'ban';

export function SubCategoryAdminExternalApprovedPostsPanel() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const postId = searchParams.get('postId');
  const [modal, setModal] = useState<{ row: SubcategoryExternalPostRow; action: Action } | null>(null);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['subcategory-admin', 'external-config', 'posts'],
    queryFn: subcategoryAdminExternalConfigService.listPosts,
  });

  const openView = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'approved-posts');
    next.set('postId', id);
    setSearchParams(next);
  };

  const closeView = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('postId');
    setSearchParams(next);
  };

  const actionMutation = useMutation({
    mutationFn: async () => {
      if (!modal) throw new Error('No action');
      const { row, action } = modal;
      const msg = message.trim();
      if (action === 'query') {
        if (!msg) throw new Error('Query message is required.');
        return subcategoryAdminExternalConfigService.postSendQuery(row.id, msg);
      }
      if (action === 'approve') return subcategoryAdminExternalConfigService.postApprove(row.id, msg || undefined);
      if (action === 'reject') return subcategoryAdminExternalConfigService.postReject(row.id, msg || undefined);
      return subcategoryAdminExternalConfigService.postBan(row.id, msg || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategory-admin', 'external-config'] });
      setModal(null);
      setMessage('');
      setActionError(null);
    },
    onError: (err: unknown) => setActionError(getApiErrorMessage(err, 'Action failed.')),
  });

  if (isLoading) return <div className="admin-loading-state">Loading…</div>;

  if (postId) {
    return (
      <SubCategoryExternalPostConversationView
        postId={postId}
        preview={rows.find((r) => r.id === postId) ?? null}
        onBack={closeView}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <div className="admin-empty-state">
        <p>No school-approved external posts awaiting your review. External jobs are approved by school admin only.</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Post</th>
              <th>Category</th>
              <th>External admin</th>
              <th>Subcategory status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="admin-table__strong">{row.title}</td>
                <td>{row.externalCategory.name}</td>
                <td>{row.externalAdmin.name}</td>
                <td>
                  <span className={externalPostStatusPillClass(row.subcategoryStatus ?? 'pending')}>
                    {externalPostStatusLabel(row.subcategoryStatus ?? 'pending')}
                  </span>
                </td>
                <td>
                  <div className="admin-table-actions justify-content-end flex-wrap">
                    <button type="button" className="admin-icon-btn admin-icon-btn--edit" title="View" aria-label="View" onClick={() => openView(row.id)}>
                      <i className="bi bi-eye" aria-hidden />
                    </button>
                    <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => { setModal({ row, action: 'query' }); setMessage(''); }}>Send query</button>
                    <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => { setModal({ row, action: 'approve' }); setMessage(''); }}>Approve</button>
                    <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => { setModal({ row, action: 'reject' }); setMessage(''); }}>Reject</button>
                    <button type="button" className="admin-btn-danger admin-btn-sm" onClick={() => { setModal({ row, action: 'ban' }); setMessage(''); }}>Ban</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal ? (
        <div className="admin-modal-overlay admin-modal-overlay--elevated" role="presentation" onClick={() => setModal(null)}>
          <div className="admin-modal admin-modal--wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__body">
              <h2 className="admin-modal__title">{modal.action === 'query' ? 'Send query' : modal.action}</h2>
              <textarea className="form-control mb-3" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
              {actionError ? <p className="small text-danger">{actionError}</p> : null}
              <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => setModal(null)}>Cancel</button>
                <button type="button" className="admin-btn-primary admin-btn-sm" disabled={actionMutation.isPending} onClick={() => actionMutation.mutate()}>
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
