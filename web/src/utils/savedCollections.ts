import type { ExternalPostRequestRow } from '../services/external-admin-post-requests.service';
import { isExternalCampaignPost } from './externalCampaignPostView';
import { isExternalJobPost } from './externalJobPostView';
import { isExternalOfferPost } from './externalOfferPostView';

export type SavedCollectionTab = 'news' | 'jobs' | 'offers' | 'campaigns';

export function parseSavedTabParam(value: string | null): SavedCollectionTab {
  if (value === 'jobs' || value === 'offers' || value === 'campaigns' || value === 'news') return value;
  return 'news';
}

export function filterSavedExternalByTab(
  rows: ExternalPostRequestRow[],
  tab: Exclude<SavedCollectionTab, 'news'>,
): ExternalPostRequestRow[] {
  if (tab === 'jobs') return rows.filter((r) => isExternalJobPost(r));
  if (tab === 'offers') return rows.filter((r) => isExternalOfferPost(r));
  return rows.filter((r) => isExternalCampaignPost(r) || r.contentType === 'event');
}

/** Primary line under title on saved list rows */
export function savedExternalSubtitle(row: ExternalPostRequestRow): string {
  const r = row as ExternalPostRequestRow & {
    companyName?: string | null;
    offerCategory?: string | null;
    campaignType?: string | null;
    brandName?: string | null;
    organizationName?: string | null;
  };

  if (isExternalJobPost(row)) {
    return r.companyName?.trim() || row.externalCategory?.name || 'Job';
  }
  if (isExternalOfferPost(row)) {
    return r.companyName?.trim() || r.brandName?.trim() || r.offerCategory?.trim() || row.externalCategory?.name || 'Offer';
  }
  if (isExternalCampaignPost(row)) {
    return r.organizationName?.trim() || r.companyName?.trim() || r.campaignType?.trim() || row.externalCategory?.name || 'Campaign';
  }
  return row.externalCategory?.name || row.postedByOrganization?.trim() || 'External';
}

export function savedExternalDisplayName(row: ExternalPostRequestRow): string {
  return row.title?.trim() || savedExternalSubtitle(row);
}
