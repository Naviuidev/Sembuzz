import { useState, useEffect } from 'react';
import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import { publicEventsService, type CategoryPublic } from '../services/public-events.service';
import { schoolAdminPostsService } from '../services/school-admin-posts.service';
import { PublishScheduleFields } from '../components/PublishScheduleFields';
import { dateTimeLocalToIso, defaultFutureDateTimeLocal } from '../utils/eventPublishing';
import {
  EventPostDetailFields,
  actionButtonsForApi,
  validateActionButtons,
} from '../components/EventPostDetailFields';
import type { EventActionButton } from '../types/event-post';

const MAX_IMAGES = 4;

export const SchoolAdminCreatePost = () => {
  const { user } = useSchoolAdminAuth();
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [actionButtons, setActionButtons] = useState<EventActionButton[]>([]);
  const [commentsEnabled, setCommentsEnabled] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [scheduledAt, setScheduledAt] = useState(defaultFutureDateTimeLocal);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.schoolId) return;
    publicEventsService.getCategoriesBySchool(user.schoolId).then((cats) => {
      setCategories(cats);
      if (cats.length > 0) {
        setCategoryId(cats[0].id);
        const subs = cats[0].subcategories ?? [];
        if (subs.length > 0) setSubCategoryId(subs[0].id);
      }
    }).catch(() => setError('Failed to load categories.'));
  }, [user?.schoolId]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subcategories = selectedCategory?.subcategories ?? [];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || imageUrls.length >= MAX_IMAGES) return;
    setUploadingImage(true);
    setError(null);
    try {
      for (const file of Array.from(files).slice(0, MAX_IMAGES - imageUrls.length)) {
        const { url } = await schoolAdminPostsService.uploadImage(file);
        setImageUrls((prev) => [...prev, url]);
      }
    } catch {
      setError('Failed to upload image.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setExternalLink('');
    setEventDate('');
    setEventStartTime('');
    setEventEndTime('');
    setEventLocation('');
    setActionButtons([]);
    setCommentsEnabled(false);
    setImageUrls([]);
    setPublishMode('now');
    setScheduledAt(defaultFutureDateTimeLocal());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId || !subCategoryId) return;
    const actionBtnError = validateActionButtons(actionButtons);
    if (actionBtnError) {
      setError(actionBtnError);
      return;
    }
    setPosting(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await schoolAdminPostsService.createPost({
        title: title.trim(),
        description: description.trim() || undefined,
        externalLink: externalLink.trim() || undefined,
        eventDate: eventDate.trim() || undefined,
        eventStartTime: eventStartTime.trim() || undefined,
        eventEndTime: eventEndTime.trim() || undefined,
        eventLocation: eventLocation.trim() || undefined,
        actionButtons: actionButtonsForApi(actionButtons),
        commentsEnabled,
        categoryId,
        subCategoryId,
        imageUrls: imageUrls.length ? imageUrls : undefined,
        publishAt:
          publishMode === 'schedule' && scheduledAt
            ? dateTimeLocalToIso(scheduledAt)
            : undefined,
      });
      setSuccess(
        created.status === 'scheduled'
          ? 'Post scheduled successfully. It will publish automatically at the selected time.'
          : 'Post published successfully.',
      );
      resetForm();
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(typeof msg === 'string' ? msg : 'Failed to create post.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="admin-shell" style={{ backgroundColor: '#fafafa' }}>
      <SchoolAdminNavbar />
      <div className="admin-shell-body">
        <SchoolAdminSidebar />
        <div className="admin-main">
          <div className="mb-4">
            <h1 className="h4 mb-1" style={{ color: '#1a1f2e' }}>Create post</h1>
            <p className="text-muted mb-0">
              School admin posts publish directly — immediately or on a schedule — with no approval required.
            </p>
          </div>

          <div className="card border-0 shadow-sm" style={{ borderRadius: 0 }}>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={categoryId}
                      onChange={(e) => {
                        const cat = categories.find((c) => c.id === e.target.value);
                        setCategoryId(e.target.value);
                        const firstSub = cat?.subcategories?.[0]?.id ?? '';
                        setSubCategoryId(firstSub);
                      }}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Subcategory</label>
                    <select
                      className="form-select"
                      value={subCategoryId}
                      onChange={(e) => setSubCategoryId(e.target.value)}
                      required
                    >
                      {subcategories.map((sc) => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Title</label>
                    <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">External link (optional)</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://"
                      value={externalLink}
                      onChange={(e) => setExternalLink(e.target.value)}
                    />
                  </div>

                  <EventPostDetailFields
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

                  <div className="col-12">
                    <label className="form-label">Images (optional, up to {MAX_IMAGES})</label>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploadingImage || imageUrls.length >= MAX_IMAGES} />
                    {imageUrls.length > 0 && (
                      <p className="small text-muted mt-1 mb-0">{imageUrls.length} image(s) attached</p>
                    )}
                  </div>
                  <div className="col-12">
                    <PublishScheduleFields
                      publishMode={publishMode}
                      onPublishModeChange={setPublishMode}
                      scheduledAt={scheduledAt}
                      onScheduledAtChange={setScheduledAt}
                      helperText="No approval is required. Scheduled posts enter the queue and publish automatically."
                    />
                  </div>
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="schoolAdminCommentsEnabled"
                        checked={commentsEnabled}
                        onChange={(e) => setCommentsEnabled(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="schoolAdminCommentsEnabled">
                        Allow users to comment
                      </label>
                    </div>
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn btn-dark" disabled={posting}>
                      {posting ? 'Submitting…' : publishMode === 'schedule' ? 'Schedule post' : 'Publish now'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
