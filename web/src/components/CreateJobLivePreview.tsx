import { useState } from 'react';
import { JOB_DESCRIPTION_PREVIEW_WORDS } from '../utils/externalJobPostView';
import { truncateToWords } from '../utils/truncateWords';
import { imageSrc } from '../utils/image';

const CHIP_TONES = ['info', 'success', 'warning', 'danger', 'dark', 'primary'] as const;

type Props = {
  jobTitle: string;
  companyName: string;
  companyLogoUrl: string;
  jobType: string;
  workMode: string;
  location: string;
  jobDescription: string;
  eligibilityRequirements: string;
  skillsRequired: string;
  experienceRequired: string;
  salaryStipend: string;
  applicationDeadline: string;
  applicationMethod: string;
  applicationTarget: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  postedByOrganization: string;
  applyButtonEnabled: boolean;
  saveJobButtonEnabled: boolean;
  categoryName: string;
  layoutVariant: 'device' | 'web';
  interactiveDescription?: boolean;
  /** School admin: hide empty fields and toggle-only chips */
  schoolAudience?: boolean;
  /** Public external feed: clickable Apply + description expand */
  publicFeed?: boolean;
  applyButtonUrl?: string;
  jobSaved?: boolean;
  onToggleSaveJob?: (e: React.MouseEvent) => void;
};

function JobChip({ label, toneIndex }: { label: string; toneIndex: number }) {
  const tone = CHIP_TONES[toneIndex % CHIP_TONES.length];
  return <span className={`external-job-preview__chip external-job-preview__chip--${tone}`}>{label}</span>;
}

function applicationMethodLabel(method: string) {
  return method === 'email' ? 'Email' : 'External URL';
}

function hasText(value: string | undefined | null) {
  return Boolean(value?.trim());
}

