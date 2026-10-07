import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SubCategoryExternalLinkConversationView } from './SubCategoryExternalLinkConversationView';
import { subcategoryAdminExternalConfigService, type SubcategoryExternalLinkRow } from '../services/subcategory-admin-external-config.service';
import { externalPostStatusLabel, externalPostStatusPillClass } from '../utils/externalPostRequestStatus';
import { getApiErrorMessage } from '../utils/apiError';

type Action = 'query' | 'approve' | 'reject' | 'ban';

export function SubCategoryAdminExternalCategoryApprovalPanel() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const linkId = searchParams.get('linkId');
  const [modal, setModal] = useState<{ row: SubcategoryExternalLinkRow; action: Action } | null>(null);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['subcategory-admin', 'external-config', 'category-links'],
    queryFn: subcategoryAdminExternalConfigService.listCategoryLinks,
  });

  const openView = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'category-approval');
    next.set('linkId', id);
    setSearchParams(next);
  };

  const closeView = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('linkId');
    setSearchParams(next);
  };

  const actionMutation = useMutation({
    mutationFn: async () => {
      if (!modal) throw new Error('No action');
      const { row, action } = modal;
      const msg = message.trim();
      if (action === 'query') {
        if (!msg) throw new Error('Query message is required.');
        return subcategoryAdminExternalConfigService.linkSendQuery(row.id, msg);
      }
      if (action === 'approve') return subcategoryAdminExternalConfigService.linkApprove(row.id, msg || undefined);
      if (action === 'reject') return subcategoryAdminExternalConfigService.linkReject(row.id, msg || undefined);
      return subcategoryAdminExternalConfigService.linkBan(row.id, msg || undefined);
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

  if (linkId) {
    return (
      <SubCategoryExternalLinkConversationView
        linkId={linkId}
        preview={rows.find((r) => r.id === linkId) ?? null}
        onBack={closeView}
      />
    );
  }

  if (rows.length === 0) {
    return <div className="admin-empty-state"><p>No external category name approval requests yet.</p></div>;
  }

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>External category</th>
              <th>External admin</th>
              <th>Subcategory</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="admin-table__strong">{row.externalCategory.name}</td>
                <td>{row.externalAdmin.name}</td>
                <td>{row.subCategory.name}</td>
                <td><span className={externalPostStatusPillClass(row.status)}>{externalPostStatusLabel(row.status)}</span></td>
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
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button type="button" className="admin-btn-primary" disabled={actionMutation.isPending} onClick={() => actionMutation.mutate()}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
