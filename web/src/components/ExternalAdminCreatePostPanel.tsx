import { useEffect, useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { externalAdminPostRequestsService } from '../services/external-admin-post-requests.service';
import { getApiErrorMessage } from '../utils/apiError';

const MAX_IMAGES = 4;
const TITLE_MAX = 150;

type Props = {
  categoryId: string;
  categoryName: string;
};

export function ExternalAdminCreatePostPanel({ categoryId, categoryName }: Props) {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.external } as CSSProperties;
  const queryClient = useQueryClient();
  const [schoolId, setSchoolId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['external-admin', 'post', 'schools', categoryId],
    queryFn: () => externalAdminPostRequestsService.listApprovedSchools(categoryId),
  });

  const { data: subcategories = [], isLoading: subLoading } = useQuery({
    queryKey: ['external-admin', 'post', 'subcategories', schoolId, categoryId],
    queryFn: () => externalAdminPostRequestsService.listSchoolSubcategories(schoolId, categoryId),
    enabled: Boolean(schoolId),
  });

  useEffect(() => {
    if (schools.length > 0 && !schoolId) setSchoolId(schools[0].id);
  }, [schools, schoolId]);

  useEffect(() => {
    if (subcategories.length > 0 && !subCategoryId) setSubCategoryId(subcategories[0].id);
    if (subcategories.length === 0) setSubCategoryId('');
  }, [subcategories, subCategoryId]);

  const linkMutation = useMutation({
    mutationFn: () => externalAdminPostRequestsService.requestCategorySubcategoryLink(categoryId, subCategoryId),
    onSuccess: () => {
      setLinkSuccess('Category name approval sent to subcategory admin.');
      setFormError(null);
    },
    onError: (err: unknown) => setFormError(getApiErrorMessage(err, 'Failed to request category approval.')),
  });

  const createMutation = useMutation({
    mutationFn: externalAdminPostRequestsService.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-admin', 'post-requests'] });
      setTitle('');
      setDescription('');
      setExternalLink('');
      setEventDate('');
      setEventStartTime('');
      setEventEndTime('');
      setEventLocation('');
      setImageUrls([]);
      setFormError(null);
    },
    onError: (err: unknown) => setFormError(getApiErrorMessage(err, 'Failed to submit post.')),
  });

  const onUpload = async (file: File) => {
    if (imageUrls.length >= MAX_IMAGES) return;
    setUploading(true);
    try {
      const url = await externalAdminPostRequestsService.uploadImage(file);
      setImageUrls((prev) => [...prev, url]);
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err, 'Image upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = () => {
    setFormError(null);
    if (!schoolId) {
      setFormError('Select a school with approved pipeline access.');
      return;
    }
    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!subCategoryId) {
      setFormError('Select a subcategory and get category name approval first.');
      return;
    }
    createMutation.mutate({
      externalCategoryId: categoryId,
      schoolId,
      subCategoryId,
      title: title.trim(),
      description: description.trim() || undefined,
      externalLink: externalLink.trim() || undefined,
      imageUrls: imageUrls.length ? JSON.stringify(imageUrls) : undefined,
      eventDate: eventDate || undefined,
      eventStartTime: eventStartTime || undefined,
      eventEndTime: eventEndTime || undefined,
      eventLocation: eventLocation.trim() || undefined,
    });
  };

  return (
    <div className="admin-panel__body" style={panelStyle}>
      <p className="small text-muted mb-3">
        Posting for category <strong>{categoryName}</strong>. School admin must approve before it can go live.
      </p>
      {schoolsLoading ? (
        <p className="small text-muted">Loading approved schools…</p>
      ) : schools.length === 0 ? (
        <div className="admin-empty-state">
          <p>No approved schools for this category yet. Complete pipeline access under Privacy first.</p>
        </div>
      ) : (
        <>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">School *</label>
              <select className="form-select form-select-sm" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Subcategory *</label>
              {subLoading ? (
                <p className="small text-muted mb-0">Loading subcategories…</p>
              ) : (
                <select className="form-select form-select-sm" value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)}>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>{s.category.name} / {s.name}</option>
                  ))}
                </select>
              )}
              <button
                type="button"
                className="admin-btn-secondary admin-btn-sm mt-2"
                disabled={!subCategoryId || linkMutation.isPending}
                onClick={() => linkMutation.mutate()}
              >
                Request category name approval
              </button>
              {linkSuccess ? <p className="small text-success mt-1 mb-0">{linkSuccess}</p> : null}
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Title *</label>
              <input className="form-control form-control-sm" maxLength={TITLE_MAX} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Description</label>
              <textarea className="form-control form-control-sm" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Event date</label>
              <input type="date" className="form-control form-control-sm" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Start time</label>
              <input type="time" className="form-control form-control-sm" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">End time</label>
              <input type="time" className="form-control form-control-sm" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Location</label>
              <input className="form-control form-control-sm" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Link (optional)</label>
              <input className="form-control form-control-sm" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Images ({imageUrls.length}/{MAX_IMAGES})</label>
              <input
                type="file"
                accept="image/*"
                disabled={uploading || imageUrls.length >= MAX_IMAGES}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onUpload(f);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
          {formError ? <p className="small text-danger mt-2">{formError}</p> : null}
          {createMutation.isSuccess ? <p className="small text-success mt-2">Post sent for school admin approval.</p> : null}
          <button type="button" className="admin-btn-primary admin-btn-sm mt-3" disabled={createMutation.isPending} onClick={onSubmit}>
            {createMutation.isPending ? 'Submitting…' : 'Submit for approval'}
          </button>
        </>
      )}
    </div>
  );
}
