import type { ExternalPostRequestRow } from '../services/userExternalFeed';

export type SavedCollectionTab = 'news' | 'jobs' | 'offers' | 'campaigns';

export function isExternalJobPost(row: ExternalPostRequestRow): boolean {
  return (row.contentType ?? '').toLowerCase() === 'job';
}

export function isExternalOfferPost(row: ExternalPostRequestRow): boolean {
  return (row.contentType ?? '').toLowerCase() === 'offer';
}

export function isExternalCampaignPost(row: ExternalPostRequestRow): boolean {
  const t = (row.contentType ?? '').toLowerCase();
  return t === 'campaign' || t === 'event';
}

export function filterSavedExternalByTab(
  rows: ExternalPostRequestRow[],
  tab: Exclude<SavedCollectionTab, 'news'>,
): ExternalPostRequestRow[] {
  if (tab === 'jobs') return rows.filter((r) => isExternalJobPost(r));
  if (tab === 'offers') return rows.filter((r) => isExternalOfferPost(r));
  return rows.filter((r) => isExternalCampaignPost(r));
}

export function savedExternalSubtitle(row: ExternalPostRequestRow): string {
  if (isExternalJobPost(row)) {
    return row.companyName?.trim() || row.externalCategory?.name || 'Job';
  }
  if (isExternalOfferPost(row)) {
    return row.companyName?.trim() || row.externalCategory?.name || 'Offer';
  }
  if (isExternalCampaignPost(row)) {
    return row.companyName?.trim() || row.externalCategory?.name || 'Campaign';
  }
  return row.externalCategory?.name || 'External';
}

export function externalPostContentTypeLabel(row: ExternalPostRequestRow): string {
  if (isExternalJobPost(row)) return 'Job';
  if (isExternalOfferPost(row)) return 'Offer';
  if (isExternalCampaignPost(row)) return 'Campaign';
  return 'External';
}
