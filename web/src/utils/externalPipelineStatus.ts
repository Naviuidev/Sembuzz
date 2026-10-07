export function pipelineStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'query':
      return 'Query sent';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'banned':
      return 'Banned';
    default:
      return status;
  }
}

export function pipelineStatusPillClass(status: string): string {
  switch (status) {
    case 'approved':
      return 'admin-pill admin-pill--active';
    case 'pending':
      return 'admin-pill admin-pill--neutral';
    case 'query':
      return 'admin-pill admin-pill--feature';
    case 'rejected':
    case 'banned':
      return 'admin-pill admin-pill--inactive';
    default:
      return 'admin-pill admin-pill--neutral';
  }
}
