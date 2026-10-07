import type { ExternalPostRequestRow } from '../services/external-admin-post-requests.service';

export const CAMPAIGN_DESCRIPTION_PREVIEW_WORDS = 15;

export type ExternalCampaignPreviewModel = {
  campaignTitle: string;
  organizationName: string;
  companyLogoUrl: string;
  campaignType: string;
  description: string;
  bannerImageUrl: string;
  startDate: string;
  endDate: string;
  targetAudience: string;
  eligibility: string;
  locationOrOnline: string;
  registrationUrl: string;
  registrationDeadline: string;
  contactEmail: string;
  termsAndConditions: string;
  postedByOrganization: string;
  publishStatus: string;
  categoryName: string;
};

function formatDateOnly(value: string | null | undefined) {
  if (!value) return '';
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return String(value).slice(0, 10);
  }
}

function parseBanner(imageUrls: string | null | undefined) {
  if (!imageUrls?.trim()) return '';
  try {
    const parsed = JSON.parse(imageUrls) as unknown;
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
  } catch {
    return imageUrls;
  }
  return '';
}

export function isExternalCampaignPost(row: ExternalPostRequestRow): boolean {
  return row.contentType === 'campaign';
}

export function externalPostRowToCampaignPreview(row: ExternalPostRequestRow): ExternalCampaignPreviewModel {
  const r = row as ExternalPostRequestRow & {
    campaignType?: string | null;
    campaignTargetAudience?: string | null;
    jobLocation?: string | null;
    offerValidFrom?: string | null;
    offerValidUntil?: string | null;
    redemptionUrl?: string | null;
    applicationDeadline?: string | null;
    contactEmail?: string | null;
    termsAndConditions?: string | null;
    offerPublishStatus?: string | null;
  };

  return {
    campaignTitle: row.title,
    organizationName: r.companyName ?? '',
    companyLogoUrl: r.companyLogoUrl ?? '',
    campaignType: r.campaignType ?? '',
    description: row.description ?? '',
    bannerImageUrl: parseBanner(row.imageUrls),
    startDate: formatDateOnly(r.offerValidFrom),
    endDate: formatDateOnly(r.offerValidUntil),
    targetAudience: r.campaignTargetAudience ?? '',
    eligibility: r.eligibilityRequirements ?? '',
    locationOrOnline: r.jobLocation ?? '',
    registrationUrl: r.redemptionUrl ?? '',
    registrationDeadline: formatDateOnly(r.applicationDeadline),
    contactEmail: r.contactEmail ?? '',
    termsAndConditions: r.termsAndConditions ?? '',
    postedByOrganization: r.postedByOrganization ?? '',
    publishStatus: r.offerPublishStatus ?? 'draft',
    categoryName: row.externalCategory.name,
  };
}
