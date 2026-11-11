export function formatSchoolTenure(createdAt: string, tenureMonths: number | null | undefined): string {
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) {
    return tenureMonths ? `${tenureMonths} months` : '—';
  }
  const startLabel = start.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
    day: 'numeric',
  });
  if (tenureMonths == null || tenureMonths <= 0) {
    return `Created ${startLabel}`;
  }
  const end = new Date(start);
  end.setMonth(end.getMonth() + tenureMonths);
  const endLabel = end.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
    day: 'numeric',
  });
  return `Created ${startLabel} · Valid till ${endLabel} (${tenureMonths} months)`;
}
