/** Post lifecycle statuses for Event rows. */
export const EVENT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  REVERTED: 'reverted',
  REJECTED: 'rejected',
  SCHEDULE_MISSED: 'schedule_missed',
  CANCELLED: 'cancelled',
  SUPERSEDED: 'superseded',
  /** @deprecated migrated to published */
  APPROVED_LEGACY: 'approved',
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

/** Visible on public feed */
export const EVENT_PUBLIC_STATUSES = [
  EVENT_STATUS.PUBLISHED,
  EVENT_STATUS.APPROVED_LEGACY,
] as const;

/** Awaiting category admin review */
export const EVENT_PENDING_APPROVAL_STATUSES = [
  EVENT_STATUS.PENDING,
  EVENT_STATUS.SCHEDULE_MISSED,
] as const;

/** Approved and waiting for publishAt */
export const EVENT_SCHEDULED_STATUSES = [EVENT_STATUS.SCHEDULED] as const;

/** Shown in admin "approved / scheduled" lists */
export const EVENT_APPROVED_LIST_STATUSES = [
  EVENT_STATUS.PUBLISHED,
  EVENT_STATUS.SCHEDULED,
  EVENT_STATUS.APPROVED_LEGACY,
] as const;

export function isEventPubliclyVisible(status: string): boolean {
  return (EVENT_PUBLIC_STATUSES as readonly string[]).includes(status);
}

export function parsePublishAt(value?: string | null): Date | null {
  if (!value || typeof value !== 'string' || !value.trim()) return null;
  const d = new Date(value.trim());
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function resolveSchoolAdminCreateStatus(publishAt: Date | null, now = new Date()): {
  status: string;
  publishedAt: Date | null;
} {
  if (!publishAt || publishAt.getTime() <= now.getTime()) {
    return { status: EVENT_STATUS.PUBLISHED, publishedAt: now };
  }
  return { status: EVENT_STATUS.SCHEDULED, publishedAt: null };
}

export function resolveCategoryAdminApproveStatus(
  publishAt: Date | null,
  options: { publishNow?: boolean; newPublishAt?: Date | null; wasScheduleMissed?: boolean },
  now = new Date(),
): { status: string; publishAt: Date | null; publishedAt: Date | null } {
  const effectivePublishAt = options.newPublishAt ?? publishAt;

  if (options.publishNow === true || !effectivePublishAt) {
    return { status: EVENT_STATUS.PUBLISHED, publishAt: effectivePublishAt, publishedAt: now };
  }

  if (effectivePublishAt.getTime() > now.getTime()) {
    return {
      status: EVENT_STATUS.SCHEDULED,
      publishAt: effectivePublishAt,
      publishedAt: null,
    };
  }

  if (options.wasScheduleMissed && options.publishNow === false && options.newPublishAt) {
    return {
      status: EVENT_STATUS.SCHEDULED,
      publishAt: options.newPublishAt,
      publishedAt: null,
    };
  }

  // Scheduled time passed — publish immediately unless caller sets publishNow false with newPublishAt
  return { status: EVENT_STATUS.PUBLISHED, publishAt: effectivePublishAt, publishedAt: now };
}
