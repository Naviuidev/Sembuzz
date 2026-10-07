import type { ExternalPostRequestRow, ExternalPostThreadMessage } from '../services/external-admin-post-requests.service';

export function postThreadMessages(row: ExternalPostRequestRow): ExternalPostThreadMessage[] {
  if (row.threadMessages && row.threadMessages.length > 0) {
    return row.threadMessages;
  }
  const legacy: ExternalPostThreadMessage[] = [];
  if (row.schoolAdminMessage?.trim()) {
    legacy.push({
      id: `${row.id}-legacy-school`,
      senderRole: 'school_admin',
      body: row.schoolAdminMessage.trim(),
      createdAt: row.updatedAt,
    });
  }
  return legacy;
}

export function postLastSenderRole(row: ExternalPostRequestRow): string | null {
  const msgs = postThreadMessages(row);
  if (msgs.length === 0) return null;
  return msgs[msgs.length - 1].senderRole;
}

export function postAwaitingExternalReply(row: ExternalPostRequestRow): boolean {
  if (row.status === 'approved' || row.status === 'rejected' || row.status === 'banned') return false;
  return postLastSenderRole(row) === 'school_admin';
}
