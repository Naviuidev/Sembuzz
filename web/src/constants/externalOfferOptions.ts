export const EXTERNAL_OFFER_CATEGORIES = [
  'Student discounts',
  'Product offers',
  'Course discounts',
  'Software subscriptions',
  'Food/restaurant offers',
  'Shopping offers',
  'Event offers',
  'Student-exclusive deals',
] as const;

export const EXTERNAL_OFFER_DISCOUNT_TYPES = ['percentage', 'flat', 'free'] as const;
export const EXTERNAL_OFFER_AVAILABILITY = ['online', 'offline', 'both'] as const;
export const EXTERNAL_OFFER_PUBLISH_STATUSES = ['draft', 'published', 'expired'] as const;

export function isExternalOffersCategory(categoryName: string) {
  const normalized = categoryName.trim().toLowerCase().replace(/[\s_-]+/g, '');
  return normalized === 'offers';
}

export function offerPublishStatusLabel(status: string) {
  if (status === 'draft') return 'Draft';
  if (status === 'published') return 'Published';
  if (status === 'expired') return 'Expired';
  return status;
}

export function offerDiscountTypeLabel(type: string) {
  if (type === 'percentage') return 'Percentage';
  if (type === 'flat') return 'Flat';
  if (type === 'free') return 'Free';
  return type;
}

export function offerAvailabilityLabel(value: string) {
  if (value === 'online') return 'Online';
  if (value === 'offline') return 'Offline';
  if (value === 'both') return 'Online & offline';
  return value;
}
