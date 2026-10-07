import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SubcategoryExternalPostRow } from '../services/subcategory-admin-external-config.service';
import { subcategoryAdminExternalConfigService } from '../services/subcategory-admin-external-config.service';
import { CreateJobLivePreview } from './CreateJobLivePreview';
import { externalPostStatusLabel, externalPostStatusPillClass } from '../utils/externalPostRequestStatus';
import { getApiErrorMessage } from '../utils/apiError';

type Props = {
  postId: string;
  preview?: SubcategoryExternalPostRow | null;
  onBack: () => void;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function SubCategoryExternalPostConversationView({ postId, preview, onBack }: Props) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: row, isLoading } = useQuery({
    queryKey: ['subcategory-admin', 'external-post', postId],
    queryFn: () => subcategoryAdminExternalConfigService.getPost(postId),
  });

  const data = row ?? preview;
  const messages = useMemo(() => data?.subcategoryThreadMessages ?? [], [data]);
  const subStatus = data?.subcategoryStatus ?? 'pending';
  const closed = ['approved', 'rejected', 'banned'].includes(subStatus);

  const replyMutation = useMutation({
    mutationFn: (message: string) => subcategoryAdminExternalConfigService.postReply(postId, message),
    onSuccess: () => {
      setReply('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['subcategory-admin', 'external-config'] });
      queryClient.invalidateQueries({ queryKey: ['subcategory-admin', 'external-post', postId] });
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, 'Failed to send reply.')),
  });

  useEffect(() => {
    setReply('');
    setError(null);
  }, [postId]);

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
      <h2 className="admin-pipeline-conversation__title">{data.title}</h2>
      <p className="small text-muted">{data.externalCategory.name} · {data.externalAdmin.name}</p>
      <div className="mb-3">
        <span className={externalPostStatusPillClass(subStatus)}>{externalPostStatusLabel(subStatus)}</span>
        <span className="small text-muted ms-2">School approved</span>
      </div>
      {data.contentType === 'job' || data.companyName ? (
        <div className="mb-3">
          <CreateJobLivePreview
            jobTitle={data.title}
            companyName={data.companyName ?? ''}
            companyLogoUrl={data.companyLogoUrl ?? ''}
            jobType={data.jobType ?? ''}
            workMode={data.workMode ?? ''}
            location={data.jobLocation ?? ''}
            jobDescription={data.description ?? ''}
            eligibilityRequirements={data.eligibilityRequirements ?? ''}
            skillsRequired={data.skillsRequired ?? ''}
            experienceRequired={data.experienceRequired ?? ''}
            salaryStipend={data.salaryStipend ?? ''}
            applicationDeadline={data.applicationDeadline ? data.applicationDeadline.slice(0, 10) : ''}
            applicationMethod={data.applicationMethod ?? 'external_url'}
            applicationTarget={data.applicationTarget ?? ''}
            contactPerson={data.contactPerson ?? ''}
            contactEmail={data.contactEmail ?? ''}
            contactPhone={data.contactPhone ?? ''}
            postedByOrganization={data.postedByOrganization ?? ''}
            applyButtonEnabled={data.applyButtonEnabled}
            saveJobButtonEnabled={data.saveJobButtonEnabled}
            categoryName={data.externalCategory.name}
            layoutVariant="web"
          />
        </div>
      ) : data.description ? (
        <p className="small" style={{ whiteSpace: 'pre-wrap' }}>{data.description}</p>
      ) : null}
      <div className="admin-pipeline-thread admin-pipeline-thread--fill mb-3">
        {messages.length === 0 ? (
          <p className="small text-muted mb-0">No subcategory admin messages yet.</p>
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
        <p className="small text-muted">Review closed.</p>
      )}
    </div>
  );
}
