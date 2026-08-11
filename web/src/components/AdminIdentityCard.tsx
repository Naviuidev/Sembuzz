import { useState } from 'react';
import { AccountIdentityPanel } from './AccountIdentityPanel';
import { AdminEmailChangeRequestModal } from './AdminEmailChangeRequestModal';
import type { AdminEmailChangeTargetRole } from '../services/admin-email-change-requests.service';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

export function AdminIdentityCard({
  title,
  subtitle,
  userId,
  email,
  adminRole,
  targetRole,
  targetAdminId,
  onInitiateEmailRequest,
  onConfirmEmailRequestOtp,
}: {
  title: string;
  subtitle?: string;
  userId: string;
  email: string;
  adminRole: string;
  targetRole: AdminEmailChangeTargetRole;
  targetAdminId: string;
  onInitiateEmailRequest: (
    targetRole: AdminEmailChangeTargetRole,
    targetAdminId: string,
    reason: string,
  ) => Promise<{ requestId: string; maskedEmail: string }>;
  onConfirmEmailRequestOtp: (requestId: string, otp: string) => Promise<void>;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="mb-4">
      <div className="mb-2">
        <div className="fw-semibold" style={{ color: TEXT_DARK }}>
          {title}
        </div>
        {subtitle ? (
          <div className="small" style={{ color: TEXT_MUTED }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      <AccountIdentityPanel
        userId={userId}
        email={email}
        roleBadge={adminRole}
        mode="email-request"
        onSendEmailRequest={() => setShowModal(true)}
      />
      <AdminEmailChangeRequestModal
        show={showModal}
        adminName={title}
        currentEmail={email}
        onClose={() => setShowModal(false)}
        onInitiate={(reason) => onInitiateEmailRequest(targetRole, targetAdminId, reason)}
        onConfirmOtp={onConfirmEmailRequestOtp}
      />
    </div>
  );
}

export function resolvePlatformUserId(row: {
  userId?: string;
  platformUserId?: string;
}): string {
  return row.userId || row.platformUserId || '';
}
