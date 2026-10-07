import type { ReactNode } from 'react';
import { EventPostDetailLayout } from './EventPostDetailLayout';

function PreviewBody({
  title,
  description,
  categoryName,
  subCategoryName,
  schoolName,
  schoolLogoUrl,
  eventDate,
  eventStartTime,
  eventEndTime,
  eventLocation,
  actionButtons,
  coverSrc,
  accentColor,
  commentsEnabled,
  layoutVariant,
  liveFeed,
  belowHero,
}: {
  title: string;
  description: string;
  categoryName: string;
  subCategoryName: string;
  schoolName?: string;
  schoolLogoUrl?: string | null;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  actionButtons: { label: string; url: string }[];
  coverSrc: string;
  accentColor?: string;
  commentsEnabled?: boolean;
  layoutVariant: 'device' | 'web';
  /** Public home feed: real CTAs, no decorative preview chrome */
  liveFeed?: boolean;
  belowHero?: ReactNode;
}) {
  const devicePreview = layoutVariant === 'device';
  return (
    <>
      <EventPostDetailLayout
        title={title}
        description={description}
        coverImageUrl={coverSrc || null}
        schoolName={schoolName}
        schoolLogoUrl={schoolLogoUrl}
        categoryName={categoryName}
        subCategoryName={subCategoryName}
        eventDate={eventDate || null}
        eventStartTime={eventStartTime || null}
        eventEndTime={eventEndTime || null}
        eventLocation={eventLocation || null}
        actionButtons={actionButtons}
        compact={devicePreview}
        preview={!liveFeed}
        accentColor={accentColor}
        className={devicePreview ? 'event-post-detail--device-preview' : 'event-post-detail--web-preview'}
        belowHero={belowHero}
      />
      {commentsEnabled && !liveFeed ? (
        <div className="admin-create-post-preview-comments" aria-hidden>
          <div className="admin-create-post-preview-comments__bar">
            <i className="bi bi-chat-left-text" aria-hidden />
            <span>Comments</span>
          </div>
          <p className="admin-create-post-preview-comments__hint">Students can comment on this post.</p>
        </div>
      ) : null}
    </>
  );
}

export function CreatePostLivePreview({
  title,
  description,
  categoryName,
  subCategoryName,
  schoolName,
  schoolLogoUrl,
  eventDate,
  eventStartTime,
  eventEndTime,
  eventLocation,
  actionButtons,
  coverSrc,
  previewMode,
  accentColor,
  commentsEnabled,
  liveFeed,
  belowHero,
}: {
  title: string;
  description: string;
  categoryName: string;
  subCategoryName: string;
  schoolName?: string;
  schoolLogoUrl?: string | null;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  actionButtons: { label: string; url: string }[];
  coverSrc: string;
  previewMode: 'mobile' | 'tablet' | 'web';
  accentColor?: string;
  commentsEnabled?: boolean;
  liveFeed?: boolean;
  belowHero?: ReactNode;
}) {
  const layoutVariant = previewMode === 'web' ? 'web' : 'device';
  const body = (
    <PreviewBody
      title={title}
      description={description}
      categoryName={categoryName}
      subCategoryName={subCategoryName}
      schoolName={schoolName}
      schoolLogoUrl={schoolLogoUrl}
      eventDate={eventDate}
      eventStartTime={eventStartTime}
      eventEndTime={eventEndTime}
      eventLocation={eventLocation}
      actionButtons={actionButtons}
      coverSrc={coverSrc}
      accentColor={accentColor}
      commentsEnabled={commentsEnabled}
      layoutVariant={layoutVariant}
      liveFeed={liveFeed}
      belowHero={belowHero}
    />
  );

  if (previewMode === 'web') {
    return (
      <div className="admin-create-post-preview-stage">
        <div className="admin-create-post-preview-device admin-create-post-preview-device--web">
          <div className="admin-create-post-preview-device__browser-bar">
            <span className="admin-create-post-preview-device__browser-dots" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            <span className="admin-create-post-preview-device__browser-url">sembuzz.com/events</span>
          </div>
          <div className="admin-create-post-preview-device__body admin-create-post-preview-device__body--web">
            {body}
          </div>
        </div>
      </div>
    );
  }

  if (previewMode === 'tablet') {
    return (
      <div className="admin-create-post-preview-stage">
        <div className="admin-create-post-preview-device admin-create-post-preview-device--tablet">
          <div className="admin-create-post-preview-device__screen">
            <div className="admin-create-post-preview-device__tablet-bar">
              <span className="admin-create-post-preview-device__tablet-time">9:41</span>
              <span className="admin-create-post-preview-device__tablet-brand">SemBuzz</span>
              <span className="admin-create-post-preview-device__tablet-icons" aria-hidden>
                <i className="bi bi-wifi" />
                <i className="bi bi-battery-full" />
              </span>
            </div>
            <div className="admin-create-post-preview-device__body">{body}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-create-post-preview-stage">
      <div className="admin-create-post-preview-device admin-create-post-preview-device--iphone">
        <div className="admin-create-post-preview-device__screen">
          <div className="admin-create-post-preview-device__iphone-status">
            <span className="admin-create-post-preview-device__iphone-time">9:41</span>
            <div className="admin-create-post-preview-device__dynamic-island" aria-hidden />
            <span className="admin-create-post-preview-device__iphone-icons" aria-hidden>
              <i className="bi bi-reception-4" />
              <i className="bi bi-wifi" />
              <i className="bi bi-battery-full" />
            </span>
          </div>
          <div className="admin-create-post-preview-device__body">{body}</div>
        </div>
      </div>
    </div>
  );
}
