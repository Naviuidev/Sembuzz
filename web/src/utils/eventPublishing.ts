/** Shared labels for event post statuses in admin UIs. */
export const EVENT_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-secondary' },
  pending: { label: 'Pending approval', className: 'bg-warning text-dark' },
  scheduled: { label: 'Scheduled', className: 'bg-info text-dark' },
  published: { label: 'Published', className: 'bg-success' },
  approved: { label: 'Published', className: 'bg-success' },
  reverted: { label: 'Changes requested', className: 'bg-secondary' },
  rejected: { label: 'Rejected', className: 'bg-danger' },
  schedule_missed: { label: 'Schedule missed', className: 'bg-danger' },
  cancelled: { label: 'Cancelled', className: 'bg-secondary' },
  superseded: { label: 'Superseded', className: 'bg-secondary' },
};

export function eventStatusBadge(status: string) {
  const s = EVENT_STATUS_LABELS[status] ?? { label: status, className: 'bg-secondary' };
  return { ...s };
}

export function formatPublishAt(iso: string | null | undefined): string {
  if (!iso) return 'Immediate on approval';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

/** Default datetime-local value: 1 hour from now, rounded to next 15 min */
export function defaultFutureDateTimeLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function dateTimeLocalToIso(value: string): string {
  return new Date(value).toISOString();
}
