export const EXTERNAL_CAMPAIGN_TYPES = [
  'Campus recruitment campaign',
  'Brand awareness campaign',
  'Student ambassador campaign',
  'Hackathon campaign',
  'Competition',
  'Workshop',
  'Webinar',
  'Product promotion',
] as const;

export const EXTERNAL_CAMPAIGN_PUBLISH_STATUSES = ['draft', 'published', 'expired'] as const;

export function isExternalCampaignCategory(categoryName: string) {
  const normalized = categoryName.trim().toLowerCase().replace(/[\s_-]+/g, '');
  return normalized === 'campaign' || normalized === 'campaigns';
}

export function campaignPublishStatusLabel(status: string) {
  if (status === 'draft') return 'Draft';
  if (status === 'published') return 'Published';
  if (status === 'expired') return 'Expired';
  return status;
}
