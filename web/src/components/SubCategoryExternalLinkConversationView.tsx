import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SubcategoryExternalLinkRow } from '../services/subcategory-admin-external-config.service';
import { subcategoryAdminExternalConfigService } from '../services/subcategory-admin-external-config.service';
import { externalPostStatusLabel, externalPostStatusPillClass } from '../utils/externalPostRequestStatus';
import { getApiErrorMessage } from '../utils/apiError';

type Props = {
  linkId: string;
  preview?: SubcategoryExternalLinkRow | null;
  onBack: () => void;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function SubCategoryExternalLinkConversationView({ linkId, preview, onBack }: Props) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: row, isLoading } = useQuery({
    queryKey: ['subcategory-admin', 'external-link', linkId],
    queryFn: () => subcategoryAdminExternalConfigService.getCategoryLink(linkId),
  });

  const data = row ?? preview;
  const messages = useMemo(() => data?.threadMessages ?? [], [data]);

  const closed = data ? ['approved', 'rejected', 'banned'].includes(data.status) : true;

  const replyMutation = useMutation({
    mutationFn: (message: string) => subcategoryAdminExternalConfigService.linkReply(linkId, message),
    onSuccess: () => {
      setReply('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['subcategory-admin', 'external-config'] });
      queryClient.invalidateQueries({ queryKey: ['subcategory-admin', 'external-link', linkId] });
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, 'Failed to send reply.')),
  });

  useEffect(() => {
    setReply('');
    setError(null);
  }, [linkId]);

  if (isLoading && !data) return <div className="admin-loading-state">Loading…</div>;
  if (!data) return null;

  return (
    <div className="admin-pipeline-conversation">
      <div className="admin-pipeline-conversation__toolbar">
        <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={onBack}>
          <i className="bi bi-arrow-left me-1" aria-hidden />
          Back to list
        </button>
      </div>
      <h2 className="admin-pipeline-conversation__title">{data.externalCategory.name}</h2>
      <div className="external-pipeline-detail-meta mb-3">
        <div>
          <span className="text-muted small">External admin</span>
          <div className="fw-semibold">{data.externalAdmin.name}</div>
          <div className="small text-muted">{data.externalAdmin.email}</div>
        </div>
        <div>
          <span className="text-muted small">Subcategory</span>
          <div className="fw-semibold">{data.subCategory.name}</div>
        </div>
        <div>
          <span className="text-muted small">Status</span>
          <span className={externalPostStatusPillClass(data.status)}>{externalPostStatusLabel(data.status)}</span>
        </div>
      </div>
      <div className="admin-pipeline-thread admin-pipeline-thread--fill mb-3">
        {messages.length === 0 ? (
          <p className="small text-muted mb-0">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`admin-pipeline-thread__msg${msg.senderRole === 'subcategory_admin' ? ' admin-pipeline-thread__msg--mine' : ' admin-pipeline-thread__msg--theirs'}`}
            >
              <div className="admin-pipeline-thread__body">{msg.body}</div>
              <div className="admin-pipeline-thread__time">{formatWhen(msg.createdAt)}</div>
            </div>
          ))
        )}
      </div>
      {!closed ? (
        <>
          <textarea className="form-control mb-2" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} />
          {error ? <p className="small text-danger">{error}</p> : null}
          <button type="button" className="admin-btn-primary admin-btn-sm" disabled={!reply.trim() || replyMutation.isPending} onClick={() => replyMutation.mutate(reply.trim())}>
            Send reply
          </button>
        </>
      ) : (
        <p className="small text-muted">Request closed.</p>
      )}
    </div>
  );
}
