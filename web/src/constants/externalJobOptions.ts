export const EXTERNAL_JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract'] as const;
export const EXTERNAL_WORK_MODES = ['On-site', 'Hybrid', 'Remote'] as const;
export const EXTERNAL_EXPERIENCE_LEVELS = [
  'Fresher',
  '0–1 years',
  '1–2 years',
  '2–3 years',
  '3–5 years',
  '5+ years',
] as const;
export const EXTERNAL_JOB_PUBLISH_STATUSES = ['draft', 'published', 'closed'] as const;

/** Platform external category that supports Apply / Save job toggles on job posts. */
export function isExternalJobShareCategory(categoryName: string) {
  const normalized = categoryName.trim().toLowerCase().replace(/[\s_-]+/g, '');
  return normalized === 'jobshare';
}

export function jobPublishStatusLabel(status: string) {
  if (status === 'draft') return 'Draft';
  if (status === 'published') return 'Published';
  if (status === 'closed') return 'Closed';
  return status;
}
