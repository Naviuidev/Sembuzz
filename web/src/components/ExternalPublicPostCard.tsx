import { useCallback } from 'react';
import type { ExternalPostRequestRow } from '../services/external-admin-post-requests.service';
import { CreateJobLivePreview } from './CreateJobLivePreview';
import { CreateOfferLivePreview } from './CreateOfferLivePreview';
import { CreateCampaignLivePreview } from './CreateCampaignLivePreview';
import { CreatePostLivePreview } from './CreatePostLivePreview';
import { externalPostRowToCampaignPreview, isExternalCampaignPost } from '../utils/externalCampaignPostView';
import { externalPostRowToJobPreview, isExternalJobPost } from '../utils/externalJobPostView';
import { externalPostRowToOfferPreview, isExternalOfferPost } from '../utils/externalOfferPostView';
import { imageSrc } from '../utils/image';

function parseImages(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function parseActionButtons(raw: string | null): { label: string; url: string }[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const label = String((item as { label?: string }).label ?? '').trim();
        const url = String((item as { url?: string }).url ?? '').trim();
        if (!label || !url) return null;
        return { label, url };
      })
      .filter(Boolean) as { label: string; url: string }[];
  } catch {
    return [];
  }
}

function eventDateYmd(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return String(iso).slice(0, 10);
  }
}

type Props = {
  row: ExternalPostRequestRow;
  isSaved?: boolean;
  onToggleSave?: () => void;
};

export function ExternalPublicPostCard({ row, isSaved, onToggleSave }: Props) {
  const images = parseImages(row.imageUrls ?? null);
  const coverSrc = images[0] ? imageSrc(images[0]) : '';

  const handleJobSave = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onToggleSave?.();
    },
    [onToggleSave],
  );

  if (isExternalJobPost(row)) {
    const jobPreview = externalPostRowToJobPreview(row);
    const showSaveJob = jobPreview.saveJobButtonEnabled;
    return (
      <div className="external-public-post-card external-job-preview-wrap">
        <CreateJobLivePreview
          {...jobPreview}
          layoutVariant="web"
          publicFeed
          schoolAudience
          applyButtonUrl={jobPreview.applyButtonUrl}
          jobSaved={!!isSaved}
          onToggleSaveJob={showSaveJob && onToggleSave ? handleJobSave : undefined}
        />
      </div>
    );
  }

  if (isExternalOfferPost(row)) {
    return (
      <div className="external-public-post-card external-offer-preview-wrap">
        <CreateOfferLivePreview
          {...externalPostRowToOfferPreview(row)}
          layoutVariant="web"
          interactiveDescription
          schoolAudience
        />
      </div>
    );
  }

  if (isExternalCampaignPost(row)) {
    return (
      <div className="external-public-post-card external-offer-preview-wrap">
        <CreateCampaignLivePreview
          {...externalPostRowToCampaignPreview(row)}
          layoutVariant="web"
          interactiveDescription
          schoolAudience
        />
      </div>
    );
  }

  return (
    <div className="external-public-post-card">
      <CreatePostLivePreview
        title={row.title}
        description={row.description ?? ''}
        categoryName={row.externalCategory?.name ?? 'External'}
        subCategoryName={row.externalCategory?.name ?? ''}
        schoolName={row.school?.name}
        eventDate={eventDateYmd(row.eventDate)}
        eventStartTime={row.eventStartTime ?? ''}
        eventEndTime={row.eventEndTime ?? ''}
        eventLocation={row.eventLocation ?? ''}
        actionButtons={parseActionButtons(row.actionButtons ?? null)}
        coverSrc={coverSrc}
        previewMode="web"
        commentsEnabled={row.commentsEnabled}
        liveFeed
      />
    </div>
  );
}
