import { useState } from 'react';
import { OFFER_DESCRIPTION_PREVIEW_WORDS, type ExternalOfferPreviewModel } from '../utils/externalOfferPostView';
import { truncateToWords } from '../utils/truncateWords';
import { imageSrc } from '../utils/image';

const CHIP_TONES = ['info', 'success', 'warning', 'danger', 'dark', 'primary'] as const;

type Props = ExternalOfferPreviewModel & {
  layoutVariant: 'device' | 'web';
  interactiveDescription?: boolean;
  schoolAudience?: boolean;
};

function OfferChip({ label, toneIndex }: { label: string; toneIndex: number }) {
  const tone = CHIP_TONES[toneIndex % CHIP_TONES.length];
  return <span className={`external-offer-preview__chip external-offer-preview__chip--${tone}`}>{label}</span>;
}

function hasText(value: string | undefined | null) {
  return Boolean(value?.trim());
}

export function CreateOfferLivePreview({
  offerTitle,
  brandName,
  brandLogoUrl,
  offerCategory,
  description,
  bannerImageUrl,
  originalPrice,
  offerPriceDiscount,
  couponCode,
  validFrom,
  validUntil,
  eligibility,
  howToRedeem,
  redemptionUrl,
  termsAndConditions,
  postedByOrganization,
  categoryName,
  layoutVariant,
  interactiveDescription = false,
  schoolAudience = false,
}: Props) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const compact = layoutVariant === 'device';
  const logoSrc = brandLogoUrl ? imageSrc(brandLogoUrl) : '';
  const bannerSrc = bannerImageUrl ? imageSrc(bannerImageUrl) : '';
  const trimmedDescription = description.trim();
  const { excerpt, truncated } = truncateToWords(trimmedDescription, OFFER_DESCRIPTION_PREVIEW_WORDS);
  const descriptionDisplay = descriptionExpanded || !truncated ? trimmedDescription : excerpt;

  const chips: { label: string; tone: number }[] = [];
  if (offerCategory) chips.push({ label: offerCategory, tone: 5 });
  if (couponCode) chips.push({ label: `Code: ${couponCode}`, tone: 3 });

  const metaRows: { label: string; value: string }[] = [
    { label: 'Original price', value: originalPrice },
    { label: 'Offer price / discount', value: offerPriceDiscount },
    { label: 'Valid from', value: validFrom },
    { label: 'Valid until', value: validUntil },
    { label: 'Posted by', value: postedByOrganization },
  ].filter((row) => !schoolAudience || hasText(row.value));

  const titleText = offerTitle.trim() || (schoolAudience ? '' : 'Offer title');
  const brandText = brandName.trim() || (schoolAudience ? '' : 'Brand name');

  const section = (title: string, body: string, show: boolean) =>
    show ? (
      <section className="external-offer-preview__section">
        <h4>{title}</h4>
        <p style={{ whiteSpace: 'pre-wrap' }}>{body || (schoolAudience ? '' : '—')}</p>
      </section>
    ) : null;

  return (
    <div
      className={`external-offer-preview${compact ? ' external-offer-preview--device' : ' external-offer-preview--web'}${schoolAudience ? ' external-offer-preview--school' : ''}`}
    >
      {bannerSrc || !schoolAudience ? (
        <div className="external-offer-preview__banner-wrap">
          {bannerSrc ? (
            <img src={bannerSrc} alt="" className="external-offer-preview__banner" />
          ) : (
            <div className="external-offer-preview__banner external-offer-preview__banner--placeholder">
              <i className="bi bi-image" aria-hidden />
              <span>Offer banner</span>
            </div>
          )}
        </div>
      ) : null}

      <div className="external-offer-preview__header">
        <div className="external-offer-preview__brand">
          {logoSrc ? (
            <img src={logoSrc} alt="" className="external-offer-preview__logo" />
          ) : schoolAudience ? null : (
            <div className="external-offer-preview__logo external-offer-preview__logo--placeholder">
              <i className="bi bi-shop" aria-hidden />
            </div>
          )}
          {(titleText || brandText) ? (
            <div className="external-offer-preview__head-text">
              {titleText ? <h3 className="external-offer-preview__title">{titleText}</h3> : null}
              {brandText ? <p className="external-offer-preview__company">{brandText}</p> : null}
              {categoryName && !schoolAudience ? (
                <p className="external-offer-preview__platform-cat small text-muted mb-0">{categoryName}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        {chips.length > 0 ? (
          <div className="external-offer-preview__chips external-offer-preview__chips--below-logo">
            {chips.map((c, i) => (
              <OfferChip key={`${c.label}-${i}`} label={c.label} toneIndex={c.tone} />
            ))}
          </div>
        ) : null}
      </div>

      {metaRows.length > 0 ? (
        <dl className="external-offer-preview__meta">
          {metaRows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {(!schoolAudience || hasText(trimmedDescription)) && (
        <section className="external-offer-preview__section">
          <h4>Description</h4>
          <p className="external-offer-preview__description">
            {descriptionDisplay || (schoolAudience ? '' : 'Detailed description will appear here.')}
            {truncated && interactiveDescription ? (
              <button
                type="button"
                className="external-offer-preview__know-more-btn"
                onClick={() => setDescriptionExpanded((v) => !v)}
              >
                {descriptionExpanded ? 'Show less' : 'Know more'}
              </button>
            ) : truncated && !schoolAudience ? (
              <span className="external-offer-preview__know-more">Know more</span>
            ) : null}
          </p>
        </section>
      )}

      {(() => {
        const showEligibility = !schoolAudience || hasText(eligibility);
        const showRedeem = !schoolAudience || hasText(redemptionUrl);
        if (!showEligibility && !showRedeem) return null;
        return (
          <div className="external-offer-preview__pair-row">
            {showEligibility
              ? section('Eligibility', eligibility, true)
              : <div className="external-offer-preview__pair-spacer" aria-hidden />}
            {showRedeem ? (
              <section className="external-offer-preview__section">
                <h4>Redeem</h4>
                <p className="external-offer-preview__link-value mb-0">
                  {hasText(redemptionUrl) ? (
                    <a href={redemptionUrl.trim()} target="_blank" rel="noreferrer">
                      {redemptionUrl.trim()}
                    </a>
                  ) : (
                    schoolAudience ? '' : '—'
                  )}
                </p>
              </section>
            ) : null}
          </div>
        );
      })()}
      {section('How to redeem', howToRedeem, !schoolAudience || hasText(howToRedeem))}
      {section('Terms & conditions', termsAndConditions, !schoolAudience || hasText(termsAndConditions))}
    </div>
  );
}
