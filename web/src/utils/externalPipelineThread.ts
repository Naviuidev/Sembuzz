import type { PipelineRequestRow, PipelineThreadMessage } from '../services/external-admin-pipeline.service';

export function pipelineThreadMessages(row: PipelineRequestRow): PipelineThreadMessage[] {
  if (row.threadMessages && row.threadMessages.length > 0) {
    return row.threadMessages;
  }
  const legacy: PipelineThreadMessage[] = [];
  if (row.requestMessage?.trim()) {
    legacy.push({
      id: `${row.id}-legacy-ext`,
      senderRole: 'external_admin',
      body: row.requestMessage.trim(),
      createdAt: row.createdAt,
    });
  }
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

export function pipelineLastSenderRole(row: PipelineRequestRow): string | null {
  const msgs = pipelineThreadMessages(row);
  if (msgs.length === 0) return null;
  return msgs[msgs.length - 1].senderRole;
}

export function pipelineAwaitingExternalReply(row: PipelineRequestRow): boolean {
  if (row.status === 'approved' || row.status === 'rejected' || row.status === 'banned') return false;
  return pipelineLastSenderRole(row) === 'school_admin';
}

export function pipelineAwaitingSchoolReply(row: PipelineRequestRow): boolean {
  if (row.status === 'approved' || row.status === 'rejected' || row.status === 'banned') return false;
  return pipelineLastSenderRole(row) === 'external_admin' && (row.status === 'query' || row.status === 'pending');
}