export function CreateJobLivePreview({
  jobTitle,
  companyName,
  companyLogoUrl,
  jobType,
  workMode,
  location,
  jobDescription,
  eligibilityRequirements,
  skillsRequired,
  experienceRequired,
  salaryStipend,
  applicationDeadline,
  applicationMethod,
  applicationTarget,
  contactPerson,
  contactEmail,
  contactPhone,
  postedByOrganization,
  applyButtonEnabled,
  saveJobButtonEnabled,
  categoryName,
  layoutVariant,
  interactiveDescription = false,
  schoolAudience = false,
  publicFeed = false,
  applyButtonUrl = '',
  jobSaved = false,
  onToggleSaveJob,
}: Props) {
  const descriptionInteractive = interactiveDescription || publicFeed;
  const liveActions = publicFeed;
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const compact = layoutVariant === 'device';
  const logoSrc = companyLogoUrl ? imageSrc(companyLogoUrl) : '';
  const trimmedDescription = jobDescription.trim();
  const { excerpt: descriptionExcerpt, truncated: descriptionTruncated } = truncateToWords(
    trimmedDescription,
    JOB_DESCRIPTION_PREVIEW_WORDS,
  );
  const chips: { label: string; tone: number }[] = [];
  if (categoryName) chips.push({ label: categoryName, tone: 5 });
  if (jobType) chips.push({ label: jobType, tone: 0 });
  if (workMode) chips.push({ label: workMode, tone: 1 });
  if (experienceRequired) chips.push({ label: experienceRequired, tone: 2 });
  if (!schoolAudience) {
    if (applyButtonEnabled) chips.push({ label: 'Apply on', tone: 0 });
    if (saveJobButtonEnabled) chips.push({ label: 'Save on', tone: 1 });
  }

  const descriptionDisplay =
    descriptionExpanded || !descriptionTruncated ? trimmedDescription : descriptionExcerpt;

  const metaRows: { label: string; value: string }[] = [
    { label: 'Location', value: location },
    { label: 'Salary / stipend', value: salaryStipend },
    { label: 'Apply by', value: applicationDeadline },
    { label: 'Posted by', value: postedByOrganization },
    { label: 'Application method', value: applicationMethod ? applicationMethodLabel(applicationMethod) : '' },
    { label: 'Application URL / email', value: applicationTarget },
    { label: 'Contact person', value: contactPerson },
    { label: 'Contact email', value: contactEmail },
    { label: 'Contact phone', value: contactPhone },
  ].filter((row) => !schoolAudience || hasText(row.value));

  const showDescription = !schoolAudience || hasText(trimmedDescription);
  const showEligibility = !schoolAudience || hasText(eligibilityRequirements);
  const showSkills = !schoolAudience || hasText(skillsRequired);
  const showActions = applyButtonEnabled || saveJobButtonEnabled;

  const titleText = jobTitle.trim() || (schoolAudience ? '' : 'Job title');
  const companyText = companyName.trim() || (schoolAudience ? '' : 'Company name');

  return (
    <div
      className={`external-job-preview${compact ? ' external-job-preview--device' : ' external-job-preview--web'}${schoolAudience ? ' external-job-preview--school' : ''}`}
    >
      <div className="external-job-preview__header">
        <div className="external-job-preview__brand">
          {logoSrc ? (
            <img src={logoSrc} alt="" className="external-job-preview__logo" />
          ) : schoolAudience ? null : (
            <div className="external-job-preview__logo external-job-preview__logo--placeholder">
              <i className="bi bi-building" aria-hidden />
            </div>
          )}
          {(titleText || companyText) ? (
            <div className="external-job-preview__head-text">
              {titleText ? <h3 className="external-job-preview__title">{titleText}</h3> : null}
              {companyText ? <p className="external-job-preview__company">{companyText}</p> : null}
            </div>
          ) : null}
        </div>
        {chips.length > 0 ? (
          <div className="external-job-preview__chips external-job-preview__chips--below-logo">
            {chips.map((c, i) => (
              <JobChip key={`${c.label}-${i}`} label={c.label} toneIndex={c.tone} />
            ))}
          </div>
        ) : null}
      </div>

      {metaRows.length > 0 ? (
        <dl className="external-job-preview__meta external-job-preview__meta--full">
          {metaRows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {showDescription ? (
        <section className="external-job-preview__section">
          <h4>Description</h4>
          <p className="external-job-preview__description">
            {descriptionDisplay || (schoolAudience ? '' : 'Job description will appear here.')}
            {descriptionTruncated && descriptionInteractive ? (
              <button
                type="button"
                className="external-job-preview__know-more-btn"
                onClick={() => setDescriptionExpanded((v) => !v)}
              >
                {descriptionExpanded ? 'Show less' : 'Know more'}
              </button>
            ) : descriptionTruncated && !schoolAudience ? (
              <span className="external-job-preview__know-more">Know more</span>
            ) : null}
          </p>
        </section>
      ) : null}

      {showEligibility ? (
        <section className="external-job-preview__section">
          <h4>Eligibility / requirements</h4>
          <p>{eligibilityRequirements || (schoolAudience ? '' : '—')}</p>
        </section>
      ) : null}

      {showSkills ? (
        <section className="external-job-preview__section">
          <h4>Skills required</h4>
          <p>{skillsRequired || (schoolAudience ? '' : '—')}</p>
        </section>
      ) : null}

      {showActions ? (
        <div className="external-job-preview__actions">
          {applyButtonEnabled ? (
            liveActions && applyButtonUrl.trim() ? (
              <a
                href={applyButtonUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn-primary admin-btn-sm text-decoration-none"
              >
                Apply now
              </a>
            ) : liveActions && applicationMethod === 'email' && applicationTarget.trim() ? (
              <a
                href={`mailto:${applicationTarget.trim()}`}
                className="admin-btn-primary admin-btn-sm text-decoration-none"
              >
                Apply now
              </a>
            ) : (
              <button type="button" className="admin-btn-primary admin-btn-sm" disabled>
                Apply now
              </button>
            )
          ) : null}
          {saveJobButtonEnabled ? (
            publicFeed && onToggleSaveJob ? (
              <button
                type="button"
                className={`admin-btn-secondary admin-btn-sm external-job-preview__save-btn${
                  jobSaved ? ' external-job-preview__save-btn--saved' : ''
                }`}
                onClick={(e) => onToggleSaveJob?.(e)}
                aria-pressed={jobSaved}
              >
                <i className={jobSaved ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'} aria-hidden />
                <span>{jobSaved ? 'Saved' : 'Save job'}</span>
              </button>
            ) : (
              <button type="button" className="admin-btn-secondary admin-btn-sm" disabled>
                Save job
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
