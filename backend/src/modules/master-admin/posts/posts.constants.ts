import { EVENT_PUBLIC_STATUSES, EVENT_SCHEDULED_STATUSES } from '../../events/event-publishing.constants';

export { EVENT_STATUS } from '../../events/event-publishing.constants';

export const MASTER_ADMIN_POST_STATUSES = [
  ...EVENT_PUBLIC_STATUSES,
  ...EVENT_SCHEDULED_STATUSES,
  'pending',
  'draft',
] as const;
