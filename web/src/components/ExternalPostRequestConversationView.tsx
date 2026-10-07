import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExternalPostRequestRow } from '../services/external-admin-post-requests.service';
import { externalAdminPostRequestsService } from '../services/external-admin-post-requests.service';
import { schoolAdminExternalPostRequestsService } from '../services/school-admin-external-post-requests.service';
import { postThreadMessages } from '../utils/externalPostRequestThread';
import { externalPostStatusLabel, externalPostStatusPillClass } from '../utils/externalPostRequestStatus';
import { getApiErrorMessage } from '../utils/apiError';
import { imageSrc } from '../utils/image';
import { CreateJobLivePreview } from './CreateJobLivePreview';
import { CreateCampaignLivePreview } from './CreateCampaignLivePreview';
import { CreateOfferLivePreview } from './CreateOfferLivePreview';
import { externalPostRowToCampaignPreview, isExternalCampaignPost } from '../utils/externalCampaignPostView';
import { externalPostRowToJobPreview, isExternalJobPost } from '../utils/externalJobPostView';
import { externalPostContentTypeLabel, externalPostRowToOfferPreview, isExternalOfferPost } from '../utils/externalOfferPostView';

export type ExternalPostDetailRole = 'external' | 'school';

type Props = {
  role: ExternalPostDetailRole;
  requestId: string;
  preview?: ExternalPostRequestRow | null;
  onBack: () => void;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function parseImages(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function isClosed(status: string) {
  return status === 'approved' || status === 'rejected' || status === 'banned';
}

export function ExternalPostRequestConversationView({ role, requestId, preview, onBack }: Props) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);

  const queryKey =
    role === 'external'
      ? ['external-admin', 'post-request', requestId]
      : ['school-admin', 'external-post-request', requestId];

  const { data: request, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      role === 'external'
        ? externalAdminPostRequestsService.getRequest(requestId)
        : schoolAdminExternalPostRequestsService.getRequest(requestId),
  });

  const row = request ?? preview;
  const messages = useMemo(() => (row ? postThreadMessages(row) : []), [row]);
  const images = useMemo(() => parseImages(row?.imageUrls ?? null), [row?.imageUrls]);

  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      if (role === 'external') return externalAdminPostRequestsService.reply(requestId, message);
      return schoolAdminExternalPostRequestsService.reply(requestId, message);
    },
    onSuccess: () => {
      setReply('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['external-admin', 'post-requests'] });
      queryClient.invalidateQueries({ queryKey: ['school-admin', 'external-post-requests'] });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, 'Failed to send reply.')),
  });

  useEffect(() => {
    setReply('');
    setError(null);
  }, [requestId]);

  if (isLoading && !row) return <div className="admin-loading-state">Loading…</div>;
  if (!row) {
    return (
      <div className="admin-empty-state">
        <p>Post not found.</p>
        <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={onBack}>Back</button>
      </div>
    );
  }

  const canReply = !isClosed(row.status);

  return (
    <div className="admin-pipeline-conversation">
      <div className="admin-pipeline-conversation__toolbar">
        <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={onBack}>
          <i className="bi bi-arrow-left me-1" aria-hidden />
          Back to list
        </button>
      </div>

      <div className="admin-pipeline-conversation__header">
        <div className="external-pipeline-detail-meta mb-3">
          <div>
            <span className="text-muted small">Type</span>
            <div className="fw-semibold">{externalPostContentTypeLabel(row)}</div>
          </div>
          <div>
            <span className="text-muted small">External admin</span>
            <div className="fw-semibold">{row.externalAdmin?.name ?? '—'}</div>
            <div className="small text-muted">{row.externalAdmin?.email ?? ''}</div>
          </div>
          <div>
            <span className="text-muted small">School</span>
            <div className="fw-semibold">{row.school.name}</div>
            <div className="small text-muted">{row.school.city}</div>
          </div>
          <div>
            <span className="text-muted small">Review status</span>
            <div>
              <span className={externalPostStatusPillClass(row.status)}>{externalPostStatusLabel(row.status)}</span>
            </div>
          </div>
          <div>
            <span className="text-muted small">Submitted</span>
            <div className="small">{formatWhen(row.createdAt)}</div>
          </div>
        </div>

        {isExternalJobPost(row) || isExternalOfferPost(row) || isExternalCampaignPost(row) ? null : (
          <>
            <h2 className="admin-pipeline-conversation__title">{row.title}</h2>
            <p className="small text-muted mb-2">{row.externalCategory.name}</p>
            {row.description ? <p className="small mt-2 mb-0" style={{ whiteSpace: 'pre-wrap' }}>{row.description}</p> : null}
            {row.eventLocation || row.eventDate ? (
              <p className="small text-muted mb-0 mt-1">
                {row.eventDate ? new Date(row.eventDate).toLocaleDateString() : ''}
                {row.eventStartTime ? ` · ${row.eventStartTime}` : ''}
                {row.eventLocation ? ` · ${row.eventLocation}` : ''}
              </p>
            ) : null}
            {row.externalLink ? (
              <p className="small mb-0 mt-1">
                <a href={row.externalLink} target="_blank" rel="noreferrer">{row.externalLink}</a>
              </p>
            ) : null}
            {images.length > 0 ? (
              <div className="d-flex flex-wrap gap-2 mt-2">
                {images.map((url) => (
                  <img key={url} src={imageSrc(url)} alt="" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>

      {isExternalJobPost(row) ? (
        <div className="external-job-preview-wrap external-job-preview-wrap--detail mb-4">
          <CreateJobLivePreview
            {...externalPostRowToJobPreview(row)}
            layoutVariant="web"
            interactiveDescription={role === 'school'}
            schoolAudience={role === 'school'}
          />
        </div>
      ) : null}

      {isExternalOfferPost(row) ? (
        <div className="external-offer-preview-wrap external-offer-preview-wrap--detail mb-4">
          <CreateOfferLivePreview
            {...externalPostRowToOfferPreview(row)}
            layoutVariant="web"
            interactiveDescription={role === 'school'}
            schoolAudience={role === 'school'}
          />
        </div>
      ) : null}

      {isExternalCampaignPost(row) ? (
        <div className="external-offer-preview-wrap external-offer-preview-wrap--detail mb-4">
          <CreateCampaignLivePreview
            {...externalPostRowToCampaignPreview(row)}
            layoutVariant="web"
            interactiveDescription={role === 'school'}
            schoolAudience={role === 'school'}
          />
        </div>
      ) : null}

      <h3 className="h6 mb-2">School admin queries</h3>
      <div className="admin-pipeline-conversation__thread-wrap">
        <div className="admin-pipeline-thread admin-pipeline-thread--fill" aria-live="polite">
          {messages.length === 0 ? (
            <p className="small text-muted mb-0">No messages yet.</p>
          ) : (
            messages.map((msg) => {
              const mine = role === 'external' ? msg.senderRole === 'external_admin' : msg.senderRole === 'school_admin';
              const label = msg.senderRole === 'external_admin' ? 'You' : msg.senderRole === 'school_admin' ? 'School admin' : 'System';
              return (
                <div
                  key={msg.id}
                  className={`admin-pipeline-thread__msg${mine ? ' admin-pipeline-thread__msg--mine' : ' admin-pipeline-thread__msg--theirs'}`}
                >
                  <div className="admin-pipeline-thread__label">{label}</div>
                  <div className="admin-pipeline-thread__body">{msg.body}</div>
                  <div className="admin-pipeline-thread__time">{formatWhen(msg.createdAt)}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="admin-pipeline-conversation__composer">
        {canReply ? (
          <>
            <label className="form-label small fw-semibold">Your message</label>
            <textarea className="form-control mb-2" rows={3} maxLength={2000} value={reply} onChange={(e) => setReply(e.target.value)} />
            {error ? <p className="small text-danger">{error}</p> : null}
            <button type="button" className="admin-btn-primary" disabled={replyMutation.isPending || !reply.trim()} onClick={() => replyMutation.mutate(reply.trim())}>
              {replyMutation.isPending ? 'Sending…' : 'Send reply'}
            </button>
          </>
        ) : (
          <p className="small text-muted mb-0">This post request is closed.</p>
        )}
      </div>
    </div>
  );
}
