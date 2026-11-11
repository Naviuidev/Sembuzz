import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';
import { ADMIN_PORTAL_ACCENTS } from '../../constants/adminPortalTheme';
import { CreatePostLivePreview } from '../CreatePostLivePreview';
import { PublishScheduleFields } from '../PublishScheduleFields';
import { dateTimeLocalToIso, defaultFutureDateTimeLocal } from '../../utils/eventPublishing';
import {
  EventPostDetailFields,
  actionButtonsForApi,
  validateActionButtons,
  GOOGLE_CALENDAR_BUTTON_LABEL,
  APPLE_CALENDAR_BUTTON_LABEL,
} from '../EventPostDetailFields';
import { EventPostExternalLinkField } from '../EventPostExternalLinkField';
import type { EventActionButton } from '../../types/event-post';
import { imageSrc } from '../../utils/image';
import { masterAdminPostsService } from '../../services/master-admin-posts.service';
import type { MasterAdminSchoolPostRow } from '../../services/master-admin-schools.service';
import type { MasterAdminPostTarget } from './MasterAdminPostTargetPicker';

const MAX_IMAGES = 4;
const TITLE_MAX = 150;
const DESC_MAX = 1000;

type StepId = 'content' | 'event' | 'actions' | 'audience' | 'media';

const STEPS: { id: StepId; label: string; hint: string }[] = [
  { id: 'content', label: 'Content Details', hint: 'Title and description' },
  { id: 'event', label: 'Event Details', hint: 'Date, time, location' },
  { id: 'actions', label: 'Action Buttons', hint: 'Add links and actions' },
  { id: 'audience', label: 'Target Audience', hint: 'School community' },
  { id: 'media', label: 'Media & Settings', hint: 'Images' },
];

export type MasterAdminPostFormInitial = {
  title: string;
  description: string;
  externalLink: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
  actionButtons: EventActionButton[];
  commentsEnabled: boolean;
  imageUrls: string[];
};

type Props = {
  target: MasterAdminPostTarget;
  postId?: string;
  initialValues?: MasterAdminPostFormInitial;
  onSaved: (post: MasterAdminSchoolPostRow) => void;
  onCancel?: () => void;
};

