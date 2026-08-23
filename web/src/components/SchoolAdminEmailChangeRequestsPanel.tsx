import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfigureAdminEmailModal } from './ConfigureAdminEmailModal';
import {
  formatAdminRoleLabel,
  schoolAdminEmailChangeRequestsService,
  type AdminEmailChangeRequest,
} from '../services/admin-email-change-requests.service';
import { invalidateAdminActionItems } from '../services/admin-action-items.service';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

export function SchoolAdminEmailChangeRequestsPanel({
  requests,
  isLoading,
}: {
  requests: AdminEmailChangeRequest[];
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [activeRequest, setActiveRequest] = useState<AdminEmailChangeRequest | null>(null);

  const configureMutation = useMutation({
    mutationFn: ({ requestId, newEmail }: { requestId: string; newEmail: string }) =>
      schoolAdminEmailChangeRequestsService.configureEmail(requestId, newEmail),
  });

  const confirmMutation = useMutation({
    mutationFn: ({ requestId, otp }: { requestId: string; otp: string }) =>
      schoolAdminEmailChangeRequestsService.confirmNewEmail(requestId, otp),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin', 'email-change-requests'] });
      void invalidateAdminActionItems(queryClient, 'school-admin');
      void queryClient.invalidateQueries({ queryKey: ['category-admins'] });
      void queryClient.invalidateQueries({ queryKey: ['school-admin', 'subcategory-admins'] });
      void queryClient.invalidateQueries({ queryKey: ['school-admin', 'ads-admins'] });
    },
  });

  if (isLoading) {
    return (
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 0 }}>
        <div className="card-body p-4">
          <p className="text-muted mb-0">Loading email change requests…</p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <>
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 0 }}>
        <div className="card-body p-4">
          <h2 className="h5 mb-3" style={{ color: TEXT_DARK, fontWeight: 500 }}>
            Pending email change requests
          </h2>
          <p className="small text-muted mb-3">
            Requests verified by OTP and waiting for your review.
          </p>
          <div className="d-flex flex-column gap-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="border rounded p-3"
                style={{ borderColor: '#dee2e6', backgroundColor: '#fafbfc' }}
              >
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                  <div>
                    <div className="fw-semibold" style={{ color: TEXT_DARK }}>
                      {req.targetName}
                    </div>
                    <div className="small" style={{ color: TEXT_MUTED }}>
                      {formatAdminRoleLabel(req.targetRole)} · {req.targetEmail}
                    </div>
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        border: '1px solid #ffeeba',
                      }}
                    >
                      {req.status === 'pending_new_email_otp' ? 'Awaiting new email OTP' : 'Pending review'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveRequest(req)}
                    >
                      Configure email
                    </button>
                  </div>
                </div>
                <p className="small mb-2" style={{ color: TEXT_DARK }}>
                  <strong>Reason:</strong> {req.reason}
                </p>
                {req.proposedNewEmail ? (
                  <p className="small mb-2" style={{ color: TEXT_DARK }}>
                    <strong>New email:</strong> {req.proposedNewEmail}
                  </p>
                ) : null}
                <p className="small text-muted mb-0">
                  Requested by {req.initiatedByName} · {new Date(req.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfigureAdminEmailModal
        show={!!activeRequest}
        request={activeRequest}
        onClose={() => setActiveRequest(null)}
        onConfigureEmail={async (requestId, newEmail) => {
          const result = await configureMutation.mutateAsync({ requestId, newEmail });
          void queryClient.invalidateQueries({ queryKey: ['school-admin', 'email-change-requests'] });
          return { maskedEmail: result.maskedEmail };
        }}
        onConfirmNewEmail={async (requestId, otp) => {
          return confirmMutation.mutateAsync({ requestId, otp });
        }}
      />
    </>
  );
}
