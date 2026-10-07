import type { ExternalPostRequestRow } from '../services/external-admin-post-requests.service';

export const OFFER_DESCRIPTION_PREVIEW_WORDS = 15;

export type ExternalOfferPreviewModel = {
  offerTitle: string;
  brandName: string;
  brandLogoUrl: string;
  offerCategory: string;
  description: string;
  bannerImageUrl: string;
  originalPrice: string;
  offerPriceDiscount: string;
  couponCode: string;
  validFrom: string;
  validUntil: string;
  eligibility: string;
  howToRedeem: string;
  redemptionUrl: string;
  termsAndConditions: string;
  postedByOrganization: string;
  offerPublishStatus: string;
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

export function isExternalOfferPost(row: ExternalPostRequestRow): boolean {
  return row.contentType === 'offer';
}

export function externalPostContentTypeLabel(row: ExternalPostRequestRow): string {
  if (row.contentType === 'job') return 'Job';
  if (row.contentType === 'offer') return 'Offer';
  if (row.contentType === 'campaign') return 'Campaign';
  return 'Event';
}

export function externalPostRowToOfferPreview(row: ExternalPostRequestRow): ExternalOfferPreviewModel {
  const r = row as ExternalPostRequestRow & {
    offerCategory?: string | null;
    originalPrice?: string | null;
    offerPriceDiscount?: string | null;
    couponCode?: string | null;
    offerValidFrom?: string | null;
    offerValidUntil?: string | null;
    howToRedeem?: string | null;
    redemptionUrl?: string | null;
    termsAndConditions?: string | null;
    offerPublishStatus?: string | null;
  };

  return {
    offerTitle: row.title,
    brandName: r.companyName ?? '',
    brandLogoUrl: r.companyLogoUrl ?? '',
    offerCategory: r.offerCategory ?? '',
    description: row.description ?? '',
    bannerImageUrl: parseBanner(row.imageUrls),
    originalPrice: r.originalPrice ?? '',
    offerPriceDiscount: r.offerPriceDiscount ?? '',
    couponCode: r.couponCode ?? '',
    validFrom: formatDateOnly(r.offerValidFrom),
    validUntil: formatDateOnly(r.offerValidUntil),
    eligibility: r.eligibilityRequirements ?? '',
    howToRedeem: r.howToRedeem ?? '',
    redemptionUrl: r.redemptionUrl ?? '',
    termsAndConditions: r.termsAndConditions ?? '',
    postedByOrganization: r.postedByOrganization ?? '',
    offerPublishStatus: r.offerPublishStatus ?? 'draft',
    categoryName: row.externalCategory.name,
  };
}