export function MasterAdminCreatePostForm({ target, postId, initialValues, onSaved, onCancel }: Props) {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const [activeStep, setActiveStep] = useState<StepId>('content');
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'web'>('mobile');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [actionButtons, setActionButtons] = useState<EventActionButton[]>([]);
  const [commentsEnabled, setCommentsEnabled] = useState(false);
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

  useEffect(() => {
    if (!initialValues) return;
    setTitle(initialValues.title);
    setDescription(initialValues.description);
    setExternalLink(initialValues.externalLink);
    setEventDate(initialValues.eventDate);
    setEventStartTime(initialValues.eventStartTime);
    setEventEndTime(initialValues.eventEndTime);
    setEventLocation(initialValues.eventLocation);
    setActionButtons(initialValues.actionButtons);
    setCommentsEnabled(initialValues.commentsEnabled);
    setImageUrls(initialValues.imageUrls);
  }, [initialValues]);

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

  const previewButtons = useMemo(() => actionButtonsForApi(actionButtons), [actionButtons]);

  const scrollToStep = (id: StepId) => {
    setActiveStep(id);
    const section = document.getElementById(`ma-create-post-section-${id}`);
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
        const { url } = await masterAdminPostsService.uploadImage(file);
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
      restoreMainScrollAfterUpload();
      queueMicrotask(() => clearLocalCoverBlob());
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const actionBtnError = validateActionButtons(actionButtons);
    if (actionBtnError) {
      setError(actionBtnError);
      scrollToStep('actions');
      return;
    }
    if (!postId && publishMode === 'schedule' && !scheduledAt) {
      setError('Choose a date and time for scheduled publishing.');
      scrollToStep('media');
      return;
    }
    setPosting(true);
    setError(null);
    try {
      if (postId) {
        const updated = await masterAdminPostsService.updatePost(postId, {
          schoolId: target.schoolId,
          title: title.trim(),
          description: description.trim() || undefined,
          externalLink: externalLink.trim() || undefined,
          eventDate: eventDate.trim() || undefined,
          eventStartTime: eventStartTime.trim() || undefined,
          eventEndTime: eventEndTime.trim() || undefined,
          eventLocation: eventLocation.trim() || undefined,
          actionButtons: previewButtons,
          commentsEnabled,
          imageUrls: imageUrls.length ? imageUrls : undefined,
        });
        onSaved(updated as unknown as MasterAdminSchoolPostRow);
      } else {
        const created = await masterAdminPostsService.createPost({
          schoolId: target.schoolId,
          title: title.trim(),
          description: description.trim() || undefined,
          externalLink: externalLink.trim() || undefined,
          eventDate: eventDate.trim() || undefined,
          eventStartTime: eventStartTime.trim() || undefined,
          eventEndTime: eventEndTime.trim() || undefined,
          eventLocation: eventLocation.trim() || undefined,
          actionButtons: previewButtons,
          commentsEnabled,
          categoryId: target.categoryId,
          subCategoryId: target.subCategoryId,
          imageUrls: imageUrls.length ? imageUrls : undefined,
          publishAt:
            publishMode === 'schedule' && scheduledAt ? dateTimeLocalToIso(scheduledAt) : undefined,
        });
        onSaved(created);
      }
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(typeof msg === 'string' ? msg : postId ? 'Failed to update post.' : 'Failed to save post.');
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

  return (
    <div className="admin-create-post-page admin-create-post-page--embedded" style={panelStyle}>
      <input
        ref={fileInputRef}
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

      <div className="admin-create-post-layout admin-create-post-layout--embedded">
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

        <form id="master-admin-create-post-form" className="admin-create-post-main" onSubmit={handleSubmit}>
          <section id="ma-create-post-section-content" className="admin-panel admin-create-post-section" style={panelStyle}>
            <div className="admin-panel__body">
              {sectionHead(1, 'Content Details')}
              <div className="mb-3">
                <label className="admin-form-label" htmlFor="ma-post-title">
                  Title
                </label>
                <input
                  id="ma-post-title"
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
                <label className="admin-form-label" htmlFor="ma-post-description">
                  Description
                </label>
                <textarea
                  id="ma-post-description"
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

          <section id="ma-create-post-section-event" className="admin-panel admin-create-post-section" style={panelStyle}>
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
              <EventPostExternalLinkField
                id="master-admin-create-external-link"
                value={externalLink}
                onChange={setExternalLink}
              />
            </div>
          </section>

          <section id="ma-create-post-section-actions" className="admin-panel admin-create-post-section" style={panelStyle}>
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

          <section id="ma-create-post-section-audience" className="admin-panel admin-create-post-section" style={panelStyle}>
            <div className="admin-panel__body">
              {sectionHead(4, 'Target Audience')}
              <p className="admin-form-hint mb-3">This post will be associated with the school below when published.</p>
              <span className="admin-create-post-audience-tag">
                <i className="bi bi-building" aria-hidden />
                {target.schoolName}
              </span>
            </div>
          </section>

          <section id="ma-create-post-section-media" className="admin-panel admin-create-post-section" style={panelStyle}>
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
              {!postId ? (
                <div className="mt-4">
                  <PublishScheduleFields
                    publishMode={publishMode}
                    onPublishModeChange={setPublishMode}
                    scheduledAt={scheduledAt}
                    onScheduledAtChange={setScheduledAt}
                    helperText="No approval is required. Scheduled posts publish automatically at the selected time."
                  />
                </div>
              ) : (
                <p className="admin-form-hint mt-3 mb-0">
                  Save updates the post content. Use Ready to publish on the posts table if the post is still a draft.
                </p>
              )}
            </div>
          </section>
        </form>

        <aside className="admin-create-post-preview-col">
          <div className="admin-create-post-preview-card">
            <h2 className="admin-panel__title mb-2" style={{ fontSize: '1rem' }}>
              Live Preview
            </h2>
            <div className="admin-create-post-preview-toggle" role="tablist" aria-label="Preview size">
              {(['mobile', 'tablet', 'web'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={previewMode === mode}
                  className={previewMode === mode ? 'is-active' : ''}
                  onClick={() => setPreviewMode(mode)}
                >
                  {mode === 'mobile' ? 'Mobile' : mode === 'tablet' ? 'Tablet' : 'Web'}
                </button>
              ))}
            </div>
            <CreatePostLivePreview
              title={title}
              description={description}
              categoryName={target.categoryName}
              subCategoryName={target.subCategoryName}
              schoolName={target.schoolName}
              eventDate={eventDate}
              eventStartTime={eventStartTime}
              eventEndTime={eventEndTime}
              eventLocation={eventLocation}
              actionButtons={previewButtons}
              externalLink={externalLink}
              coverSrc={previewCoverSrc}
              previewMode={previewMode}
              accentColor={ADMIN_PORTAL_ACCENTS.master}
              commentsEnabled={commentsEnabled}
            />
          </div>
        </aside>
      </div>

      <div className="admin-create-post-footer" style={panelStyle}>
        <div className="form-check form-switch admin-create-post-footer__comments mb-0">
          <input
            className="form-check-input"
            type="checkbox"
            id="masterAdminCommentsEnabled"
            checked={commentsEnabled}
            onChange={(e) => setCommentsEnabled(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="masterAdminCommentsEnabled">
            Allow users to comment
          </label>
        </div>
        <div className="admin-create-post-footer__actions">
          {onCancel ? (
            <button type="button" className="admin-btn-secondary" onClick={onCancel} disabled={posting}>
              Cancel
            </button>
          ) : null}
          {!postId ? (
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handleScheduleLater}
              disabled={posting}
            >
              Schedule for later
            </button>
          ) : null}
          <button type="submit" form="master-admin-create-post-form" className="admin-btn-primary" disabled={posting}>
            <i className={postId ? 'bi bi-save me-2' : 'bi bi-send me-2'} aria-hidden />
            {posting
              ? 'Submitting…'
              : postId
                ? 'Save changes'
                : publishMode === 'schedule'
                  ? 'Schedule post'
                  : 'Publish post'}
          </button>
        </div>
      </div>
    </div>
  );
}
