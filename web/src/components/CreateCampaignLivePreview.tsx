import { useState } from 'react';
import { CAMPAIGN_DESCRIPTION_PREVIEW_WORDS, type ExternalCampaignPreviewModel } from '../utils/externalCampaignPostView';
import { truncateToWords } from '../utils/truncateWords';
import { imageSrc } from '../utils/image';

const CHIP_TONES = ['info', 'success', 'warning', 'danger', 'dark', 'primary'] as const;

type Props = ExternalCampaignPreviewModel & {
  layoutVariant: 'device' | 'web';
  interactiveDescription?: boolean;
  schoolAudience?: boolean;
};

function Chip({ label, toneIndex }: { label: string; toneIndex: number }) {
  const tone = CHIP_TONES[toneIndex % CHIP_TONES.length];
  return <span className={`external-offer-preview__chip external-offer-preview__chip--${tone}`}>{label}</span>;
}

function hasText(value: string | undefined | null) {
  return Boolean(value?.trim());
}

export function CreateCampaignLivePreview({
  campaignTitle,
  organizationName,
  companyLogoUrl,
  campaignType,
  description,
  bannerImageUrl,
  startDate,
  endDate,
  targetAudience,
  eligibility,
  locationOrOnline,
  registrationUrl,
  registrationDeadline,
  contactEmail,
  termsAndConditions,
  postedByOrganization,
  categoryName,
  layoutVariant,
  interactiveDescription = false,
  schoolAudience = false,
}: Props) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const compact = layoutVariant === 'device';
  const logoSrc = companyLogoUrl ? imageSrc(companyLogoUrl) : '';
  const bannerSrc = bannerImageUrl ? imageSrc(bannerImageUrl) : '';
  const trimmedDescription = description.trim();
  const { excerpt, truncated } = truncateToWords(trimmedDescription, CAMPAIGN_DESCRIPTION_PREVIEW_WORDS);
  const descriptionDisplay = descriptionExpanded || !truncated ? trimmedDescription : excerpt;

  const chips: { label: string; tone: number }[] = [];
  if (campaignType) chips.push({ label: campaignType, tone: 5 });
  if (locationOrOnline) chips.push({ label: locationOrOnline, tone: 1 });

  const metaRows: { label: string; value: string }[] = [
    { label: 'Start date', value: startDate },
    { label: 'End date', value: endDate },
    { label: 'Target audience', value: targetAudience },
    { label: 'Registration deadline', value: registrationDeadline },
    { label: 'Contact email', value: contactEmail },
    { label: 'Posted by', value: postedByOrganization },
  ].filter((row) => !schoolAudience || hasText(row.value));

  const titleText = campaignTitle.trim() || (schoolAudience ? '' : 'Campaign title');
  const orgText = organizationName.trim() || (schoolAudience ? '' : 'Organization name');

  const section = (title: string, body: string, show: boolean) =>
    show ? (
      <section className="external-offer-preview__section">
        <h4>{title}</h4>
        <p style={{ whiteSpace: 'pre-wrap' }}>{body || (schoolAudience ? '' : '—')}</p>
      </section>
    ) : null;

  return (
    <div className={`external-offer-preview${compact ? ' external-offer-preview--device' : ''}${schoolAudience ? ' external-offer-preview--school' : ''}`}>
      {bannerSrc || !schoolAudience ? (
        <div className="external-offer-preview__banner-wrap">
          {bannerSrc ? (
            <img src={bannerSrc} alt="" className="external-offer-preview__banner" />
          ) : (
            <div className="external-offer-preview__banner external-offer-preview__banner--placeholder">
              <i className="bi bi-image" aria-hidden />
              <span>Campaign banner</span>
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
              <i className="bi bi-building" aria-hidden />
            </div>
          )}
          {(titleText || orgText) ? (
            <div className="external-offer-preview__head-text">
              {titleText ? <h3 className="external-offer-preview__title">{titleText}</h3> : null}
              {orgText ? <p className="external-offer-preview__company">{orgText}</p> : null}
              {categoryName && !schoolAudience ? (
                <p className="small text-muted mb-0">{categoryName}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        {chips.length > 0 ? (
          <div className="external-offer-preview__chips external-offer-preview__chips--below-logo">
            {chips.map((c, i) => (
              <Chip key={`${c.label}-${i}`} label={c.label} toneIndex={c.tone} />
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
              <button type="button" className="external-offer-preview__know-more-btn" onClick={() => setDescriptionExpanded((v) => !v)}>
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
        const showRegister = !schoolAudience || hasText(registrationUrl);
        if (!showEligibility && !showRegister) return null;
        return (
          <div className="external-offer-preview__pair-row">
            {showEligibility
              ? section('Eligibility', eligibility, true)
              : <div className="external-offer-preview__pair-spacer" aria-hidden />}
            {showRegister ? (
              <section className="external-offer-preview__section">
                <h4>Register</h4>
                <p className="external-offer-preview__link-value mb-0">
                  {hasText(registrationUrl) ? (
                    <a href={registrationUrl.trim()} target="_blank" rel="noreferrer">
                      {registrationUrl.trim()}
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
      {section('Terms & conditions', termsAndConditions, !schoolAudience || hasText(termsAndConditions))}
    </div>
  );
}
