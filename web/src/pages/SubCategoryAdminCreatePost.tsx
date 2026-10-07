import { useState, useEffect, useMemo, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';
import { subcategoryAdminEventsService } from '../services/subcategory-admin-events.service';
import { invalidateAdminActionItems } from '../services/admin-action-items.service';
import {
  eventDateToInputValue,
  eventTimeToInputValue,
  parseStoredActionButtons,
} from '../components/EventPostDetailFields';
import { PublishScheduleFields } from '../components/PublishScheduleFields';
import { dateTimeLocalToIso, defaultFutureDateTimeLocal } from '../utils/eventPublishing';
import {
  EventPostDetailFields,
  actionButtonsForApi,
  validateActionButtons,
  GOOGLE_CALENDAR_BUTTON_LABEL,
  APPLE_CALENDAR_BUTTON_LABEL,
} from '../components/EventPostDetailFields';
import { CreatePostLivePreview } from '../components/CreatePostLivePreview';
import type { EventActionButton } from '../types/event-post';
import { imageSrc } from '../utils/image';

const MAX_IMAGES = 4;
const TITLE_MAX = 150;
const DESC_MAX = 1000;

type StepId = 'content' | 'event' | 'actions' | 'audience' | 'media';

const STEPS: { id: StepId; label: string; hint: string }[] = [
  { id: 'content', label: 'Content Details', hint: 'Title, category, description' },
  { id: 'event', label: 'Event Details', hint: 'Date, time, location' },
  { id: 'actions', label: 'Action Buttons', hint: 'Add links and actions' },
  { id: 'audience', label: 'Target Audience', hint: 'Your school community' },
  { id: 'media', label: 'Media & Settings', hint: 'Images and publish options' },
];

export type SubCategoryAdminResubmitEvent = {
  id?: string;
  title: string;
  description: string | null;
  externalLink: string | null;
  eventDate?: string | null;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  eventLocation?: string | null;
  actionButtons?: string | null;
  commentsEnabled: boolean;
  subCategory: { id: string; name: string };
};

export const SubCategoryAdminCreatePost = ({
  embedded = false,
  hubHeader,
  resubmitEvent,
  onSubmitted,
}: {
  embedded?: boolean;
  hubHeader?: ReactNode;
  resubmitEvent?: SubCategoryAdminResubmitEvent | null;
  onSubmitted?: () => void;
}) => {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useSubCategoryAdminAuth();
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.subcategory } as CSSProperties;
  const [resubmitFromEventId, setResubmitFromEventId] = useState<string | undefined>();
  const [activeStep, setActiveStep] = useState<StepId>('content');
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'web'>('mobile');
  const [showVirtualLink, setShowVirtualLink] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [actionButtons, setActionButtons] = useState<EventActionButton[]>([]);
  const [commentsEnabled, setCommentsEnabled] = useState(false);
  const [subCategoryId, setSubCategoryId] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [localCoverBlobUrl, setLocalCoverBlobUrl] = useState<string | null>(null);
  const localCoverBlobRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainScrollBeforeUploadRef = useRef(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [scheduledAt, setScheduledAt] = useState(defaultFutureDateTimeLocal);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableSubcategories = useMemo(() => {
    if (user?.subCategories && user.subCategories.length > 0) {
      return user.subCategories.map((sc) => ({ id: sc.id, name: sc.name }));
    }
    if (user?.subCategoryName) {
      return [{ id: user.subCategoryId, name: user.subCategoryName }];
    }
    return [];
  }, [user]);

  useEffect(() => {
    void refreshUser().catch(() => {});
  }, [refreshUser]);

  useEffect(() => {
    if (availableSubcategories.length > 0 && !subCategoryId) {
      setSubCategoryId(availableSubcategories[0].id);
    }
  }, [availableSubcategories, subCategoryId]);

  const hasAppliedResubmit = useRef(false);
  useEffect(() => {
    if (!resubmitEvent || !user || hasAppliedResubmit.current) return;
    hasAppliedResubmit.current = true;
    setResubmitFromEventId(resubmitEvent.id);
    setTitle(resubmitEvent.title ?? '');
    setDescription(resubmitEvent.description ?? '');
    setExternalLink(resubmitEvent.externalLink ?? '');
    setShowVirtualLink(!!resubmitEvent.externalLink?.trim());
    setSubCategoryId(resubmitEvent.subCategory?.id ?? user.subCategoryId);
    setCommentsEnabled(resubmitEvent.commentsEnabled ?? false);
    setEventDate(eventDateToInputValue(resubmitEvent.eventDate ?? null));
    setEventStartTime(eventTimeToInputValue(resubmitEvent.eventStartTime ?? null));
    setEventEndTime(eventTimeToInputValue(resubmitEvent.eventEndTime ?? null));
    setEventLocation(resubmitEvent.eventLocation?.trim() ?? '');
    setActionButtons(parseStoredActionButtons(resubmitEvent.actionButtons));
    setActiveStep('content');
  }, [resubmitEvent, user]);

  useEffect(() => {
    return () => {
      if (localCoverBlobRef.current) {
        URL.revokeObjectURL(localCoverBlobRef.current);
      }
    };
  }, []);

  const previewCoverSrc = useMemo(() => {
    if (localCoverBlobUrl) return localCoverBlobUrl;
    if (imageUrls[0]) return imageSrc(imageUrls[0]);
    return '';
  }, [localCoverBlobUrl, imageUrls]);

  const thumbDisplaySrcs = useMemo(() => {
    const fromServer = imageUrls.map((u) => imageSrc(u));
    if (localCoverBlobUrl && fromServer.length === 0) return [localCoverBlobUrl];
    return fromServer;
  }, [imageUrls, localCoverBlobUrl]);

  const categoryName = user?.categoryName ?? '';
  const selectedSub = availableSubcategories.find((s) => s.id === subCategoryId);

  const previewButtons = useMemo(
    () => actionButtonsForApi(actionButtons),
    [actionButtons],
  );

  const scrollToStep = (id: StepId) => {
    setActiveStep(id);
    const section = document.getElementById(`create-post-section-${id}`);
    const main = document.querySelector<HTMLElement>('.admin-main');
    if (!section || !main) {
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const mainTop = main.getBoundingClientRect().top;
    const sectionTop = section.getBoundingClientRect().top;
    const nextTop = main.scrollTop + (sectionTop - mainTop) - 16;
    main.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
  };

  const clearLocalCoverBlob = () => {
    if (localCoverBlobRef.current) {
      URL.revokeObjectURL(localCoverBlobRef.current);
      localCoverBlobRef.current = null;
    }
    setLocalCoverBlobUrl(null);
  };

  const restoreMainScrollAfterUpload = () => {
    const main = document.querySelector<HTMLElement>('.admin-main');
    if (!main) return;
    const top = mainScrollBeforeUploadRef.current;
    main.scrollTop = top;
    requestAnimationFrame(() => {
      main.scrollTop = top;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const files = input.files;
    if (!files?.length || imageUrls.length >= MAX_IMAGES) return;

    const main = document.querySelector<HTMLElement>('.admin-main');
    mainScrollBeforeUploadRef.current = main?.scrollTop ?? 0;

    setUploadingImage(true);
    setError(null);
    const slotLeft = MAX_IMAGES - imageUrls.length;
    const batch = Array.from(files).slice(0, slotLeft);
    if (imageUrls.length === 0 && batch[0]) {
      const tempBlob = URL.createObjectURL(batch[0]);
      localCoverBlobRef.current = tempBlob;
      setLocalCoverBlobUrl(tempBlob);
    }
    try {
      for (const file of batch) {
        const { url } = await subcategoryAdminEventsService.uploadEventImage(file);
        if (typeof url !== 'string' || !url.trim()) {
          throw new Error('Invalid upload response');
        }
        setImageUrls((prev) => [...prev, url.trim()]);
      }
    } catch {
      setError('Failed to upload image.');
      clearLocalCoverBlob();
    } finally {
      setUploadingImage(false);
      input.value = '';
      input.blur();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      restoreMainScrollAfterUpload();
      // Drop blob only after server URLs are in state; next paint uses imageSrc paths.
      queueMicrotask(() => clearLocalCoverBlob());
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setExternalLink('');
    setShowVirtualLink(false);
    setEventDate('');
    setEventStartTime('');
    setEventEndTime('');
    setEventLocation('');
    setActionButtons([]);
    setCommentsEnabled(false);
    setImageUrls([]);
    clearLocalCoverBlob();
    setPublishMode('now');
    setScheduledAt(defaultFutureDateTimeLocal());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subCategoryId) return;
    const actionBtnError = validateActionButtons(actionButtons);
    if (actionBtnError) {
      setError(actionBtnError);
      scrollToStep('actions');
      return;
    }
    setPosting(true);
    setError(null);
    setSuccess(null);
    try {
      await subcategoryAdminEventsService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        externalLink: externalLink.trim() || undefined,
        eventDate: eventDate.trim() || undefined,
        eventStartTime: eventStartTime.trim() || undefined,
        eventEndTime: eventEndTime.trim() || undefined,
        eventLocation: eventLocation.trim() || undefined,
        actionButtons: previewButtons,
        commentsEnabled,
        subCategoryId,
        imageUrls: imageUrls.length ? imageUrls : undefined,
        resubmitFromEventId,
        publishAt:
          publishMode === 'schedule' && scheduledAt ? dateTimeLocalToIso(scheduledAt) : undefined,
      });
      setSuccess(
        publishMode === 'schedule'
          ? 'Post submitted for approval with a scheduled publish time. Category admin must approve first.'
          : 'Post submitted for category admin approval.',
      );
      setResubmitFromEventId(undefined);
      resetForm();
      scrollToStep('content');
      await queryClient.invalidateQueries({ queryKey: ['subcategory-admin', 'events', 'pending'] });
      await queryClient.invalidateQueries({ queryKey: ['subcategory-admin', 'events', 'reverted'] });
      void invalidateAdminActionItems(queryClient, 'subcategory-admin');
      onSubmitted?.();
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(typeof msg === 'string' ? msg : 'Failed to submit post.');
    } finally {
      setPosting(false);
    }
  };

  const handleScheduleLater = () => {
    setPublishMode('schedule');
    scrollToStep('media');
  };

  const addCalendarPresets = () => {
    setActionButtons((prev) => {
      let next = [...prev];
      if (!next.some((b) => b.label === GOOGLE_CALENDAR_BUTTON_LABEL)) {
        next = [...next, { id: `cal-g-${Date.now()}`, label: GOOGLE_CALENDAR_BUTTON_LABEL, url: '' }];
      }
      if (!next.some((b) => b.label === APPLE_CALENDAR_BUTTON_LABEL)) {
        next = [...next, { id: `cal-a-${Date.now()}`, label: APPLE_CALENDAR_BUTTON_LABEL, url: '' }];
      }
      return next;
    });
    scrollToStep('actions');
  };

  const sectionHead = (num: number, titleText: string) => (
    <div className="admin-create-post-section__head">
      <span className="admin-create-post-section__num">{num}</span>
      <h2 className="admin-create-post-section__title">{titleText}</h2>
    </div>
  );

  const page = (
      <div className={`admin-create-post-page${embedded ? ' admin-create-post-page--embedded' : ''}`} style={panelStyle}>
        <input
          ref={fileInputRef}
          id="subcategory-admin-create-post-images"
          type="file"
          accept="image/*"
          multiple
          tabIndex={-1}
          aria-hidden
          className="admin-create-post-file-input"
          onChange={handleImageUpload}
          disabled={uploadingImage || imageUrls.length >= MAX_IMAGES}
        />
        {error ? (
          <div className="admin-notice mb-3">
            <p className="admin-form-hint admin-form-hint--error mb-0">{error}</p>
          </div>
        ) : null}
        {success ? (
          <div className="admin-notice admin-notice--info mb-3">
            <p className="mb-0">{success}</p>
          </div>
        ) : null}

        <div
          className={`admin-create-post-layout${
            embedded && !hubHeader ? ' admin-create-post-layout--embedded' : ''
          }${hubHeader ? ' admin-create-post-layout--hub' : ''}`}
        >
          {hubHeader ? (
            <div className="admin-create-post-header admin-create-post-layout__header admin-create-post-layout__header--hub">
              {hubHeader}
            </div>
          ) : null}
          {!embedded && !hubHeader ? (
            <div className="admin-create-post-header admin-create-post-layout__header">
              <h1 className="admin-page-title">Create a New Post</h1>
              <p className="admin-page-subtitle mb-0">
                Share events, opportunities, announcements and more with your campus community.
              </p>
            </div>
          ) : null}

          <nav className="admin-create-post-stepper" aria-label="Create post steps">
            {STEPS.map((step, index) => (
              <div key={step.id}>
                <button
                  type="button"
                  className={`admin-create-post-step${activeStep === step.id ? ' is-active' : ''}`}
                  onClick={() => scrollToStep(step.id)}
                >
                  <span className="admin-create-post-step__num">{index + 1}</span>
                  <span className="admin-create-post-step__text">
                    <span className="admin-create-post-step__label">{step.label}</span>
                    <span className="admin-create-post-step__hint">{step.hint}</span>
                  </span>
                </button>
                {index < STEPS.length - 1 ? <div className="admin-create-post-stepper__line" aria-hidden /> : null}
              </div>
            ))}
          </nav>

          <form id="subcategory-admin-create-post-form" className="admin-create-post-main" onSubmit={handleSubmit}>
            <section
              id="create-post-section-content"
              className="admin-panel admin-create-post-section"
              style={panelStyle}
            >
              <div className="admin-panel__body">
                {sectionHead(1, 'Content Details')}
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="admin-form-label" htmlFor="sca-post-category">
                      Category
                    </label>
                    <input
                      id="sca-post-category"
                      className="form-control admin-form-control"
                      value={categoryName}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="admin-form-label" htmlFor="sca-post-subcategory">
                      Subcategory
                    </label>
                    {availableSubcategories.length > 1 ? (
                      <select
                        id="sca-post-subcategory"
                        className="form-select admin-form-control"
                        value={subCategoryId}
                        onChange={(e) => setSubCategoryId(e.target.value)}
                        required
                      >
                        {availableSubcategories.map((sc) => (
                          <option key={sc.id} value={sc.id}>
                            {sc.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="sca-post-subcategory"
                        className="form-control admin-form-control"
                        value={selectedSub?.name ?? ''}
                        disabled
                        readOnly
                      />
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="admin-form-label" htmlFor="post-title">
                    Title
                  </label>
                  <input
                    id="post-title"
                    className="form-control admin-form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                    required
                    maxLength={TITLE_MAX}
                    placeholder="e.g. Guest lecture series"
                  />
                  <div className="admin-create-post-char-count">
                    {title.length}/{TITLE_MAX}
                  </div>
                </div>
                <div className="mb-0">
                  <label className="admin-form-label" htmlFor="post-description">
                    Description
                  </label>
                  <textarea
                    id="post-description"
                    className="form-control admin-form-control"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
                    maxLength={DESC_MAX}
                    placeholder="Tell students what this post is about…"
                  />
                  <div className="admin-create-post-char-count">
                    {description.length}/{DESC_MAX}
                  </div>
                </div>
              </div>
            </section>

            <section
              id="create-post-section-event"
              className="admin-panel admin-create-post-section"
              style={panelStyle}
            >
              <div className="admin-panel__body">
                {sectionHead(2, 'Event Details')}
                <div className="admin-create-post-event-grid">
                  <EventPostDetailFields
                    part="event"
                    layout="stacked"
                    details={{
                      eventDate,
                      eventStartTime,
                      eventEndTime,
                      eventLocation,
                    }}
                    onDetailsChange={(patch) => {
                      if (patch.eventDate !== undefined) setEventDate(patch.eventDate);
                      if (patch.eventStartTime !== undefined) setEventStartTime(patch.eventStartTime);
                      if (patch.eventEndTime !== undefined) setEventEndTime(patch.eventEndTime);
                      if (patch.eventLocation !== undefined) setEventLocation(patch.eventLocation);
                    }}
                    actionButtons={actionButtons}
                    onActionButtonsChange={setActionButtons}
                  />
                </div>
                <div className="form-check mt-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="virtual-link-toggle"
                    checked={showVirtualLink || !!externalLink.trim()}
                    onChange={(e) => {
                      setShowVirtualLink(e.target.checked);
                      if (!e.target.checked) setExternalLink('');
                    }}
                  />
                  <label className="form-check-label" htmlFor="virtual-link-toggle">
                    Add virtual event link (e.g. Zoom, Teams)
                  </label>
                </div>
                {showVirtualLink || externalLink.trim() ? (
                  <div className="mt-2">
                    <input
                      type="url"
                      className="form-control admin-form-control"
                      placeholder="https://"
                      value={externalLink}
                      onChange={(e) => setExternalLink(e.target.value)}
                    />
                  </div>
                ) : null}
              </div>
            </section>

            <section
              id="create-post-section-actions"
              className="admin-panel admin-create-post-section"
              style={panelStyle}
            >
              <div className="admin-panel__body">
                {sectionHead(3, 'Action Buttons')}
                <div className="admin-create-post-calendar-quick">
                  <p className="admin-create-post-calendar-quick__title">Quick add calendar buttons</p>
                  <button
                    type="button"
                    className="admin-btn-secondary admin-create-post-calendar-quick__btn"
                    onClick={addCalendarPresets}
                  >
                    Add Google &amp; Apple Calendar
                  </button>
                </div>
                <EventPostDetailFields
                  part="actions"
                  layout="stacked"
                  details={{
                    eventDate,
                    eventStartTime,
                    eventEndTime,
                    eventLocation,
                  }}
                  onDetailsChange={() => {}}
                  actionButtons={actionButtons}
                  onActionButtonsChange={setActionButtons}
                />
              </div>
            </section>

            <section
              id="create-post-section-audience"
              className="admin-panel admin-create-post-section"
              style={panelStyle}
            >
              <div className="admin-panel__body">
                {sectionHead(4, 'Target Audience')}
                <p className="admin-form-hint mb-3">
                  After category admin approval, posts are visible to students at{' '}
                  {user?.schoolName || 'your school'}.
                </p>
                <span className="admin-create-post-audience-tag">
                  <i className="bi bi-building" aria-hidden />
                  {user?.schoolName || user?.schoolDomain || 'Your school'}
                </span>
              </div>
            </section>

            <section
              id="create-post-section-media"
              className="admin-panel admin-create-post-section"
              style={panelStyle}
            >
              <div className="admin-panel__body">
                {sectionHead(5, 'Media & Settings')}
                <label className="admin-form-label">Images (optional, up to {MAX_IMAGES})</label>
                <div className="admin-create-post-upload-zone">
                  <p className="admin-form-hint mb-2">Upload photos for your post cover and gallery.</p>
                  <button
                    type="button"
                    className="admin-btn-secondary admin-btn-sm mb-0"
                    disabled={uploadingImage || imageUrls.length >= MAX_IMAGES}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingImage ? 'Uploading…' : 'Choose images'}
                  </button>
                  {thumbDisplaySrcs.length > 0 ? (
                    <div className="admin-create-post-upload-thumbs">
                      {thumbDisplaySrcs.map((src) => (
                        <img key={src} src={src} alt="" width={72} height={72} loading="lazy" />
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4">
                  <PublishScheduleFields
                    publishMode={publishMode}
                    onPublishModeChange={setPublishMode}
                    scheduledAt={scheduledAt}
                    onScheduledAtChange={setScheduledAt}
                    helperText="Subcategory admin posts require category admin approval before they enter the scheduled queue or go live."
                  />
                </div>

              </div>
            </section>
          </form>

          <aside className="admin-create-post-preview-col">
            <div className="admin-create-post-preview-card">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="admin-panel__title mb-0" style={{ fontSize: '1rem' }}>
                  Live Preview
                </h2>
              </div>
              <div className="admin-create-post-preview-toggle" role="tablist" aria-label="Preview size">
                <button
                  type="button"
                  role="tab"
                  aria-selected={previewMode === 'mobile'}
                  className={previewMode === 'mobile' ? 'is-active' : ''}
                  onClick={() => setPreviewMode('mobile')}
                >
                  Mobile
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={previewMode === 'tablet'}
                  className={previewMode === 'tablet' ? 'is-active' : ''}
                  onClick={() => setPreviewMode('tablet')}
                >
                  Tablet
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={previewMode === 'web'}
                  className={previewMode === 'web' ? 'is-active' : ''}
                  onClick={() => setPreviewMode('web')}
                >
                  Web
                </button>
              </div>
              <CreatePostLivePreview
                title={title}
                description={description}
                categoryName={categoryName}
                subCategoryName={selectedSub?.name ?? ''}
                schoolName={user?.schoolName || user?.schoolDomain || 'Your school'}
                eventDate={eventDate}
                eventStartTime={eventStartTime}
                eventEndTime={eventEndTime}
                eventLocation={eventLocation}
                actionButtons={previewButtons}
                coverSrc={previewCoverSrc}
                previewMode={previewMode}
                accentColor={ADMIN_PORTAL_ACCENTS.subcategory}
                commentsEnabled={commentsEnabled}
              />
              <div className="admin-create-post-tip">
                <i className="bi bi-lightbulb" aria-hidden />
                Add a clear title, engaging image, and action buttons to increase student engagement.
              </div>
            </div>
          </aside>
        </div>

        <div className="admin-create-post-footer" style={panelStyle}>
          <div className="form-check form-switch admin-create-post-footer__comments mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="subcategoryAdminCommentsEnabled"
              checked={commentsEnabled}
              onChange={(e) => setCommentsEnabled(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="subcategoryAdminCommentsEnabled">
              Allow users to comment
            </label>
          </div>
          <div className="admin-create-post-footer__actions">
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handleScheduleLater}
              disabled={posting}
            >
              Schedule for later
            </button>
            <button
              type="submit"
              form="subcategory-admin-create-post-form"
              className="admin-btn-primary"
              disabled={posting}
            >
              <i className="bi bi-send me-2" aria-hidden />
              {posting ? 'Submitting…' : 'Submit for approval'}
            </button>
          </div>
        </div>
      </div>
  );

  if (embedded) return page;
  return <SubCategoryAdminLayout>{page}</SubCategoryAdminLayout>;
};
