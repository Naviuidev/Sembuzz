import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PipelineRequestRow, PipelineThreadMessage } from '../services/external-admin-pipeline.service';
import { externalAdminPipelineService } from '../services/external-admin-pipeline.service';
import { schoolAdminExternalPipelineService } from '../services/school-admin-external-pipeline.service';
import { pipelineThreadMessages } from '../utils/externalPipelineThread';
import { pipelineStatusLabel, pipelineStatusPillClass } from '../utils/externalPipelineStatus';
import { getApiErrorMessage } from '../utils/apiError';

export type ExternalPipelineDetailRole = 'external' | 'school';

type Props = {
  role: ExternalPipelineDetailRole;
  requestId: string;
  preview?: PipelineRequestRow | null;
  onBack: () => void;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function isConversationClosed(status: string) {
  return status === 'approved' || status === 'rejected' || status === 'banned';
}

export function ExternalPipelineRequestConversationView({ role, requestId, preview, onBack }: Props) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);

  const queryKey =
    role === 'external'
      ? ['external-admin', 'pipeline', 'request', requestId]
      : ['school-admin', 'external-pipeline', 'request', requestId];

  const { data: request, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      role === 'external'
        ? externalAdminPipelineService.getRequest(requestId)
        : schoolAdminExternalPipelineService.getRequest(requestId),
  });

  const row = request ?? preview;

  const messages = useMemo(() => {
    if (request) return pipelineThreadMessages(request);
    if (preview) return pipelineThreadMessages(preview);
    return [] as PipelineThreadMessage[];
  }, [request, preview]);

  const canReply = row ? !isConversationClosed(row.status) : false;

  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      if (role === 'external') {
        return externalAdminPipelineService.reply(requestId, message);
      }
      return schoolAdminExternalPipelineService.reply(requestId, message);
    },
    onSuccess: () => {
      setReply('');
      setError(null);
      if (role === 'external') {
        queryClient.invalidateQueries({ queryKey: ['external-admin', 'pipeline'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['school-admin', 'external-pipeline'] });
      }
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: unknown) => {
      setError(getApiErrorMessage(err, 'Failed to send reply.'));
    },
  });

  useEffect(() => {
    setReply('');
    setError(null);
  }, [requestId]);

  if (isLoading && !row) {
    return <div className="admin-loading-state">Loading conversation…</div>;
  }

  if (!row) {
    return (
      <div className="admin-empty-state">
        <p>Request not found.</p>
        <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={onBack}>
          Back to list
        </button>
      </div>
    );
  }

  const heading =
    role === 'external' ? row.school.name : `${row.externalAdmin.name} · ${row.externalCategory.name}`;

  return (
    <div className="admin-pipeline-conversation">
      <div className="admin-pipeline-conversation__toolbar">
        <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={onBack}>
          <i className="bi bi-arrow-left me-1" aria-hidden />
          Back to list
        </button>
      </div>

      <div className="admin-pipeline-conversation__header">
        <h2 className="admin-pipeline-conversation__title">{heading}</h2>
        <div className="external-pipeline-detail-meta">
          <div>
            <span className="text-muted small">Category</span>
            <div className="fw-semibold">{row.externalCategory.name}</div>
          </div>
          <div>
            <span className="text-muted small">Status</span>
            <div>
              <span className={pipelineStatusPillClass(row.status)}>{pipelineStatusLabel(row.status)}</span>
            </div>
          </div>
          {role === 'school' ? (
            <div>
              <span className="text-muted small">External admin</span>
              <div className="fw-semibold">{row.externalAdmin.name}</div>
              <div className="small text-muted">{row.externalAdmin.email}</div>
              <div className="small text-muted admin-table__mono">{row.externalAdmin.refNum}</div>
            </div>
          ) : (
            <div>
              <span className="text-muted small">School</span>
              <div className="fw-semibold">{row.school.name}</div>
              <div className="small text-muted">{row.school.city}</div>
              <div className="small text-muted admin-table__mono">{row.school.refNum}</div>
              {row.school.domain ? <div className="small text-muted">{row.school.domain}</div> : null}
            </div>
          )}
          <div>
            <span className="text-muted small">Requested</span>
            <div className="small">{formatWhen(row.createdAt)}</div>
          </div>
        </div>
      </div>

      <div className="admin-pipeline-conversation__thread-wrap">
        <div className="admin-pipeline-thread admin-pipeline-thread--fill" aria-live="polite">
          {messages.length === 0 ? (
            <p className="small text-muted mb-0">No messages yet.</p>
          ) : (
            messages.map((msg) => {
              const mine =
                role === 'external' ? msg.senderRole === 'external_admin' : msg.senderRole === 'school_admin';
              const label =
                msg.senderRole === 'external_admin'
                  ? 'External admin'
                  : msg.senderRole === 'school_admin'
                    ? 'School admin'
                    : 'System';
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
            <textarea
              className="form-control mb-2"
              rows={3}
              maxLength={2000}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type a reply…"
              disabled={replyMutation.isPending}
            />
            {error ? <p className="small text-danger">{error}</p> : null}
            <button
              type="button"
              className="admin-btn-primary"
              disabled={replyMutation.isPending || !reply.trim()}
              onClick={() => replyMutation.mutate(reply.trim())}
            >
              {replyMutation.isPending ? 'Sending…' : 'Send reply'}
            </button>
          </>
        ) : (
          <p className="small text-muted mb-0">This request is closed — no further replies.</p>
        )}
      </div>
    </div>
  );
}
