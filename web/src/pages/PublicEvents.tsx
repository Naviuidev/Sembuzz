import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '../components/Navbar';
import { SchoolNavbar } from '../components/SchoolNavbar';
import { useUserAuth } from '../contexts/UserAuthContext';
import { useEventsFilter } from '../contexts/EventsFilterContext';
import {
  publicEventsService,
  type ApprovedEventPublic,
  type CategoryPublic,
  type UpcomingPostPublic,
  type SponsoredAdPublic,
} from '../services/public-events.service';
import {
  userEventsService,
  type EventCommentResponse,
  type EngagementResponse,
} from '../services/user-events.service';
import { userAuthService } from '../services/user-auth.service';
import { api } from '../config/api';
import { imageSrc } from '../utils/image';
import { userHelpService } from '../services/user-help.service';
import { userSchoolSocialService, type SchoolSocialAccountPublic } from '../services/user-school-social.service';
import { getUserCategoryDone, getUserSubCategoryIds, setUserCategoryDone, setUserSubCategoryIds } from '../utils/user-category-prefs';
const DESCRIPTION_PREVIEW_LENGTH = 400;

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  google: '#4285F4',
  instagram: '#E4405F',
  x: '#000000',
  tiktok: '#000000',
  pinterest: '#BD081C',
  whatsapp: '#25D366',
  telegram: '#26A5E4',
  reddit: '#FF4500',
  snapchat: '#FFFC00',
};

const PLATFORM_ICONS: Record<string, string> = {
  facebook: 'bi-facebook',
  linkedin: 'bi-linkedin',
  youtube: 'bi-youtube',
  google: 'bi-google',
  instagram: 'bi-instagram',
  x: 'bi-twitter-x',
  tiktok: 'bi-tiktok',
  pinterest: 'bi-pinterest',
  whatsapp: 'bi-whatsapp',
  telegram: 'bi-telegram',
  reddit: 'bi-reddit',
  snapchat: 'bi-snapchat',
};

function isClubIconUrl(icon: string): boolean {
  return !!icon && (icon.startsWith('http://') || icon.startsWith('https://'));
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function parseImageUrls(imageUrls: string | null): string[] {
  if (!imageUrls) return [];
  try {
    const parsed = JSON.parse(imageUrls);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

/** Build backend URL for "Login with Google" to add event to user's calendar (OAuth flow). */
function buildGoogleCalendarAddAuthUrl(
  post: { title: string; description?: string | null; scheduledTo: string },
  returnUrl: string,
): string {
  const dateStr = post.scheduledTo.trim().slice(0, 10);
  const startISO = `${dateStr}T09:00:00.000Z`;
  const endISO = `${dateStr}T10:00:00.000Z`;
  const base = (api.defaults.baseURL || '').replace(/\/$/, '');
  const params = new URLSearchParams({
    returnUrl,
    title: post.title,
    start: startISO,
    end: endISO,
    ...(post.description ? { description: post.description } : {}),
  });
  return `${base}/google/calendar/add-auth?${params.toString()}`;
}

type LikedEventItem = import('../services/user-events.service').LikedEventItem;

/** Full post detail for a liked item (same as Saved screen). */
function LikedEventDetailView({ event, onBack }: { event: LikedEventItem; onBack: () => void }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const images = parseImageUrls(event.imageUrls);
  const schoolName = event.school?.name ?? 'School';
  const schoolLogo = event.school?.image ?? null;
  const hasMultipleImages = images.length > 1;
  const goPrev = () => setSlideIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  const goNext = () => setSlideIndex((i) => (i >= images.length - 1 ? 0 : i + 1));

  return (
    <>
      <button type="button" className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-2 mb-3" onClick={onBack} aria-label="Back to list">
        <i className="bi bi-arrow-left" style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
        <span style={{ fontWeight: 500, color: '#1a1f2e' }}>Back to list</span>
      </button>
      <article className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="d-flex align-items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid #eee' }}>
          {schoolLogo ? <img src={imageSrc(schoolLogo)} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d', fontWeight: 700 }}>{schoolName.charAt(0)?.toUpperCase() ?? '?'}</div>}
          <div>
            <div style={{ fontWeight: 600, color: '#1a1f2e', fontSize: '0.95rem' }}>{schoolName}</div>
            <div style={{ fontSize: '0.75rem', color: '#8e8e8e' }}>{event.subCategory?.name ?? 'Post'}</div>
          </div>
        </div>
        {images[0] ? (
          <div style={{ position: 'relative', width: '100%', backgroundColor: '#fafafa' }}>
            <div style={{ overflow: 'hidden', width: '100%' }}>
              <div style={{ display: 'flex', transform: `translateX(-${slideIndex * 100}%)`, transition: 'transform 0.3s ease-out' }}>
                {images.map((url, i) => (
                  <div key={i} style={{ minWidth: '100%', flexShrink: 0, minHeight: 'min(300px, 40vh)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={imageSrc(url)} alt="" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
                  </div>
                ))}
              </div>
            </div>
            {hasMultipleImages && (
              <>
                <button type="button" onClick={goPrev} aria-label="Previous" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', cursor: 'pointer' }}><i className="bi bi-chevron-left" /></button>
                <button type="button" onClick={goNext} aria-label="Next" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', cursor: 'pointer' }}><i className="bi bi-chevron-right" /></button>
              </>
            )}
          </div>
        ) : (
          <div style={{ minHeight: '200px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8e8e8e' }}><i className="bi bi-image" style={{ fontSize: '3rem' }} /></div>
        )}
        <div className="px-3 py-3">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a1f2e', marginBottom: '0.5rem' }}>{event.title}</h2>
          {event.description && <p className="text-muted mb-2 small" style={{ lineHeight: 1.5 }}>{event.description}</p>}
          {event.externalLink && <a href={event.externalLink} target="_blank" rel="noopener noreferrer" className="btn btn-dark  rounded-pill small">View link</a>}
        </div>
      </article>
    </>
  );
}

/** Detail view for an upcoming post — same layout as regular news (EventPostCard): logo, title, description, images. */
function UpcomingPostDetailCard({ post, onClose }: { post: UpcomingPostPublic; onClose: () => void }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const images = useMemo(() => parseImageUrls(post.imageUrls), [post.imageUrls]);
  const hasMultipleImages = images.length > 1;
  const schoolName = post.school?.name ?? 'School';
  const schoolLogoUrl = post.school?.image ? imageSrc(post.school.image) : '';

  useEffect(() => {
    setSlideIndex((i) => (i >= images.length ? Math.max(0, images.length - 1) : i));
  }, [images.length]);

  const goPrev = () => setSlideIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  const goNext = () => setSlideIndex((i) => (i >= images.length - 1 ? 0 : i + 1));

  return (
    <article
      className="card border-0 shadow-sm mb-4"
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '85vh',
        minHeight: 420,
      }}
    >
      {/* Header: school logo + name + subcategory — same as EventPostCard */}
      <div
        className="d-flex align-items-center justify-content-between px-3 py-2"
        style={{ borderBottom: '1px solid #efefef', flexShrink: 0, backgroundColor: '#fff' }}
      >
        <div className="d-flex align-items-center gap-2 min-w-0">
          {schoolLogoUrl ? (
            <img
              src={schoolLogoUrl}
              alt=""
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(63deg, rgb(39 158 247 / 35%), rgb(87 177 245 / 36%))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a1f2e',
                fontWeight: 700,
                fontSize: '0.9rem',
                flexShrink: 0,
              }}
            >
              {schoolName.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="min-w-0">
            <div style={{ fontWeight: 600, color: '#1a1f2e', fontSize: '0.95rem' }}>{schoolName}</div>
            <div style={{ fontSize: '0.75rem', color: '#8e8e8e' }}>{post.subCategory?.name ?? 'News'}</div>
          </div>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
          Close
        </button>
      </div>

      {/* Image — same 200px strip as blogs / news feed */}
      <div className="position-relative w-100 flex-shrink-0 overflow-hidden bg-light">
        <span
          className="position-absolute top-0 start-0 m-2 badge rounded-pill text-white z-2"
          style={{ backgroundColor: '#1a1f2e', fontSize: '0.7rem', fontWeight: 600 }}
        >
          Upcoming
        </span>
        {images[0] ? (
          <div className="w-100 overflow-hidden" style={{ height: 200 }}>
            <div
              className="d-flex h-100"
              style={{
                width: '100%',
                transform: `translateX(-${slideIndex * 100}%)`,
                transition: 'transform 0.3s ease-out',
              }}
            >
              {images.map((url, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 h-100"
                  style={{ minWidth: '100%', width: '100%' }}
                >
                  <img
                    src={imageSrc(url)}
                    alt=""
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      objectPosition: 'top',
                      display: 'block',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="d-flex align-items-center justify-content-center text-muted w-100"
            style={{ height: 160, backgroundColor: '#f8f9fa' }}
          >
            <i className="bi bi-image" style={{ fontSize: '2.5rem' }} />
          </div>
        )}
        {images[0] && hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="position-absolute z-2 border-0 d-flex align-items-center justify-content-center p-0"
              style={{
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                cursor: 'pointer',
              }}
            >
              <i className="bi bi-chevron-left" style={{ fontSize: '1.25rem', color: '#262626' }} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="position-absolute z-2 border-0 d-flex align-items-center justify-content-center p-0"
              style={{
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                cursor: 'pointer',
              }}
            >
              <i className="bi bi-chevron-right" style={{ fontSize: '1.25rem', color: '#262626' }} />
            </button>
            <div
              className="position-absolute start-0 end-0 d-flex justify-content-center gap-1 z-2"
              style={{ bottom: 8 }}
            >
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlideIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                  className="border-0 p-0"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    background: slideIndex === i ? '#1a1f2e' : 'rgba(0,0,0,0.2)',
                    boxShadow: '0 0 2px rgba(0,0,0,0.1)',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content: title + description — same as EventPostCard */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
        <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
          <div className="px-3 py-2">
            <h2
              style={{
                fontWeight: 700,
                color: '#1a1f2e',
                fontSize: '1.25rem',
                lineHeight: 1.3,
                marginBottom: '0.5rem',
              }}
            >
              {post.title}
            </h2>
            {post.description && (
              <div
                style={{
                  fontSize: '0.95rem',
                  color: '#495057',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {post.description}
              </div>
            )}
            <div className="small text-muted mt-1">{formatDate(post.scheduledTo)}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

function EventPostCard({
  event,
  likeCount,
  commentCount,
  isLiked,
  isSaved,
  currentUserId,
  onLike,
  onSave,
  onCommentAdded,
}: {
  event: ApprovedEventPublic;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  currentUserId: string | undefined;
  onLike: () => void;
  onSave: () => void;
  onCommentAdded: () => void;
}) {
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [schoolLogoError, setSchoolLogoError] = useState(false);
  const queryClient = useQueryClient();

  // Show all images in the slider; 2+ images use carousel with prev/next and dots
  const images = useMemo(() => parseImageUrls(event.imageUrls), [event.imageUrls]);
  const hasMultipleImages = images.length > 1;

  // Keep slide index in range when images change
  useEffect(() => {
    setSlideIndex((i) => (i >= images.length ? Math.max(0, images.length - 1) : i));
  }, [images.length]);

  const goPrev = () => setSlideIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  const goNext = () => setSlideIndex((i) => (i >= images.length - 1 ? 0 : i + 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null || !hasMultipleImages) return;
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX - endX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStartX(null);
  };
  const schoolName = event.school?.name ?? 'School';
  const schoolLogo = event.school?.image ?? null;
  const schoolLogoUrl = schoolLogo ? imageSrc(schoolLogo) : '';
  const description = event.description ?? '';
  useEffect(() => setSchoolLogoError(false), [schoolLogo]);

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['user', 'events', event.id, 'comments'],
    queryFn: () => userEventsService.getComments(event.id),
    enabled: commentsOpen && event.commentsEnabled,
  });

  const addCommentMutation = useMutation({
    mutationFn: (text: string) => userEventsService.addComment(event.id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'events', event.id, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'events', 'engagement'] });
      setCommentText('');
      onCommentAdded();
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => userEventsService.deleteComment(event.id, commentId),
    onSuccess: () => {
      setCommentToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['user', 'events', event.id, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['public', 'events', 'engagement'] });
      onCommentAdded();
    },
  });

  const displayDesc = expandedDesc ? description : description.slice(0, DESCRIPTION_PREVIEW_LENGTH);
  const hasMoreDesc = description.length > DESCRIPTION_PREVIEW_LENGTH && !expandedDesc;

  return (
    <article
      className="card border-0 shadow-sm mb-4"
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '85vh',
        minHeight: 420,
      }}
    >
      {/* Header: school logo + name + subcategory — above the image */}
      <div
        className="d-flex align-items-center justify-content-between px-3 py-2"
        style={{ borderBottom: '1px solid #efefef', flexShrink: 0, backgroundColor: '#fff' }}
      >
        <div className="d-flex align-items-center gap-2 min-w-0">
          {schoolLogoUrl && !schoolLogoError ? (
            <img
              src={schoolLogoUrl}
              alt=""
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
              onError={() => setSchoolLogoError(true)}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(63deg, rgb(39 158 247 / 35%), rgb(87 177 245 / 36%))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a1f2e',
                fontWeight: 700,
                fontSize: '0.9rem',
                flexShrink: 0,
              }}
            >
              {schoolName.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="min-w-0">
            <div style={{ fontWeight: 600, color: '#1a1f2e', fontSize: '0.95rem' }}>{schoolName}</div>
            <div style={{ fontSize: '0.75rem', color: '#8e8e8e' }}>{event.subCategory?.name ?? 'Post'}</div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-link p-1 text-secondary"
          aria-label="More options"
        >
          <i className="bi bi-three-dots" style={{ fontSize: '1.25rem' }} />
        </button>
      </div>

      {/* Image — same strip as blog cards: 200px tall, full width, cover */}
      <div
        className="position-relative w-100 flex-shrink-0 overflow-hidden bg-light"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <span
          className="position-absolute top-0 start-0 m-2 badge rounded-pill text-white z-2"
          style={{ backgroundColor: '#1a1f2e', fontSize: '0.7rem', fontWeight: 600 }}
        >
          News
        </span>
        {images[0] ? (
          <div className="w-100 overflow-hidden" style={{ height: 200 }}>
            <div
              className="d-flex h-100"
              style={{
                width: '100%',
                transform: `translateX(-${slideIndex * 100}%)`,
                transition: 'transform 0.3s ease-out',
              }}
            >
              {images.map((url, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 h-100"
                  style={{ minWidth: '100%', width: '100%' }}
                >
                  <img
                    src={imageSrc(url)}
                    alt=""
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      objectPosition: 'top',
                      display: 'block',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="d-flex align-items-center justify-content-center text-muted w-100"
            style={{ height: 160, backgroundColor: '#f8f9fa' }}
          >
            <i className="bi bi-image" style={{ fontSize: '2.5rem' }} />
          </div>
        )}
        {images[0] && hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="position-absolute z-2 border-0 d-flex align-items-center justify-content-center p-0"
              style={{
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                cursor: 'pointer',
              }}
            >
              <i className="bi bi-chevron-left" style={{ fontSize: '1.25rem', color: '#262626' }} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="position-absolute z-2 border-0 d-flex align-items-center justify-content-center p-0"
              style={{
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                cursor: 'pointer',
              }}
            >
              <i className="bi bi-chevron-right" style={{ fontSize: '1.25rem', color: '#262626' }} />
            </button>
            <div
              className="position-absolute start-0 end-0 d-flex justify-content-center gap-1 z-2"
              style={{ bottom: 8 }}
            >
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlideIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                  className="border-0 p-0"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    background: slideIndex === i ? '#1a1f2e' : 'rgba(0,0,0,0.2)',
                    boxShadow: '0 0 2px rgba(0,0,0,0.1)',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content — 70%: InShorts-style (source, title, description, likes, comments) */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff',
        }}
      >
        <div
          style={{
            overflowY: 'auto',
            flex: 1,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Title + description — InShorts-style typography */}
          <div className="px-3 py-2">
            <h2
              style={{
                fontWeight: 700,
                color: '#1a1f2e',
                fontSize: '1.25rem',
                lineHeight: 1.3,
                marginBottom: '0.5rem',
              }}
            >
              {event.title}
            </h2>
            {description && (
              <div
                style={{
                  fontSize: '0.95rem',
                  color: '#495057',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {displayDesc}
                {hasMoreDesc && (
                  <button
                    type="button"
                    className="btn btn-link p-0 ms-1 small text-muted"
                    onClick={() => setExpandedDesc(true)}
                  >
                    more
                  </button>
                )}
              </div>
            )}
            {event.externalLink && (
              <a
                href={event.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-dark rounded-pill mt-1 small"
              >
                View More
              </a>
            )}
            <div className="small text-muted mt-1">{formatDate(event.updatedAt)}</div>
          </div>

          {/* Comments list when open */}
          {event.commentsEnabled && commentsOpen && (
            <div className="px-3 py-2 border-top" style={{ backgroundColor: '#fafafa' }}>
              {commentsLoading ? (
                <div className="small text-muted">Loading comments…</div>
              ) : (
                <div className="mb-2">
                  {comments.map((c: EventCommentResponse) => (
                    <div key={c.id} className="d-flex align-items-start gap-2 mb-2 small">
                      <span style={{ fontWeight: 600, color: '#262626' }}>{c.user.name}</span>
                      <span style={{ color: '#262626', flex: 1 }}>{c.text}</span>
                      {currentUserId === c.user.id && (
                        <button
                          type="button"
                          onClick={() => setCommentToDelete(c.id)}
                          disabled={deleteCommentMutation.isPending}
                          aria-label="Delete comment"
                          style={{
                            padding: 0,
                            border: 'none',
                            background: 'none',
                            color: '#8e8e8e',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Engagement bar — fixed at bottom of 70% (like, comment, save) */}
        <div
          className="d-flex align-items-center gap-3 px-3 py-2"
          style={{
            borderTop: '1px solid #efefef',
            backgroundColor: '#fff',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            className="btn btn-link p-0 border-0 text-decoration-none"
            title={!currentUserId ? 'Login / signup required to like' : undefined}
            onClick={currentUserId ? onLike : undefined}
            style={{ color: isLiked ? '#ed4956' : '#262626', cursor: currentUserId ? 'pointer' : 'default' }}
            aria-label={currentUserId ? (isLiked ? 'Unlike' : 'Like') : 'Login / signup required to like'}
          >
            <i className={isLiked ? 'bi bi-heart-fill' : 'bi bi-heart'} style={{ fontSize: '1.5rem' }} />
          </button>
          {event.commentsEnabled && (
            <>
              <button
                type="button"
                className="btn btn-link p-0 border-0 text-secondary text-decoration-none"
                title={!currentUserId ? 'Login / signup required to comment' : undefined}
                onClick={currentUserId ? () => setCommentsOpen((o) => !o) : undefined}
                style={{ cursor: currentUserId ? 'pointer' : 'default' }}
                aria-label={currentUserId ? 'Comments' : 'Login / signup required to comment'}
              >
                <i className="bi bi-chat" style={{ fontSize: '1.5rem' }} />
              </button>
              <span className="text-muted small">{commentCount} Comment{commentCount !== 1 ? 's' : ''}</span>
            </>
          )}
          <span className="text-muted small">{likeCount} Like{likeCount !== 1 ? 's' : ''}</span>
          <div className="ms-auto">
            <button
              type="button"
              className="btn btn-link p-0 border-0 text-decoration-none"
              title={!currentUserId ? 'Login / signup required to save' : undefined}
              onClick={currentUserId ? onSave : undefined}
              style={{ color: isSaved ? '#262626' : '#262626', cursor: currentUserId ? 'pointer' : 'default' }}
              aria-label={currentUserId ? (isSaved ? 'Unsave' : 'Save') : 'Login / signup required to save'}
            >
              <i className={isSaved ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'} style={{ fontSize: '1.5rem' }} />
            </button>
          </div>
          <span className="text-muted small">{isSaved ? 'Saved' : 'Save'}</span>
        </div>

        {/* Comment input — inside 70% content, below engagement when comments open */}
        {event.commentsEnabled && commentsOpen && (
          <div
            className="d-flex gap-2 align-items-center px-3 py-2 border-top"
            style={{ backgroundColor: '#fafafa', flexShrink: 0 }}
          >
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Add a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (commentText.trim()) addCommentMutation.mutate(commentText.trim());
                }
              }}
              style={{ borderRadius: '8px', border: '1px solid #efefef' }}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!commentText.trim() || addCommentMutation.isPending}
              onClick={() => {
                if (commentText.trim()) addCommentMutation.mutate(commentText.trim());
              }}
              style={{ borderRadius: '8px' }}
            >
              Post
            </button>
          </div>
        )}
      </div>

      {/* Delete comment confirmation popup */}
      {commentToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-comment-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
          onClick={() => !deleteCommentMutation.isPending && setCommentToDelete(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '1.25rem 1.5rem',
              maxWidth: '340px',
              width: '90%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-comment-title" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a1f2e', marginBottom: '0.5rem' }}>
              Delete comment?
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '1.25rem' }}>
              This comment will be removed. This cannot be undone.
            </p>
            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                style={{ borderRadius: '8px' }}
                onClick={() => setCommentToDelete(null)}
                disabled={deleteCommentMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ borderRadius: '8px' }}
                onClick={() => commentToDelete && deleteCommentMutation.mutate(commentToDelete)}
                disabled={deleteCommentMutation.isPending}
              >
                {deleteCommentMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

const SPONSORED_AD_BG = '#e8f4fc';

function SponsoredAdCard({ ad }: { ad: SponsoredAdPublic }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const images = useMemo(() => parseImageUrls(ad.imageUrls), [ad.imageUrls]);
  const hasMultipleImages = images.length > 1;
  const schoolName = ad.school?.name ?? 'School';
  const schoolLogo = ad.school?.image ?? null;

  useEffect(() => {
    publicEventsService.recordSponsoredAdView(ad.id).catch(() => {});
  }, [ad.id]);

  const handleClick = () => {
    publicEventsService.recordSponsoredAdClick(ad.id).then((r) => {
      if (r.redirectUrl) window.open(r.redirectUrl, '_blank', 'noopener,noreferrer');
    }).catch(() => {});
  };

  return (
    <article
      className="card border-0 shadow-sm mb-4"
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 320,
        backgroundColor: SPONSORED_AD_BG,
      }}
    >
      {/* Ad badge top left + header */}
      <div
        className="d-flex align-items-center justify-content-between px-3 py-2 position-relative"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0, backgroundColor: SPONSORED_AD_BG }}
      >
        <span
          className="badge rounded-1 px-2 py-1"
          style={{ position: 'absolute', top: 8, left: 12, backgroundColor: '#0d6efd', color: '#fff', fontSize: '0.7rem', fontWeight: 600 }}
        >
          Ad
        </span>
        <div className="d-flex align-items-center gap-2 min-w-0 ms-4">
          {schoolLogo ? (
            <img src={imageSrc(schoolLogo)} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(63deg, rgb(39 158 247 / 35%), rgb(87 177 245 / 36%))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1a1f2e', fontSize: '0.9rem', flexShrink: 0 }}>
              {schoolName.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <div style={{ fontWeight: 600, color: '#1a1f2e', fontSize: '0.95rem' }}>{schoolName}</div>
        </div>
      </div>

      <button type="button" className="border-0 w-100 p-0 text-start d-block flex-grow-1" style={{ backgroundColor: SPONSORED_AD_BG }} onClick={handleClick}>
        {images.length > 0 ? (
          <div style={{ position: 'relative', width: '100%', height: 200, flexShrink: 0, overflow: 'hidden', backgroundColor: '#d0e8f5' }}>
            <div style={{ display: 'flex', width: '100%', height: '100%', transform: `translateX(-${slideIndex * 100}%)`, transition: 'transform 0.3s ease-out' }}>
              {images.map((url, i) => (
                <img key={i} src={imageSrc(url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', flexShrink: 0 }} />
              ))}
            </div>
            {hasMultipleImages && (
              <>
                <button type="button" className="position-absolute top-50 start-0 translate-middle-y btn btn-sm btn-light rounded-circle shadow" style={{ left: 8 }} onClick={(e) => { e.stopPropagation(); setSlideIndex((i) => (i <= 0 ? images.length - 1 : i - 1)); }} aria-label="Previous"><i className="bi bi-chevron-left" /></button>
                <button type="button" className="position-absolute top-50 end-0 translate-middle-y btn btn-sm btn-light rounded-circle shadow" style={{ right: 8 }} onClick={(e) => { e.stopPropagation(); setSlideIndex((i) => (i >= images.length - 1 ? 0 : i + 1)); }} aria-label="Next"><i className="bi bi-chevron-right" /></button>
                <div className="position-absolute bottom-2 start-50 translate-middle-x d-flex gap-1">
                  {images.map((_, i) => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: slideIndex === i ? '#fff' : 'rgba(255,255,255,0.5)' }} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ width: '100%', height: 120, flexShrink: 0, backgroundColor: '#d0e8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d' }}>
            <i className="bi bi-image" style={{ fontSize: '2rem' }} />
          </div>
        )}

        <div className="px-3 py-2 flex-grow-1">
          {(ad.title ?? '').trim() && <h2 style={{ fontWeight: 700, color: '#1a1f2e', fontSize: '1.25rem', marginBottom: '0.5rem' }}>{ad.title}</h2>}
          {(ad.description ?? '').trim() && <p className="mb-2 small" style={{ color: '#495057', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{ad.description}</p>}
          {ad.externalLink && <span className="small" style={{ color: '#0d6efd' }}>{ad.externalLink}</span>}
        </div>
      </button>
    </article>
  );
}

type FilterMode = 'none' | 'search' | 'school' | 'category';

export const PublicEvents = () => {
  const { user, logout, login } = useUserAuth();
  const navigate = useNavigate();
  const eventsFilter = useEventsFilter();
  const [searchParams, setSearchParams] = useSearchParams();
  // Guest can filter by school via ?schoolId=; logged-in uses their school or URL override.
  const schoolId = (user?.schoolId ?? searchParams.get('schoolId')) ?? null;

  const [filterPopupOpen, setFilterPopupOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('none');
  const [categoryLoginMessage, setCategoryLoginMessage] = useState(false);
  const [showSchoolLoadingPopup, setShowSchoolLoadingPopup] = useState(false);
  const [showNoNewsPopup, setShowNoNewsPopup] = useState(false);
  const [showRefreshHint, setShowRefreshHint] = useState(false);
  const location = useLocation();
  const [bottomNavActive, setBottomNavActive] = useState<'search' | 'home' | 'settings' | 'apps' | 'help' | 'liked'>('home');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSubmitLoading, setHelpSubmitLoading] = useState(false);
  const [helpSubmitError, setHelpSubmitError] = useState<string | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountStatus, setDeleteAccountStatus] = useState<'idle' | 'loading' | 'success' | 'failure'>('idle');
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [searchScreenQuery, setSearchScreenQuery] = useState('');
  const [selectedSearchEvent, setSelectedSearchEvent] = useState<ApprovedEventPublic | null>(null);
  const [searchScreenSchoolId, setSearchScreenSchoolId] = useState<string | null>(null);
  const [showSearchScreenNoNewsPopup, setShowSearchScreenNoNewsPopup] = useState(false);
  const [showSettingsLoginPopup, setShowSettingsLoginPopup] = useState(false);
  const [settingsLoginEmail, setSettingsLoginEmail] = useState('');
  const [settingsLoginPassword, setSettingsLoginPassword] = useState('');
  const [settingsLoginError, setSettingsLoginError] = useState<string | null>(null);
  const [settingsLoginLoading, setSettingsLoginLoading] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [showFirstLoginCategories, setShowFirstLoginCategories] = useState(false);
  const [showChangeCategoryModal, setShowChangeCategoryModal] = useState(false);
  const [categorySelectionSelectedIds, setCategorySelectionSelectedIds] = useState<string[]>([]);
  const [selectedLikedEvent, setSelectedLikedEvent] = useState<import('../services/user-events.service').LikedEventItem | null>(null);
  const [upcomingDateFilter, setUpcomingDateFilter] = useState<string | null>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  /** Pending date in calendar dropdown; only applied when user clicks OK (search runs then). */
  const [calendarPendingDate, setCalendarPendingDate] = useState<string | null>(null);
  const [selectedUpcomingPost, setSelectedUpcomingPost] = useState<UpcomingPostPublic | null>(null);
  const [googleCalDropdownPostId, setGoogleCalDropdownPostId] = useState<string | null>(null);
  const [googleCalReturnSuccess, setGoogleCalReturnSuccess] = useState(false);
  const [googleCalReturnError, setGoogleCalReturnError] = useState<string | null>(null);
  const [googleCalDropdownPosition, setGoogleCalDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const googleCalAnchorRef = useRef<HTMLButtonElement | null>(null);
  const calendarDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedSettingsEvent, setSelectedSettingsEvent] = useState<ApprovedEventPublic | null>(null);
  const [appsScreenKey, setAppsScreenKey] = useState(0);
  const [feedSort, setFeedSort] = useState<'latest' | 'popular'>('latest');
  const [showAllSchoolsFeed, setShowAllSchoolsFeed] = useState(false);
  const [contentExpandedCategoryId, setContentExpandedCategoryId] = useState<string | null>(null);
  const categoryButtonRefForContent = useRef<HTMLButtonElement | null>(null);
  const categoryDropdownRefForContent = useRef<HTMLDivElement | null>(null);
  const contentCategoriesRef = useRef<HTMLDivElement | null>(null);
  const selectedSubCategoryIds = eventsFilter?.selectedSubCategoryIds ?? [];
  const queryClient = useQueryClient();

  // When user returns from Google OAuth: read success/error from URL and show result
  useEffect(() => {
    const success = searchParams.get('googleCalSuccess');
    const error = searchParams.get('googleCalError');
    if (success === '1') {
      setGoogleCalReturnSuccess(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('googleCalSuccess');
        return next;
      }, { replace: true });
    }
    if (error) {
      setGoogleCalReturnError(decodeURIComponent(error));
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('googleCalError');
        return next;
      }, { replace: true });
    }
  }, [searchParams]);

  // Position and close Google Calendar dropdown: set position after ref is attached, close on outside click
  useEffect(() => {
    if (!googleCalDropdownPostId) {
      setGoogleCalDropdownPosition(null);
      return;
    }
    const raf = requestAnimationFrame(() => {
      const rect = googleCalAnchorRef.current?.getBoundingClientRect();
      if (rect) {
        const left = Math.max(8, Math.min(rect.right - 200, window.innerWidth - 208));
        setGoogleCalDropdownPosition({ top: rect.bottom + 4, left });
      }
    });
    const onDocClick = () => {
      setGoogleCalDropdownPostId(null);
      setGoogleCalDropdownPosition(null);
    };
    const t = setTimeout(() => document.addEventListener('click', onDocClick), 0);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      document.removeEventListener('click', onDocClick);
    };
  }, [googleCalDropdownPostId]);

  // For logged-in user on home: use their school and saved subcategory preferences for the feed
  const isLoggedInHome = !!user && bottomNavActive === 'home';
  const userCategoryDone = user ? getUserCategoryDone(user.id) : null;
  const userPreferredSubCategoryIds = isLoggedInHome && user && userCategoryDone === 'true' ? getUserSubCategoryIds(user.id) : null;
  const homeFeedSchoolId = isLoggedInHome && user ? user.schoolId : null;
  const homeFeedSubCategoryIds = isLoggedInHome ? (userPreferredSubCategoryIds ?? undefined) : undefined;

  // When "What's happening in all schools" is on, show all schools' news (effectiveSchoolId = null, no subcategory filter)
  const effectiveSchoolId =
    isLoggedInHome && showAllSchoolsFeed
      ? null
      : isLoggedInHome && homeFeedSchoolId
        ? homeFeedSchoolId
        : schoolId;
  const effectiveSubCategoryIds =
    isLoggedInHome && showAllSchoolsFeed
      ? undefined
      : selectedSubCategoryIds.length > 0
        ? selectedSubCategoryIds
        : (isLoggedInHome ? homeFeedSubCategoryIds : undefined);

  const { data: events = [], isLoading: eventsLoading, isFetching: eventsFetching, error } = useQuery({
    queryKey: ['public', 'events', 'approved', effectiveSchoolId ?? 'all', effectiveSubCategoryIds ?? []],
    queryFn: () =>
      publicEventsService.getApproved(
        effectiveSchoolId ?? undefined,
        effectiveSubCategoryIds?.length ? effectiveSubCategoryIds : undefined,
      ),
    enabled: true,
  });

  const { data: activeBannerAds = [] } = useQuery({
    queryKey: ['public', 'banner-ads', effectiveSchoolId ?? 'all'],
    queryFn: () => publicEventsService.getActiveBannerAds(effectiveSchoolId ?? undefined),
    enabled: bottomNavActive === 'home',
  });

  const displayBannerAd = useMemo(() => {
    if (!activeBannerAds.length) return null;
    return activeBannerAds[Math.floor(Math.random() * activeBannerAds.length)];
  }, [activeBannerAds]);

  useEffect(() => {
    if (!displayBannerAd?.id) return;
    publicEventsService.recordBannerAdView(displayBannerAd.id).catch(() => {});
  }, [displayBannerAd?.id]);

  const handleBannerAdClick = () => {
    if (!displayBannerAd?.id) return;
    publicEventsService.recordBannerAdClick(displayBannerAd.id).then((r) => {
      if (r.redirectUrl) window.open(r.redirectUrl, '_blank', 'noopener,noreferrer');
    }).catch(() => {});
  };

  const { data: activeSponsoredAds = [] } = useQuery({
    queryKey: ['public', 'sponsored-ads', effectiveSchoolId ?? 'all'],
    queryFn: () => publicEventsService.getActiveSponsoredAds(effectiveSchoolId ?? undefined),
    enabled: bottomNavActive === 'home',
  });

  // All events for search screen (optional school filter — uses searchScreenSchoolId only, not URL)
  const { data: allEventsForSearch = [], isLoading: searchEventsLoading, isFetching: searchEventsFetching } = useQuery({
    queryKey: ['public', 'events', 'approved', 'search', searchScreenSchoolId ?? 'all'],
    queryFn: () => publicEventsService.getApproved(searchScreenSchoolId ?? undefined, undefined),
    enabled: bottomNavActive === 'search',
  });

  // Recent news for settings screen
  const { data: settingsRecentEvents = [] } = useQuery({
    queryKey: ['public', 'events', 'approved', 'settings'],
    queryFn: () => publicEventsService.getApproved(undefined, undefined),
    enabled: bottomNavActive === 'settings',
  });
  const settingsRecentSorted = useMemo(
    () => [...settingsRecentEvents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [settingsRecentEvents],
  );

  // School social accounts (for Apps tab when user is logged in)
  const { data: schoolSocialAccounts = [] } = useQuery({
    queryKey: ['user', 'school-social-accounts', user?.id ?? ''],
    queryFn: () => userSchoolSocialService.getForMySchool(),
    enabled: !!user,
  });

  // When filter dropdown opens (and user logged in), set default calendar pending date to tomorrow
  useEffect(() => {
    if (filterDropdownOpen && user) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setCalendarPendingDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  }, [filterDropdownOpen, user]);

  // Upcoming posts by date (when user selects a date from calendar and clicks OK)
  const { data: upcomingPostsByDate = [] } = useQuery({
    queryKey: ['public', 'events', 'upcoming', upcomingDateFilter ?? ''],
    queryFn: () => publicEventsService.getUpcomingByDate(upcomingDateFilter!),
    enabled: !!upcomingDateFilter && !!upcomingDateFilter.trim(),
  });

  // Categories for first-login / change-category flow (by user's school)
  const showCategorySelection = (showFirstLoginCategories || showChangeCategoryModal) && !!user?.schoolId;
  const { data: categoriesForSelection = [], isLoading: categoriesForSelectionLoading } = useQuery({
    queryKey: ['public', 'events', 'categories', user?.schoolId ?? ''],
    queryFn: () => publicEventsService.getCategoriesBySchool(user!.schoolId),
    enabled: showCategorySelection,
  });

  // Categories for home content strip (category alphabet icons when logged in)
  const { data: homeCategories = [] } = useQuery({
    queryKey: ['public', 'events', 'categories', 'content', user?.schoolId ?? ''],
    queryFn: () => publicEventsService.getCategoriesBySchool(user!.schoolId),
    enabled: bottomNavActive === 'home' && !!user?.schoolId,
  });
  const userSavedSubIds = user?.id ? getUserSubCategoryIds(user.id) : [];
  const homeContentCategories =
    userSavedSubIds.length > 0
      ? homeCategories.filter((cat: CategoryPublic) =>
          cat.subcategories.some((s: { id: string }) => userSavedSubIds.includes(s.id)),
        )
      : homeCategories;

  const [categoryDropdownPosition, setCategoryDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  const toggleSubCategoryForContent = (subId: string, subName: string) => {
    const current = new Set(eventsFilter?.selectedSubCategoryIds ?? []);
    if (current.has(subId)) current.delete(subId);
    else current.add(subId);
    const ids = Array.from(current);
    const names = ids.map((id) => {
      for (const c of homeCategories) {
        const sub = c.subcategories.find((s: { id: string }) => s.id === id);
        if (sub) return sub.name;
      }
      return subName;
    });
    eventsFilter?.setSelectedSubCategories(ids, names);
  };

  const clearContentCategoryFilter = () => {
    setContentExpandedCategoryId(null);
    eventsFilter?.setSelectedCategory(null, null);
    eventsFilter?.setSelectedSubCategories([], []);
  };

  const toggleCategorySelectionSub = (subId: string) => {
    setCategorySelectionSelectedIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId],
    );
  };

  const saveCategorySelection = (skip: boolean) => {
    if (!user?.id) return;
    if (skip) {
      setUserCategoryDone(user.id, 'skip');
      setUserSubCategoryIds(user.id, []);
    } else {
      setUserCategoryDone(user.id, 'true');
      setUserSubCategoryIds(user.id, categorySelectionSelectedIds);
    }
    setShowFirstLoginCategories(false);
    setShowChangeCategoryModal(false);
    setCategorySelectionSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: ['public', 'events', 'approved'] });
  };

  const openChangeCategoryModal = () => {
    if (user?.id) setCategorySelectionSelectedIds(getUserSubCategoryIds(user.id));
    setShowChangeCategoryModal(true);
  };

  useEffect(() => {
    if (!contentExpandedCategoryId) {
      setCategoryDropdownPosition(null);
      return;
    }
    const el = categoryButtonRefForContent.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCategoryDropdownPosition({ top: rect.bottom + 4, left: rect.left });
  }, [contentExpandedCategoryId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inside = contentCategoriesRef.current?.contains(target) ?? false;
      const insideDropdown = categoryDropdownRefForContent.current?.contains(target) ?? false;
      if (!inside && !insideDropdown) setContentExpandedCategoryId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: likedEventsRaw, isLoading: likedEventsLoading, error: likedEventsError, refetch: refetchLikedEvents } = useQuery({
    queryKey: ['user', 'events', 'liked'],
    queryFn: async () => {
      const data = await userEventsService.getLikedEvents();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
  });
  const likedEvents = likedEventsRaw ?? [];

  const { data: myHelpQueries = [] } = useQuery({
    queryKey: ['user', 'help'],
    queryFn: () => userHelpService.getMyQueries(),
    enabled: !!user && (bottomNavActive === 'help' || showHelpModal),
  });

  const handleHelpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpMessage.trim()) return;
    setHelpSubmitError(null);
    setHelpSubmitLoading(true);
    try {
      await userHelpService.create(helpMessage.trim());
      setHelpMessage('');
      setShowHelpModal(false);
      queryClient.invalidateQueries({ queryKey: ['user', 'help'] });
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setHelpSubmitError(typeof msg === 'string' ? msg : 'Failed to submit. Try again.');
    } finally {
      setHelpSubmitLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword.trim()) return;
    setDeleteAccountStatus('loading');
    setDeleteAccountError(null);
    try {
      await userAuthService.deleteAccount(deleteAccountPassword.trim());
      setDeleteAccountStatus('success');
      logout();
      setTimeout(() => {
        setShowDeleteAccountModal(false);
        setDeleteAccountPassword('');
        setDeleteAccountStatus('idle');
        navigate('/events', { replace: true, state: { openAuth: 'login' } });
      }, 800);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setDeleteAccountError(typeof msg === 'string' ? msg : 'Account deletion failed. Please try again.');
      setDeleteAccountStatus('failure');
    }
  };

  const searchScreenFilteredEvents = useMemo(() => {
    if (!searchScreenQuery.trim()) return allEventsForSearch;
    const q = searchScreenQuery.trim().toLowerCase();
    return allEventsForSearch.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description?.toLowerCase().includes(q) ?? false) ||
        (e.school?.name?.toLowerCase().includes(q) ?? false) ||
        (e.subCategory?.name?.toLowerCase().includes(q) ?? false),
    );
  }, [allEventsForSearch, searchScreenQuery]);

  // When navigating with bottomNav in state, switch to that tab
  useEffect(() => {
    const tab = (location.state as { bottomNav?: string })?.bottomNav;
    if (tab && ['search', 'home', 'settings', 'apps', 'help', 'liked'].includes(tab)) {
      setBottomNavActive(tab as 'search' | 'home' | 'settings' | 'apps' | 'help' | 'liked');
    }
  }, [location.state]);

  // Refetch liked list when user opens the Liked tab so it's always up to date
  useEffect(() => {
    if (!!user && bottomNavActive === 'liked') {
      refetchLikedEvents();
    }
  }, [user, bottomNavActive, refetchLikedEvents]);

  // Restart Apps screen animation every time user visits the Apps tab
  useEffect(() => {
    if (bottomNavActive === 'apps') {
      setAppsScreenKey((k) => k + 1);
    }
  }, [bottomNavActive]);

  // When navigating with openAuth (or ?openAuth=), open login or signup popup so only the popup UI is used everywhere
  useEffect(() => {
    const fromState = (location.state as { openAuth?: 'login' | 'signup' })?.openAuth;
    const fromQuery = searchParams.get('openAuth');
    const openAuth = fromState ?? (fromQuery === 'login' || fromQuery === 'signup' ? fromQuery : null);
    if (openAuth === 'login') {
      setBottomNavActive('settings');
      setShowSettingsLoginPopup(true);
      setShowSignupPopup(false);
      if (fromQuery) {
        const next = new URLSearchParams(searchParams);
        next.delete('openAuth');
        setSearchParams(next, { replace: true });
      }
    } else if (openAuth === 'signup') {
      setBottomNavActive('settings');
      setShowSignupPopup(true);
      setShowSettingsLoginPopup(false);
      if (fromQuery) {
        const next = new URLSearchParams(searchParams);
        next.delete('openAuth');
        setSearchParams(next, { replace: true });
      }
    }
  }, [location.state, searchParams]);

  // First-time login: show category selection if user has not completed it
  useEffect(() => {
    if (!user?.id) return;
    const done = getUserCategoryDone(user.id);
    if (done === null) setShowFirstLoginCategories(true);
  }, [user?.id]);

  // Same Event records as category-admin approved-posts; guest sees all schools
  useEffect(() => {
    if (import.meta.env.DEV && !eventsLoading) {
      console.log('[PublicEvents] approved events:', events.length, error ? String(error) : 'ok');
    }
  }, [events.length, eventsLoading, error]);

  // When user selected a school on HOME: if has news → 3s loader then close filter; if none → coming-soon popup. Skip on Search screen.
  useEffect(() => {
    if (bottomNavActive === 'search') return;
    if (!schoolId || !showSchoolLoadingPopup || eventsLoading || eventsFetching) return;
    if (events.length > 0) {
      const t = setTimeout(() => {
        setShowSchoolLoadingPopup(false);
        setFilterMode('none');
        setFilterPopupOpen(false);
      }, 3000);
      return () => clearTimeout(t);
    }
    setShowSchoolLoadingPopup(false);
    setShowNoNewsPopup(true);
    setShowRefreshHint(true);
    const t = setTimeout(() => setShowRefreshHint(false), 3000);
    return () => clearTimeout(t);
  }, [
    bottomNavActive,
    schoolId,
    showSchoolLoadingPopup,
    eventsLoading,
    eventsFetching,
    events.length,
  ]);

  // Search screen: show "no news" popup only within search UI when selected school has no news
  useEffect(() => {
    if (bottomNavActive !== 'search' || !searchScreenSchoolId || searchEventsLoading || searchEventsFetching) {
      setShowSearchScreenNoNewsPopup(false);
      return;
    }
    if (allEventsForSearch.length === 0) setShowSearchScreenNoNewsPopup(true);
  }, [bottomNavActive, searchScreenSchoolId, searchEventsLoading, searchEventsFetching, allEventsForSearch.length]);

  // Search screen: when selected school has news, switch to Results view in the same screen
  useEffect(() => {
    if (bottomNavActive !== 'search' || !searchScreenSchoolId || searchEventsLoading || searchEventsFetching) return;
    if (allEventsForSearch.length > 0) setFilterMode('none');
  }, [bottomNavActive, searchScreenSchoolId, searchEventsLoading, searchEventsFetching, allEventsForSearch.length]);

  const eventIds = useMemo(
    () =>
      selectedSettingsEvent
        ? [selectedSettingsEvent.id]
        : bottomNavActive === 'search'
          ? allEventsForSearch.map((e) => e.id)
          : bottomNavActive === 'liked'
            ? (likedEvents as { id: string }[]).map((e) => e.id)
            : events.map((e) => e.id),
    [selectedSettingsEvent, bottomNavActive, allEventsForSearch, events, likedEvents],
  );

  const { data: engagement } = useQuery({
    queryKey: ['public', 'events', 'engagement', eventIds.join(',')],
    queryFn: () => userEventsService.getEngagement(eventIds),
    enabled: !!user && eventIds.length > 0,
  });

  const { data: publicEngagementCounts } = useQuery({
    queryKey: ['public', 'events', 'engagement-counts', eventIds.join(',')],
    queryFn: () => publicEventsService.getEngagementCounts(eventIds),
    enabled: !user && eventIds.length > 0,
  });

  const engagementQueryKey = ['public', 'events', 'engagement', eventIds.join(',')] as const;
  type EngagementContext = { prev: EngagementResponse | undefined; key: readonly [string, string, string, string] };

  const likeMutation = useMutation<
    { liked: boolean; count: number },
    Error,
    string,
    EngagementContext
  >({
    mutationFn: (eventId: string) => userEventsService.toggleLike(eventId),
    onMutate: async (eventId) => {
      const key = engagementQueryKey;
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<EngagementResponse>(key);
      if (prev) {
        const isLiked = prev.likedByMe.includes(eventId);
        const nextCount = (prev.likes?.[eventId] ?? 0) + (isLiked ? -1 : 1);
        queryClient.setQueryData<EngagementResponse>(key, {
          ...prev,
          likedByMe: isLiked ? prev.likedByMe.filter((id) => id !== eventId) : [...prev.likedByMe, eventId],
          likes: { ...prev.likes, [eventId]: Math.max(0, nextCount) },
        });
      }
      return { prev, key };
    },
    onSuccess: (data, eventId, context) => {
      const key = context?.key ?? engagementQueryKey;
      queryClient.setQueryData<EngagementResponse>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          likedByMe: data.liked ? [...old.likedByMe.filter((id) => id !== eventId), eventId] : old.likedByMe.filter((id) => id !== eventId),
          likes: { ...old.likes, [eventId]: data.count },
        };
      });
      queryClient.invalidateQueries({ queryKey: ['user', 'events', 'liked'] });
    },
    onError: (_err, _eventId, context) => {
      if (context?.prev != null && context?.key) queryClient.setQueryData(context.key, context.prev);
    },
  });

  const saveMutation = useMutation<
    { saved: boolean },
    Error,
    string,
    EngagementContext
  >({
    mutationFn: (eventId: string) => userEventsService.toggleSave(eventId),
    onMutate: async (eventId) => {
      const key = engagementQueryKey;
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<EngagementResponse>(key);
      if (prev) {
        const isSaved = prev.savedByMe.includes(eventId);
        queryClient.setQueryData<EngagementResponse>(key, {
          ...prev,
          savedByMe: isSaved ? prev.savedByMe.filter((id) => id !== eventId) : [...prev.savedByMe, eventId],
        });
      }
      return { prev, key };
    },
    onSuccess: (data, eventId, context) => {
      const key = context?.key ?? engagementQueryKey;
      queryClient.setQueryData<EngagementResponse>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          savedByMe: data.saved ? [...old.savedByMe.filter((id) => id !== eventId), eventId] : old.savedByMe.filter((id) => id !== eventId),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['user', 'events', 'saved'] });
    },
    onError: (_err, _eventId, context) => {
      if (context?.prev != null && context?.key) queryClient.setQueryData(context.key, context.prev);
    },
  });

  const filteredEvents = useMemo(() => {
    if (!eventsFilter?.searchQuery?.trim()) return events;
    const q = eventsFilter.searchQuery.trim().toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description?.toLowerCase().includes(q) ?? false) ||
        (e.subCategory?.name?.toLowerCase().includes(q) ?? false),
    );
  }, [events, eventsFilter?.searchQuery]);

  const likeCountsForSort = user ? engagement?.likes : publicEngagementCounts?.likes;

  const sortedEvents = useMemo(() => {
    const list = [...filteredEvents];
    if (feedSort === 'latest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      list.sort((a, b) => (likeCountsForSort?.[b.id] ?? 0) - (likeCountsForSort?.[a.id] ?? 0));
    }
    return list;
  }, [filteredEvents, feedSort, likeCountsForSort]);

  type FeedItem =
    | { type: 'event'; event: ApprovedEventPublic }
    | { type: 'sponsored'; ad: SponsoredAdPublic };
  const feedItems = useMemo((): FeedItem[] => {
    const sponsored: FeedItem[] = [...activeSponsoredAds]
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
      .map((ad) => ({ type: 'sponsored' as const, ad }));
    return [...sortedEvents.map((event) => ({ type: 'event' as const, event })), ...sponsored];
  }, [sortedEvents, activeSponsoredAds]);

  const { data: allSchools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['user', 'auth', 'schools'],
    queryFn: () => userAuthService.getSchools(),
    enabled: filterMode === 'school',
  });

  const schoolsForFilter = useMemo(() => {
    if (filterMode === 'school' && allSchools.length > 0) {
      return allSchools.map((s) => ({ id: s.id, name: s.name, image: s.image ?? null }));
    }
    const seen = new Set<string>();
    const fromEvents = events.filter((e) => {
      if (e.schoolId && !seen.has(e.schoolId)) {
        seen.add(e.schoolId);
        return true;
      }
      return false;
    }).map((e) => ({
      id: e.schoolId,
      name: e.school?.name ?? 'School',
      image: e.school?.image ?? null,
    }));
    return fromEvents;
  }, [filterMode, allSchools, events]);

  const isLoading = eventsLoading;

  const clearSchoolFilter = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('schoolId');
      return next;
    });
    setFilterMode('none');
  };

  const selectSchoolForSearch = (id: string) => {
    setSearchScreenSchoolId(id);
    queryClient.invalidateQueries({
      queryKey: ['public', 'events', 'approved', 'search', id],
    });
  };

  const clearSearchScreenSchoolFilter = () => {
    setSearchScreenSchoolId(null);
  };

  const handleSettingsLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoginError(null);
    if (!settingsLoginEmail.trim() || !settingsLoginPassword) {
      setSettingsLoginError('Email and password are required.');
      return;
    }
    setSettingsLoginLoading(true);
    try {
      await login(settingsLoginEmail.trim(), settingsLoginPassword);
      setShowSettingsLoginPopup(false);
      setSettingsLoginEmail('');
      setSettingsLoginPassword('');
      setBottomNavActive('home');
      navigate('/events', { replace: true });
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string | string[] } } };
      const msg = ax.response?.data?.message;
      const text = Array.isArray(msg) ? msg[0] : typeof msg === 'string' ? msg : null;
      if (text) {
        setSettingsLoginError(text);
      } else if (ax.response?.status === 401) {
        setSettingsLoginError('Incorrect email or password. Please check your details or sign up if you don\'t have an account.');
      } else {
        setSettingsLoginError('Login failed. Please try again.');
      }
    } finally {
      setSettingsLoginLoading(false);
    }
  };

  const selectSchool = (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('schoolId', id);
      return next;
    });
    setShowSchoolLoadingPopup(true);
    setShowNoNewsPopup(false);
    // Invalidate so we refetch for this school; avoids showing stale cached "no news" when switching from a school with no news to one with news
    queryClient.invalidateQueries({
      queryKey: ['public', 'events', 'approved', id, selectedSubCategoryIds],
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {user ? <SchoolNavbar /> : <Navbar />}
      {/* Refresh hint: only when user selected a school with no news; below nav, 3s auto-close, X to close — matches screenshot */}
      {showRefreshHint && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div
            role="status"
            aria-live="polite"
            style={{
              width: 'fit-content',
              backgroundColor: '#fff',
              padding: '0.6rem 1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span style={{ color: '#c00', fontWeight: 500, fontSize: '0.95rem' }}>
              Refresh the page to load another school news
            </span>
            <button
            type="button"
            onClick={() => setShowRefreshHint(false)}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              padding: '0.2rem',
              cursor: 'pointer',
              color: '#c00',
              fontSize: '1.1rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        </div>
      )}
      <div className="container py-4" style={{ paddingBottom: '5rem', backgroundColor: (bottomNavActive === 'search' || bottomNavActive === 'settings' || bottomNavActive === 'liked' || bottomNavActive === 'help' || bottomNavActive === 'apps') ? '#fff' : undefined }}>
        {/* First-login / Change category selection — categories (light blue), subcategories (light green), Skip + Next or Save; visible on any tab */}
        {(showFirstLoginCategories || showChangeCategoryModal) && user?.schoolId && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-selection-title"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: '72px',
              zIndex: 1060,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '520px',
                maxHeight: '85vh',
                overflowY: 'auto',
                background: '#fff',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid #eee',
              }}
            >
              <h2 id="category-selection-title" className="mb-2" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1f2e' }}>
                {showChangeCategoryModal ? 'Change your categories' : 'Select your categories'}
              </h2>
              <p className="text-muted small mb-4">
                {showChangeCategoryModal
                  ? 'Choose the categories and subcategories you want to see in your home feed.'
                  : 'Choose the categories and subcategories for your school. Your home feed will show news from your selections. You can skip and see all school news, or change this later in Settings.'}
              </p>
              {categoriesForSelectionLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status" />
                  <p className="mt-2 mb-0 small text-muted">Loading categories…</p>
                </div>
              ) : categoriesForSelection.length === 0 ? (
                <p className="text-muted small mb-4">No categories available for your school yet.</p>
              ) : (
                <div className="mb-4">
                  {categoriesForSelection.map((cat: CategoryPublic) => (
                    <div key={cat.id} className="mb-3">
                      <span
                        className="badge mb-2"
                        style={{ backgroundColor: 'rgba(13, 202, 240, 0.2)', color: '#0dcaf0', fontSize: '0.9rem', fontWeight: 600 }}
                      >
                        {cat.name}
                      </span>
                      <div className="d-flex flex-wrap gap-2">
                        {(cat.subcategories || []).map((sub) => {
                          const isSelected = categorySelectionSelectedIds.includes(sub.id);
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              className="badge border-0"
                              style={{
                                backgroundColor: isSelected ? 'rgba(25, 135, 84, 0.35)' : 'rgba(25, 135, 84, 0.15)',
                                color: isSelected ? '#0d6b3d' : '#198754',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                              }}
                              onClick={() => toggleCategorySelectionSub(sub.id)}
                            >
                              {sub.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="d-flex flex-wrap gap-2 justify-content-end">
                {showChangeCategoryModal && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    style={{ borderRadius: '10px' }}
                    onClick={() => { setShowChangeCategoryModal(false); setCategorySelectionSelectedIds([]); }}
                  >
                    Cancel
                  </button>
                )}
                {showFirstLoginCategories && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    style={{ borderRadius: '10px' }}
                    onClick={() => saveCategorySelection(true)}
                  >
                    Skip
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ borderRadius: '10px', backgroundColor: '#198754' }}
                  onClick={() => saveCategorySelection(false)}
                >
                  {showChangeCategoryModal ? 'Save' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help modal — raise query to school admin */}
        {showHelpModal && user && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: '72px',
              zIndex: 1060,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
            onClick={() => !helpSubmitLoading && setShowHelpModal(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '400px',
                background: '#fff',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="help-modal-title" className="mb-3" style={{ fontSize: '1.15rem', fontWeight: 600 }}>Raise a query</h3>
              <p className="small text-muted mb-3">Describe your issue. Your school admin will see it in the Users help section.</p>
              <form onSubmit={handleHelpSubmit}>
                <textarea
                  className="form-control mb-3"
                  rows={4}
                  placeholder="Your message…"
                  value={helpMessage}
                  onChange={(e) => { setHelpMessage(e.target.value); setHelpSubmitError(null); }}
                  style={{ borderRadius: '10px' }}
                />
                {helpSubmitError && <div className="small text-danger mb-2">{helpSubmitError}</div>}
                <div className="d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: '10px' }} onClick={() => !helpSubmitLoading && setShowHelpModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ borderRadius: '10px' }} disabled={helpSubmitLoading || !helpMessage.trim()}>
                    {helpSubmitLoading ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete account modal */}
        {showDeleteAccountModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: '72px',
              zIndex: 1060,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
            onClick={() => deleteAccountStatus !== 'loading' && setShowDeleteAccountModal(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '400px',
                background: '#fff',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h5 id="delete-account-title" className="mb-3" style={{ fontWeight: 600 }}>Delete account</h5>
              {deleteAccountStatus === 'loading' && (
                <div className="text-center py-3"><div className="spinner-border text-primary" role="status" /><p className="mt-2 mb-0 small text-muted">Deleting…</p></div>
              )}
              {deleteAccountStatus === 'success' && (
                <div className="text-center py-3">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '2rem' }} />
                  <p className="mt-2 mb-0">Account deleted. Redirecting…</p>
                </div>
              )}
              {deleteAccountStatus === 'failure' && (
                <div className="py-2">
                  <div className="small text-danger mb-2">{deleteAccountError ?? 'Something went wrong.'}</div>
                  <div className="d-flex gap-2 justify-content-end">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowDeleteAccountModal(false)}>Close</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => { setDeleteAccountStatus('idle'); setDeleteAccountError(null); }}>Try again</button>
                  </div>
                </div>
              )}
              {deleteAccountStatus === 'idle' && (
                <>
                  <p className="small text-muted mb-3">Enter your password to permanently delete your account. This cannot be undone.</p>
                  <input
                    type="password"
                    className="form-control mb-3"
                    placeholder="Your password"
                    value={deleteAccountPassword}
                    onChange={(e) => setDeleteAccountPassword(e.target.value)}
                    style={{ borderRadius: '10px' }}
                  />
                  <div className="d-flex gap-2 justify-content-end">
                    <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: '10px' }} onClick={() => setShowDeleteAccountModal(false)}>Cancel</button>
                    <button type="button" className="btn btn-danger" style={{ borderRadius: '10px' }} onClick={handleDeleteAccount} disabled={!deleteAccountPassword.trim()}>Delete account</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Filter popup: available from both Events and Search screens */}
        {filterPopupOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter options"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1050,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
            onClick={() => { setFilterPopupOpen(false); setCategoryLoginMessage(false); }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '1.5rem',
                maxWidth: '380px',
                width: '90%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1a1f2e', marginBottom: '1rem' }}>
                Filter events
              </h3>
              <div className="d-flex flex-column gap-2">
                <button
                  type="button"
                  className="btn text-start btn btn-dark rounded-pill  d-flex align-items-center gap-3 py-1 px-3"
                  style={{ borderRadius: '10px',  }}
                  onClick={() => {
                    setFilterPopupOpen(false);
                    setFilterMode('search');
                    eventsFilter?.setSearchQuery('');
                  }}
                >
                  <i className="bi bi-search" style={{ fontSize: '1.25rem' }} />
                  <span>Search news</span>
                </button>
                <button
                  type="button"
                  className="btn btn-dark text-start border-0 d-flex align-items-center gap-3 py-1 rounded-pill px-3"
                  style={{ borderRadius: '10px',  }}
                  onClick={() => {
                    setFilterPopupOpen(false);
                    setFilterMode('school');
                  }}
                >
                  <i className="bi bi-building" style={{ fontSize: '1.25rem' }} />
                  <span>Filter by school</span>
                </button>
                <button
                  type="button"
                  className="btn btn-dark rounded-pill text-start  d-flex align-items-center gap-3 py-1 px-3"
                  style={{ borderRadius: '10px',  }}
                  onClick={() => setCategoryLoginMessage(true)}
                >
                  <i className="bi bi-tags" style={{ fontSize: '1.25rem' }} />
                  <span>Filter via categories</span>
                </button>
                {categoryLoginMessage && (
                  <p className="small text-muted mb-0 mt-1 px-2 py-2 rounded" style={{ backgroundColor: '#f8f9fa', fontSize: '0.875rem' }}>
                    This feature requires login. Sign in to filter by categories and subcategories.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {bottomNavActive === 'search' ? (
          /* Search screen: white bg, within news/navbar width (600px) */
          <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', minHeight: '60vh' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <input
                type="search"
                className="form-control form-control-md rounded-pill"
                placeholder="Search news…"
                value={searchScreenQuery}
                onChange={(e) => setSearchScreenQuery(e.target.value)}
                style={{ borderRadius: '12px', border: '1px solid #dee2e6', flex: 1 }}
                aria-label="Search news"
              />
              <button
                type="button"
                className="btn btn-outline-secondary border rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48, flexShrink: 0 }}
                onClick={() => { setFilterPopupOpen(true); setCategoryLoginMessage(false); }}
                aria-label="Filter options"
              >
                <i className="bi bi-funnel" style={{ fontSize: '1.1rem' }} />
              </button>
            </div>

            {filterMode === 'school' ? (
              /* School filter UI inside search screen — uses searchScreenSchoolId only (not URL) */
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span style={{ fontWeight: 600, color: '#1a1f2e' }}>Select a school</span>
                  <div className="d-flex gap-2">
                    {searchScreenSchoolId && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-decoration-none"
                        onClick={() => { clearSearchScreenSchoolFilter(); }}
                      >
                        Show all
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-decoration-none"
                      onClick={() => { setFilterMode('none'); clearSearchScreenSchoolFilter(); setSelectedSearchEvent(null); }}
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="row justify-content-center g-3">
                  {schoolsLoading ? (
                    <div className="col-12 text-center py-4">
                      <div className="spinner-border text-secondary" role="status" />
                      <p className="mt-2 mb-0 small text-muted">Loading schools…</p>
                    </div>
                  ) : schoolsForFilter.length === 0 ? (
                    <div className="col-12 text-center py-4 text-muted small">No schools found.</div>
                  ) : (
                    schoolsForFilter.map((s) => {
                      const logoUrl = s.image ? imageSrc(s.image) : '';
                      const isSelected = searchScreenSchoolId === s.id;
                      return (
                        <div key={s.id} className="col-md-3 col-sm-6">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => selectSchoolForSearch(s.id)}
                            onKeyDown={(e) => e.key === 'Enter' && selectSchoolForSearch(s.id)}
                            style={{
                              border: isSelected ? '1px solid #dee2e6' : 'none',
                              borderRadius: '12px',
                              padding: '1rem',
                              textAlign: 'center',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#fff' : 'transparent',
                              boxShadow: isSelected ? '0 1px 8px rgba(0,0,0,0.08)' : 'none',
                            }}
                          >
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt=""
                                style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: '0.5rem', borderRadius: '8px' }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 56,
                                  height: 56,
                                  margin: '0 auto',
                                  borderRadius: '8px',
                                  background: 'rgb(26 31 46 / 6%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginBottom: '0.5rem',
                                }}
                              >
                                <i className="bi bi-building" style={{ fontSize: '1.5rem', color: '#1a1f2e' }} />
                              </div>
                            )}
                            <div style={{ fontWeight: '500', fontSize: '0.95rem', color: '#1a1f2e' }}>{s.name}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {searchEventsLoading || searchEventsFetching ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-secondary" role="status" />
                    <p className="mt-2 mb-0 small text-muted">Loading news…</p>
                  </div>
                ) : showSearchScreenNoNewsPopup && searchScreenSchoolId && allEventsForSearch.length === 0 ? (
                  <div
                    className="mt-3 p-3 rounded shadow-sm"
                    style={{ backgroundColor: '#fff', border: '1px solid #dee2e6' }}
                  >
                    <p className="mb-2 fw-medium" style={{ color: '#1a1f2e' }}>News of this school will be coming soon.</p>
                    <p className="small text-muted mb-2">Approved news from this school will appear here once category admins approve posts.</p>
                    <p className="small text-muted mb-3">Sign in or register with your school to like, comment, and save.</p>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setShowSearchScreenNoNewsPopup(false)}
                    >
                      OK
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                {searchScreenSchoolId && (
                  <div className="mb-2 d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-decoration-none p-0 text-primary"
                      onClick={() => setFilterMode('school')}
                    >
                      ← Change school
                    </button>
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-decoration-none p-0 text-secondary"
                      onClick={() => clearSearchScreenSchoolFilter()}
                    >
                      Show all
                    </button>
                  </div>
                )}
                <div className="mb-2">
                  <span className="badge rounded-pill bg-black bg-opacity-100 text-white" style={{ fontSize: '0.8rem' }}>
                    Browse category
                  </span>
                </div>
                {!user && (
                  <p className="small text-muted mb-3">
                    Sign in to avail this filter.
                  </p>
                )}
                <div className="mb-2 mt-3">
                  <span className="badge bg-dark bg-opacity-100 text-white rounded-pill" style={{ fontSize: '0.8rem' }}>
                    Results
                  </span>
                </div>
                {selectedSearchEvent ? (
                  <div>
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-decoration-none mb-2 p-0"
                      onClick={() => setSelectedSearchEvent(null)}
                    >
                      ← Back to results
                    </button>
                    <EventPostCard
                      event={selectedSearchEvent}
                      likeCount={engagement?.likes?.[selectedSearchEvent.id] ?? 0}
                      commentCount={engagement?.commentCounts?.[selectedSearchEvent.id] ?? 0}
                      isLiked={engagement?.likedByMe?.includes(selectedSearchEvent.id) ?? false}
                      isSaved={engagement?.savedByMe?.includes(selectedSearchEvent.id) ?? false}
                      currentUserId={user?.id}
                      onLike={() => likeMutation.mutate(selectedSearchEvent.id)}
                      onSave={() => saveMutation.mutate(selectedSearchEvent.id)}
                      onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ['public', 'events', 'engagement'] })}
                    />
                  </div>
                ) : searchEventsLoading || searchEventsFetching ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-secondary" role="status" />
                    <p className="mt-2 mb-0 small text-muted">Loading…</p>
                  </div>
                ) : searchScreenFilteredEvents.length === 0 ? (
                  <p className="text-muted small mb-0">
                    {searchScreenQuery.trim()
                      ? 'No news match your search.'
                      : searchScreenSchoolId
                        ? 'No approved news for this school yet.'
                        : 'No approved news yet.'}
                  </p>
                ) : searchScreenSchoolId ? (
                  /* School selected: show full news cards for that school */
                  <div className="d-flex flex-column gap-3">
                    {searchScreenFilteredEvents.map((event: ApprovedEventPublic) => (
                      <EventPostCard
                        key={event.id}
                        event={event}
                        likeCount={engagement?.likes?.[event.id] ?? 0}
                        commentCount={engagement?.commentCounts?.[event.id] ?? 0}
                        isLiked={engagement?.likedByMe?.includes(event.id) ?? false}
                        isSaved={engagement?.savedByMe?.includes(event.id) ?? false}
                        currentUserId={user?.id}
                        onLike={() => likeMutation.mutate(event.id)}
                        onSave={() => saveMutation.mutate(event.id)}
                        onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ['public', 'events', 'engagement'] })}
                      />
                    ))}
                  </div>
                ) : (
                  /* Default: compact list (logo, title, school name); click title to open full article */
                  <ul className="list-unstyled mb-0">
                    {searchScreenFilteredEvents.map((event: ApprovedEventPublic) => {
                      const schoolLogo = event.school?.image ?? null;
                      const schoolLogoUrl = schoolLogo ? imageSrc(schoolLogo) : '';
                      return (
                        <li key={event.id} className="py-3 border-bottom d-flex align-items-center gap-3" style={{ borderColor: '#eee' }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '8px',
                              backgroundColor: 'rgb(26 31 46 / 8%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              overflow: 'hidden',
                            }}
                          >
                            {schoolLogoUrl ? (
                              <img
                                src={schoolLogoUrl}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('d-none');
                                }}
                              />
                            ) : null}
                            <i className={`bi bi-building ${schoolLogoUrl ? 'd-none' : ''}`} style={{ fontSize: '1.1rem', color: '#1a1f2e' }} />
                          </div>
                          <div className="flex-grow-1 min-width-0">
                            <button
                              type="button"
                              className="btn btn-link p-0 text-start text-decoration-none w-100 text-dark fw-medium"
                              style={{ fontSize: '0.95rem', lineHeight: 1.3 }}
                              onClick={() => setSelectedSearchEvent(event)}
                            >
                              {event.title}
                            </button>
                            <span className="text-muted small d-block mt-1">{event.school?.name ?? 'School'}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        ) : bottomNavActive === 'settings' ? (
          /* Settings screen — width matches news/navbar */
          <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', minHeight: '60vh', paddingBottom: '1rem' }}>
            {!user ? (
              /* Guest: animation icon, login prompt, Login + Sign up buttons, recently added, footer links */
              <>
                <div className="d-flex align-items-start gap-3 mb-4">
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      backgroundColor: 'rgb(26 31 46 / 8%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <i className="bi bi-person" style={{ fontSize: '1.75rem', color: '#1a1f2e' }} />
                  </div>
                  <p className="small text-muted mb-0 pt-1">
                    To get filterised categories and subcategories news, like comment and saved options needs login.
                  </p>
                </div>
                <div className="d-flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    className="btn btn-dark rounded-pill px-3"
                    
                    onClick={() => setShowSettingsLoginPopup(true)}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className="btn rounded-pill btn-outline-dark px-3 d-inline-flex align-items-center gap-2"
                    
                    onClick={() => setShowSignupPopup(true)}
                  >
                    <i className="bi bi-person-plus" />
                    Sign up
                  </button>
                </div>
                <hr className="my-4" />
                <h6 className="fw-semibold mb-3" style={{ color: '#1a1f2e' }}>Recently added schools / news</h6>
                {settingsRecentSorted.length === 0 ? (
                  <p className="small text-muted">No news yet.</p>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {settingsRecentSorted.map((e: ApprovedEventPublic) => {
                      const schoolLogo = e.school?.image ?? null;
                      const schoolLogoUrl = schoolLogo ? imageSrc(schoolLogo) : '';
                      return (
                        <li
                          key={e.id}
                          role="button"
                          tabIndex={0}
                          className="py-2 border-bottom d-flex align-items-center gap-3"
                          style={{ borderColor: '#eee', cursor: 'pointer' }}
                          onClick={() => {
                            setBottomNavActive('home');
                            if (e.schoolId) {
                              setSearchParams((prev) => {
                                const next = new URLSearchParams(prev);
                                next.set('schoolId', e.schoolId);
                                return next;
                              });
                            }
                            setSelectedSettingsEvent(e);
                            navigate('/events', { replace: true });
                          }}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                              ev.preventDefault();
                              setBottomNavActive('home');
                              if (e.schoolId) {
                                setSearchParams((prev) => {
                                  const next = new URLSearchParams(prev);
                                  next.set('schoolId', e.schoolId);
                                  return next;
                                });
                              }
                              setSelectedSettingsEvent(e);
                              navigate('/events', { replace: true });
                            }
                          }}
                        >
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '8px',
                              backgroundColor: 'rgb(26 31 46 / 8%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              overflow: 'hidden',
                            }}
                          >
                            {schoolLogoUrl ? (
                              <img src={schoolLogoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <i className="bi bi-building" style={{ fontSize: '1rem', color: '#1a1f2e' }} />
                            )}
                          </div>
                          <div className="min-width-0 flex-grow-1">
                            <span className="fw-medium d-block text-truncate" style={{ fontSize: '0.95rem', color: '#1a1f2e' }}>{e.title}</span>
                            <span className="text-muted small">{e.school?.name ?? 'School'}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <hr className="my-4" />
                <div className="d-flex flex-wrap gap-3 small">
                  <a href="https://sembuzz.com/#privacy" target="_blank" rel="noopener noreferrer" className="text-secondary">
                    Privacy policy
                  </a>
                  <a href="https://sembuzz.com/#terms-of-service" target="_blank" rel="noopener noreferrer" className="text-secondary">
                    Terms and conditions
                  </a>
                </div>
              </>
            ) : (
              /* Logged in: profile pic with name and email beside it; action buttons with light Bootstrap bg colors */
              <>
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      backgroundColor: 'rgb(26 31 46 / 8%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {user.profilePicUrl ? (
                      <img
                        src={imageSrc(user.profilePicUrl)}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="bi bi-person-fill" style={{ fontSize: '1.75rem', color: '#1a1f2e' }} />
                    )}
                  </div>
                  <div className="min-width-0">
                    <div className="fw-semibold text-truncate" style={{ fontSize: '1.05rem', color: '#1a1f2e' }}>{user.name}</div>
                    <div className="small text-muted text-truncate">{user.email}</div>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-2 mb-4" style={{ gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn text-start btn-outline-dark rounded-pill d-flex align-items-center gap-2 py-2 px-3"
                    style={{ borderRadius: '10px', flex: '0 0 auto', whiteSpace: 'nowrap' }}
                    onClick={openChangeCategoryModal}
                  >
                    <i className="bi bi-folder" />
                    Change categories
                  </button>
                  <button
                    type="button"
                    className="btn text-start btn-outline-dark  rounded-pill d-flex align-items-center gap-2 py-2 px-3"
                    style={{ borderRadius: '10px', flex: '0 0 auto', whiteSpace: 'nowrap' }}
                    onClick={() => setBottomNavActive('liked')}
                  >
                    <i className="bi bi-heart" />
                    Liked news
                  </button>
                  <button
                    type="button"
                    className="btn text-start  btn-outline-dark rounded-pill d-flex align-items-center gap-2 py-2 px-3"
                    style={{ borderRadius: '10px',  flex: '0 0 auto', whiteSpace: 'nowrap' }}
                    onClick={() => navigate('/saved')}
                  >
                    <i className="bi bi-bookmark" />
                    Saved news
                  </button>
                  <button
                    type="button"
                    className="btn text-start  btn-outline-dark rounded-pill d-flex align-items-center gap-2 py-2 px-3"
                    style={{ borderRadius: '10px', flex: '0 0 auto', whiteSpace: 'nowrap' }}
                    onClick={() => setShowHelpModal(true)}
                  >
                    <i className="bi bi-question-circle" />
                    Help — raise a query to school admin
                  </button>
                  <button
                    type="button"
                    className="btn text-start btn-dark rounded-pill border d-flex align-items-center gap-2 py-2 px-3"
                    style={{ borderRadius: '10px',  flex: '0 0 auto', whiteSpace: 'nowrap' }}
                    onClick={() => { logout(); navigate('/events'); }}
                  >
                    <i className="bi bi-box-arrow-right" />
                    Sign out
                  </button>
                  <button
                    type="button"
                    className="btn text-start  btn-outline-danger rounded-pill d-flex align-items-center gap-2 py-2 px-3"
                    style={{ borderRadius: '10px',  flex: '0 0 auto', whiteSpace: 'nowrap' }}
                    onClick={() => setShowDeleteAccountModal(true)}
                  >
                    <i className="bi bi-trash" />
                    Delete account
                  </button>
                </div>
                <hr className="my-4" />
                <h6 className="fw-semibold mb-3" style={{ color: '#1a1f2e' }}>Recently added schools / news</h6>
                {settingsRecentSorted.length === 0 ? (
                  <p className="small text-muted">No news yet.</p>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {settingsRecentSorted.map((e: ApprovedEventPublic) => {
                      const schoolLogo = e.school?.image ?? null;
                      const schoolLogoUrl = schoolLogo ? imageSrc(schoolLogo) : '';
                      return (
                        <li
                          key={e.id}
                          role="button"
                          tabIndex={0}
                          className="py-2 border-bottom d-flex align-items-center gap-3"
                          style={{ borderColor: '#eee', cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedSettingsEvent(e);
                            setBottomNavActive('home');
                            navigate('/events', { replace: true });
                          }}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                              ev.preventDefault();
                              setSelectedSettingsEvent(e);
                              setBottomNavActive('home');
                              navigate('/events', { replace: true });
                            }
                          }}
                        >
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '8px',
                              backgroundColor: 'rgb(26 31 46 / 8%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              overflow: 'hidden',
                            }}
                          >
                            {schoolLogoUrl ? (
                              <img src={schoolLogoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <i className="bi bi-building" style={{ fontSize: '1rem', color: '#1a1f2e' }} />
                            )}
                          </div>
                          <div className="min-width-0 flex-grow-1">
                            <span className="fw-medium d-block text-truncate" style={{ fontSize: '0.95rem', color: '#1a1f2e' }}>{e.title}</span>
                            <span className="text-muted small">{e.school?.name ?? 'School'}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <hr className="my-4" />
                <div className="d-flex flex-wrap gap-3 small">
                  <a href="https://sembuzz.com/#privacy" target="_blank" rel="noopener noreferrer" className="text-secondary">
                    Privacy policy
                  </a>
                  <a href="https://sembuzz.com/#terms-of-service" target="_blank" rel="noopener noreferrer" className="text-secondary">
                    Terms and conditions
                  </a>
                </div>
              </>
            )}
            {/* Login popup — glass finish; overlay does not cover bottom nav so nav stays visible */}
            {showSettingsLoginPopup && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-login-title"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: '72px',
                  zIndex: 1060,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
                onClick={() => !settingsLoginLoading && setShowSettingsLoginPopup(false)}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '380px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
                    border: '1px solid rgba(255,255,255,0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1" />
                    <button
                      type="button"
                      className="btn btn-link p-0 text-secondary"
                      style={{ fontSize: '1.25rem', lineHeight: 1 }}
                      onClick={() => !settingsLoginLoading && setShowSettingsLoginPopup(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-center mb-3" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#1a1f2e' }}>
                    Sembuzz
                  </div>
                  <h2 id="settings-login-title" className="text-center mb-4" style={{ fontSize: '1.15rem', fontWeight: 600, color: '#495057' }}>
                    Login to your Account
                  </h2>
                  <form onSubmit={handleSettingsLoginSubmit}>
                    <div className="mb-3">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Email"
                        value={settingsLoginEmail}
                        onChange={(e) => { setSettingsLoginEmail(e.target.value); setSettingsLoginError(null); }}
                        autoComplete="email"
                        style={{ borderRadius: '10px', border: '1px solid #dee2e6' }}
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Password"
                        value={settingsLoginPassword}
                        onChange={(e) => { setSettingsLoginPassword(e.target.value); setSettingsLoginError(null); }}
                        autoComplete="current-password"
                        style={{ borderRadius: '10px', border: '1px solid #dee2e6' }}
                      />
                    </div>
                    {settingsLoginError && (
                      <div className="small text-danger mb-2">{settingsLoginError}</div>
                    )}
                    <button
                      type="submit"
                      className="btn btn-dark rounded-pill w-100"
                      disabled={settingsLoginLoading}
                      style={{
                        borderRadius: '10px',
                        
                        fontWeight: 500,
                        padding: '0.6rem 1rem',
                      }}
                    >
                      {settingsLoginLoading ? 'Signing in…' : 'Sign in'}
                    </button>
                  </form>
                  <p className="text-center mt-3 mb-0 small text-muted">
                    Create new account?{' '}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-primary text-decoration-none"
                      onClick={() => { setShowSettingsLoginPopup(false); setShowSignupPopup(true); }}
                    >
                      Sign up
                    </button>
                  </p>
                  <hr className="my-3" />
                  <div className="d-flex flex-wrap gap-3 small justify-content-center">
                    <a href="https://sembuzz.com/#privacy" target="_blank" rel="noopener noreferrer" className="text-secondary">
                      Privacy policy
                    </a>
                    <a href="https://sembuzz.com/#terms-of-service" target="_blank" rel="noopener noreferrer" className="text-secondary">
                      Terms and conditions
                    </a>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link btn-sm w-100 mt-2 p-0 text-secondary text-decoration-none"
                    onClick={() => !settingsLoginLoading && setShowSettingsLoginPopup(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {/* Signup popup — same glass UI; step 1: method choice; privacy/terms; then navigate to /register */}
            {showSignupPopup && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-signup-title"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: '72px',
                  zIndex: 1060,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
                onClick={() => setShowSignupPopup(false)}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '420px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
                    border: '1px solid rgba(255,255,255,0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="flex-grow-1" />
                    <button
                      type="button"
                      className="btn btn-link p-0 text-secondary"
                      style={{ fontSize: '1.25rem', lineHeight: 1 }}
                      onClick={() => setShowSignupPopup(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-center mb-3" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#1a1f2e' }}>
                    Sembuzz
                  </div>
                  <h2 id="settings-signup-title" className="text-center mb-2" style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1a1f2e' }}>
                    How are you able to create an account?
                  </h2>
                  <p className="text-center text-muted small mb-4">
                    Choose the option that applies to you. This helps us verify your identity.
                  </p>
                  <div className="d-flex flex-column gap-3 mb-4">
                    <button
                      type="button"
                      className="btn w-100 py-3 d-flex flex-column align-items-center text-start"
                      style={{
                        borderRadius: '12px',
                        border: '1px solidrgb(0, 0, 0)',
                        backgroundColor: 'rgb(255, 255, 255)',
                        color: '#0d6efd',
                      }}
                      onClick={() => {
                        setShowSignupPopup(false);
                        navigate('/register', { state: { registrationMethod: 'school_domain' } });
                      }}
                    >
                      <i className="bi text-dark bi-building" style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                      <span className="fw-semibold text-dark">School domain</span>
                      <small className="text-muted mt-1 text-center" style={{ color: '#6c757d' }}>
                        I have an email with my school&apos;s domain (e.g. @sembuzz.com)
                      </small>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-dark w-100 py-3 d-flex flex-column align-items-center text-start"
                      style={{ borderRadius: '12px', borderWidth: '1px' }}
                      onClick={() => {
                        setShowSignupPopup(false);
                        navigate('/register', { state: { registrationMethod: 'gmail' } });
                      }}
                    >
                      <span className="fw-semibold" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>G</span>
                      <span className="fw-semibold">Gmail / Yahoo / other</span>
                      <small className=" mt-1 text-center">
                        I will use a personal email (Gmail, Yahoo, etc.); upload a school doc for admin approval
                      </small>
                    </button>
                  </div>
                  <hr className="my-3" />
                  <div className="d-flex flex-wrap gap-3 small justify-content-center">
                    <a href="https://sembuzz.com/#privacy" target="_blank" rel="noopener noreferrer" className="text-secondary">
                      Privacy policy
                    </a>
                    <a href="https://sembuzz.com/#terms-of-service" target="_blank" rel="noopener noreferrer" className="text-secondary">
                      Terms and conditions
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : bottomNavActive === 'liked' ? (
          /* Liked news — same as Saved: list + full post detail when item selected */
          <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '1rem' }}>
            {selectedLikedEvent ? (
              <LikedEventDetailView event={selectedLikedEvent} onBack={() => setSelectedLikedEvent(null)} />
            ) : (
              <>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <button type="button" className="btn btn-link p-0 text-decoration-none d-flex align-items-center" onClick={() => setBottomNavActive('settings')} aria-label="Back to Settings">
                    <i className="bi bi-arrow-left" style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
                  </button>
                  <h2 className="mb-0" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1f2e' }}>Liked news</h2>
                </div>
                {likedEventsLoading ? (
                  <div className="text-center py-4"><div className="spinner-border text-primary" role="status" /><p className="mt-2 mb-0 small text-muted">Loading…</p></div>
                ) : likedEventsError ? (
                  <div className="text-center py-4">
                    <p className="text-muted small mb-2">Couldn&apos;t load liked list.</p>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => refetchLikedEvents()}>Try again</button>
                  </div>
                ) : likedEvents.length === 0 ? (
                  <p className="text-muted small">No liked news yet. Like posts from your home feed to see them here.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {(likedEvents as import('../services/user-events.service').LikedEventItem[]).map((event) => {
                      const schoolName = event.school?.name ?? 'School';
                      const schoolLogo = event.school?.image ?? null;
                      const location = event.school?.city ?? event.school?.name ?? event.subCategory?.name ?? '—';
                      return (
                        <div
                          key={event.id}
                          className="d-flex align-items-center gap-3 p-3 rounded-3 border bg-white"
                          style={{ borderColor: '#eee', cursor: 'pointer' }}
                          onClick={() => setSelectedLikedEvent(event)}
                        >
                          {schoolLogo ? (
                            <img src={imageSrc(schoolLogo)} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d', fontWeight: 700, flexShrink: 0 }}>
                              {schoolName.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                          )}
                          <div className="flex-grow-1 min-w-0">
                            <div style={{ fontWeight: 600, color: '#1a1f2e', fontSize: '0.95rem' }}>{event.title}</div>
                            <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>{location}</div>
                          </div>
                          <i className="bi bi-chevron-right text-muted" style={{ fontSize: '1rem' }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        ) : bottomNavActive === 'help' ? (
          /* My help queries feed + raise query */
          <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '1rem' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none d-flex align-items-center"
                onClick={() => setBottomNavActive('settings')}
                aria-label="Back to Settings"
              >
                <i className="bi bi-arrow-left" style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
              </button>
              <h2 className="mb-0" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1f2e' }}>Help — my queries</h2>
            </div>
            <button
              type="button"
              className="btn btn-primary mb-4"
              style={{ borderRadius: '10px' }}
              onClick={() => setShowHelpModal(true)}
            >
              <i className="bi bi-plus-circle me-2" />
              Raise a query to school admin
            </button>
            {myHelpQueries.length === 0 ? (
              <p className="text-muted small">No queries yet. Use the button above if you face any issue.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {myHelpQueries.map((q: { id: string; message: string; status: string; createdAt: string }) => (
                  <li key={q.id} className="py-3 border-bottom" style={{ borderColor: '#eee' }}>
                    <p className="mb-1 small text-muted">{new Date(q.createdAt).toLocaleString()}</p>
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{q.message}</p>
                    <span className="badge bg-secondary mt-1" style={{ fontSize: '0.75rem' }}>{q.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : bottomNavActive === 'apps' ? (
          /* Apps — horizontally centered (left–right), top-aligned (no vertical center); school name when logged in, else Sembuzz */
          <div
            className="d-flex flex-column align-items-center justify-content-start"
            style={{
              width: '100%',
              paddingBottom: '1rem',
            }}
          >
            <div key={appsScreenKey} className="d-flex flex-column align-items-center mb-4" style={{ width: '100%', maxWidth: '600px' }}>
              <div className="d-flex flex-wrap justify-content-center" style={{ gap: '0.15rem' }} aria-hidden="true">
                {(user?.schoolName?.trim() || 'Sembuzz').split('').map((letter, i) => (
                  <span
                    key={i}
                    className="sembuzz-letter"
                    style={{
                      display: 'inline-block',
                      fontSize: '2rem',
                      color: '#1a1f2e',
                      opacity: 0,
                      animation: 'sembuzz-reveal 0.35s ease forwards',
                      animationDelay: `${i * 0.06}s`,
                    }}
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
            <h2 className="mb-4 text-center w-100" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1f2e' }}>Follow us</h2>
            <div className="d-flex flex-column align-items-center w-100" style={{ gap: '1.5rem', maxWidth: '600px' }}>
              {user && schoolSocialAccounts.length > 0 ? (
                (() => {
                  const groups = schoolSocialAccounts.reduce<{ key: string; icon: string; pageName: string; accounts: SchoolSocialAccountPublic[] }[]>((acc, account) => {
                    const key = `${account.pageName}|${account.icon}`;
                    const existing = acc.find((g) => g.key === key);
                    if (existing) existing.accounts.push(account);
                    else acc.push({ key, icon: account.icon, pageName: account.pageName, accounts: [account] });
                    return acc;
                  }, []);
                  return groups.map((group) => (
                    <div key={group.key} className="d-flex flex-column align-items-center w-100" style={{ maxWidth: '400px' }}>
                      <div className="d-flex align-items-center gap-2 mb-2 w-100 justify-content-center flex-wrap">
                        <span
                          className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0 overflow-hidden"
                          style={{ width: 44, height: 44, backgroundColor: '#fff', border: '1px solid #eee' }}
                        >
                          {isClubIconUrl(group.icon) ? (
                            <img src={group.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : group.icon.startsWith('fa-') ? (
                            <i className={group.icon} style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
                          ) : (
                            <i className={`bi ${group.icon}`} style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
                          )}
                        </span>
                        <span style={{ fontWeight: 600, color: '#1a1f2e', fontSize: '1.1rem' }}>{group.pageName || 'Club'}</span>
                      </div>
                      <div className="d-flex flex-wrap gap-2 justify-content-center">
                        {group.accounts.map((acc) => {
                          const iconColor = PLATFORM_COLORS[acc.platformId] ?? '#1a1f2e';
                          const platformIcon = PLATFORM_ICONS[acc.platformId] ?? 'bi-link';
                          return (
                            <a
                              key={acc.id}
                              href={acc.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="d-flex align-items-center justify-content-center rounded-3 text-decoration-none"
                              style={{ width: 48, height: 48, color: iconColor, backgroundColor: `${iconColor}18`, transition: 'transform 0.2s ease' }}
                              aria-label={acc.platformName}
                              title={acc.platformName}
                            >
                              <i className={`bi ${platformIcon}`} style={{ fontSize: '1.35rem' }} />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()
              ) : (
                <div className="d-flex flex-wrap gap-3 justify-content-center">
                  <a
                    href="https://www.linkedin.com/company/sembuzzsdmlhq/posts/?feedView=all"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="d-flex align-items-center justify-content-center rounded-3 text-decoration-none"
                    style={{ width: 72, height: 72, color: '#0a66c2', backgroundColor: 'transparent', transition: 'transform 0.2s ease' }}
                    aria-label="LinkedIn"
                  >
                    <i className="bi bi-linkedin" style={{ fontSize: '2rem' }} />
                  </a>
                  <a
                    href="https://www.facebook.com/people/Sembuzzofficial/61555782134710/?ref=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="d-flex align-items-center justify-content-center rounded-3 text-decoration-none"
                    style={{ width: 72, height: 72, color: '#1877f2', backgroundColor: 'transparent', transition: 'transform 0.2s ease' }}
                    aria-label="Facebook"
                  >
                    <i className="bi bi-facebook" style={{ fontSize: '2rem' }} />
                  </a>
                  <a
                    href="https://www.instagram.com/sembuzzofficial?igsh=MWRxaHRldjZ1N3Z2cg=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="d-flex align-items-center justify-content-center rounded-3 text-decoration-none"
                    style={{ width: 72, height: 72, color: '#e4405f', backgroundColor: 'transparent', transition: 'transform 0.2s ease' }}
                    aria-label="Instagram"
                  >
                    <i className="bi bi-instagram" style={{ fontSize: '2rem' }} />
                  </a>
                </div>
              )}
            </div>
            <p className="mt-3 small text-muted mb-0 text-center">
              {user && schoolSocialAccounts.length > 0 ? 'Your school\'s social accounts.' : 'Connect with us on social media.'}
            </p>
            <style>{`
              @keyframes sembuzz-reveal {
                from { opacity: 0; transform: translateX(-6px); }
                to { opacity: 1; transform: translateX(0); }
              }
            `}</style>
          </div>
        ) : (
          <div>
            <Fragment>
        <div style={{ maxWidth: '600px', margin: '0 auto', marginBottom: '1rem' }}>
          <style>{`
            .content-categories-scroll::-webkit-scrollbar { height: 4px; }
            .content-categories-scroll::-webkit-scrollbar-track { background: transparent; }
            .content-categories-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
            .content-categories-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.2) transparent; }
            .feed-tab-slide { animation: feedTabSlide 0.3s ease-out; }
            @keyframes feedTabSlide { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
            .home-feed-tabs { display: flex; background: #000; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .home-feed-tabs .home-feed-tab { flex: 1; border: none; background: none; padding: 0.75rem 1rem; font-size: 0.95rem; font-weight: 600; color: #8e8e8e; cursor: pointer; position: relative; transition: color 0.2s ease; }
            .home-feed-tabs .home-feed-tab:hover { color: #b0b0b0; }
            .home-feed-tabs .home-feed-tab.active { color: #fff; }
            .home-feed-tabs .home-feed-tab.active::after { content: ''; position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); width: 70%; height: 3px; background: #fff; border-radius: 3px 3px 0 0; }
          `}</style>
          {user && bottomNavActive === 'home' && (
            <div className="home-feed-tabs" style={{ marginBottom: '0.5rem', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
              <button
                type="button"
                className={`home-feed-tab ${!showAllSchoolsFeed ? 'active' : ''}`}
                onClick={() => { setShowAllSchoolsFeed(false); setUpcomingDateFilter(null); setSelectedUpcomingPost(null); }}
                aria-pressed={!showAllSchoolsFeed}
              >
                My school
              </button>
              <button
                type="button"
                className={`home-feed-tab ${showAllSchoolsFeed ? 'active' : ''}`}
                onClick={() => { setShowAllSchoolsFeed(true); setUpcomingDateFilter(null); setSelectedUpcomingPost(null); }}
                aria-pressed={showAllSchoolsFeed}
              >
                All schools
              </button>
            </div>
          )}
          <div className="d-flex justify-content-between align-items-center gap-2">
            <div
              ref={contentCategoriesRef}
              className="d-flex align-items-center gap-2 py-1 content-categories-scroll"
              style={{
                minWidth: 0,
                flex: 1,
                justifyContent: 'flex-start',
                overflowX: 'auto',
                overflowY: 'hidden',
                flexWrap: 'nowrap',
                WebkitOverflowScrolling: 'touch',
                marginRight: '0.5rem',
              }}
            >
              {user && !showAllSchoolsFeed && homeContentCategories.length > 0 && (
                <>
                  {selectedSubCategoryIds.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-muted p-0 text-nowrap"
                      style={{ fontSize: '0.8rem', textDecoration: 'none', flexShrink: 0 }}
                      onClick={clearContentCategoryFilter}
                    >
                      All
                    </button>
                  )}
                  {homeContentCategories.map((cat: CategoryPublic) => {
                    const hasSelection = selectedSubCategoryIds.some((id: string) =>
                      cat.subcategories.some((s: { id: string }) => s.id === id),
                    );
                    return (
                      <button
                        key={cat.id}
                        ref={contentExpandedCategoryId === cat.id ? categoryButtonRefForContent : null}
                        type="button"
                        className="btn btn-sm btn-rounded-pill rounded-pill flex-shrink-0 btn-outline-dark text-nowrap"
                        style={{
                          
                          fontWeight: hasSelection ? 600 : 400,
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.875rem',
                        }}
                        onClick={() => {
                          const next = contentExpandedCategoryId === cat.id ? null : cat.id;
                          setContentExpandedCategoryId(next);
                          if (next) eventsFilter?.setSelectedCategory(cat.id, cat.name);
                        }}
                        title={cat.name}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
            <div className="d-flex align-items-center gap-2 small flex-shrink-0 position-relative">
              <button
                type="button"
                className="btn border-0 py-1 px-2 rounded d-flex align-items-center"
                style={{
                  backgroundColor: filterDropdownOpen || upcomingDateFilter || feedSort !== 'latest'
                    ? 'rgba(13, 202, 240, 0.15)'
                    : 'transparent',
                  color: filterDropdownOpen || upcomingDateFilter ? '#087990' : '#6c757d',
                }}
                onClick={() => setFilterDropdownOpen((o) => !o)}
                title="Filter: Calendar, Latest, Popular"
                aria-label="Filter"
                aria-expanded={filterDropdownOpen}
              >
                <i className="bi bi-funnel" style={{ fontSize: '1.1rem' }} />
              </button>
              {filterDropdownOpen && (
                <>
                  <div
                    ref={calendarDropdownRef}
                    className="shadow-sm border bg-white rounded py-2"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 4,
                      minWidth: 260,
                      zIndex: 1050,
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between px-3 py-1 small fw-600 text-secondary border-bottom mb-1">
                      <span>Filter</span>
                      <button
                        type="button"
                        className="btn btn-link p-0 border-0 text-secondary"
                        style={{ minWidth: 28, minHeight: 28, lineHeight: 1 }}
                        onClick={() => setFilterDropdownOpen(false)}
                        aria-label="Close filter"
                        title="Close"
                      >
                        <i className="bi bi-x-lg" style={{ fontSize: '1rem' }} />
                      </button>
                    </div>
                    {/* Calendar */}
                    <div className="px-3 py-1 small text-muted">Calendar</div>
                    {user && !showAllSchoolsFeed ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-link text-dark btn-sm text-start w-100 d-block text-decoration-none"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 1);
                            setCalendarPendingDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                          }}
                        >
                          Tomorrow
                        </button>
                        <button
                          type="button"
                          className="btn btn-link text-dark btn-sm text-start w-100 d-block text-decoration-none"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 2);
                            setCalendarPendingDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                          }}
                        >
                          Day after tomorrow
                        </button>
                        <div className="px-3 pt-1 pb-2">
                          <label className="small text-muted d-block mb-1">Custom date</label>
                          <input
                            type="date"
                            className="form-control form-control-sm mb-2"
                            value={calendarPendingDate ?? ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCalendarPendingDate(v || null);
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-dark btn-sm rounded-pill w-100"
                            disabled={!calendarPendingDate}
                            onClick={() => {
                              if (calendarPendingDate) {
                                setUpcomingDateFilter(calendarPendingDate);
                                setSelectedUpcomingPost(null);
                              }
                            }}
                          >
                            OK — View filtered news
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="px-3 pb-2 small text-muted">Login to see upcoming by date</div>
                    )}
                    <hr className="my-2" />
                    {/* Latest / Popular */}
                    <div className="px-3 py-1 small text-muted">Sort</div>
                    <button
                      type="button"
                      className={`btn btn-link btn-sm text-start w-100 d-block text-decoration-none py-1 ${feedSort === 'latest' ? 'fw-600 text-dark' : 'text-secondary'}`}
                      onClick={() => setFeedSort('latest')}
                    >
                      {feedSort === 'latest' && <i className="bi bi-check2 me-2" />}
                      Latest
                    </button>
                    <button
                      type="button"
                      className={`btn btn-link btn-sm text-start w-100 d-block text-decoration-none py-1 ${feedSort === 'popular' ? 'fw-600 text-dark' : 'text-secondary'}`}
                      onClick={() => setFeedSort('popular')}
                    >
                      {feedSort === 'popular' && <i className="bi bi-check2 me-2" />}
                      Popular
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

        {/* Category subcategory dropdown — right above the news, portal */}
        {contentExpandedCategoryId &&
          categoryDropdownPosition &&
          (() => {
            const cat = homeCategories.find((c: CategoryPublic) => c.id === contentExpandedCategoryId);
            if (!cat) return null;
            return createPortal(
              <div
                ref={categoryDropdownRefForContent}
                className="dropdown-menu show shadow-sm border py-1 bg-white"
                style={{
                  position: 'fixed',
                  top: categoryDropdownPosition.top,
                  left: categoryDropdownPosition.left,
                  borderRadius: '8px',
                  minWidth: '200px',
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  zIndex: 1050,
                }}
              >
                {cat.subcategories.length === 0 ? (
                  <div className="dropdown-item-text small text-muted">No subcategories</div>
                ) : (
                  <>
                    <div className="dropdown-item-text small fw-600 text-secondary border-bottom">
                      {cat.name}
                    </div>
                    {cat.subcategories.map((sub: { id: string; name: string }) => (
                      <label
                        key={sub.id}
                        className="dropdown-item small d-flex align-items-center gap-2 mb-0"
                        style={{ cursor: 'pointer', minHeight: 'unset' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubCategoryIds.includes(sub.id)}
                          onChange={() => toggleSubCategoryForContent(sub.id, sub.name)}
                        />
                        {sub.name}
                      </label>
                    ))}
                  </>
                )}
              </div>,
              document.body,
            );
          })()}

        {/* Loading popup: 3 sec when school has approved news, then close filter and show news */}
        {showSchoolLoadingPopup && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Fetching school news"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1060,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '2rem',
                minWidth: '220px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }} />
              <p className="mb-0" style={{ fontWeight: 500, color: '#1a1f2e' }}>Fetching news of the school…</p>
            </div>
          </div>
        )}

        {/* No-news popup: school has 0 approved posts */}
        {showNoNewsPopup && schoolId && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="School news"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1060,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
            onClick={() => setShowNoNewsPopup(false)}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '1.5rem',
                maxWidth: '380px',
                width: '90%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1a1f2e', marginBottom: '1rem' }}>
                News from this school
              </h3>
              <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                News of this school will be coming soon.
              </p>
              <p className="small text-muted mb-2 mt-2" style={{ maxWidth: '100%' }}>
                Approved news from this school will appear here once category admins approve posts.
              </p>
              {!user && (
                <p className="small text-muted mb-3">
                  Sign in or register with your school to like, comment, and save.
                </p>
              )}
              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ borderRadius: '8px' }}
                  onClick={() => setShowNoNewsPopup(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success modal when user returns from Google OAuth after adding event */}
        {googleCalReturnSuccess && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Event added"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1070,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
            onClick={() => setGoogleCalReturnSuccess(false)}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '1.5rem',
                maxWidth: '380px',
                width: '90%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-0 fw-medium" style={{ color: '#1a1f2e', fontSize: '1rem' }}>
                The event has been added to your Google Calendar successfully.
              </p>
              <div className="d-flex justify-content-end mt-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ borderRadius: '8px' }}
                  onClick={() => setGoogleCalReturnSuccess(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error modal when Google OAuth or add-event fails */}
        {googleCalReturnError && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Error"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1070,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
            onClick={() => setGoogleCalReturnError(null)}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '1.5rem',
                maxWidth: '380px',
                width: '90%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-0 fw-medium text-danger" style={{ fontSize: '1rem' }}>
                Could not add event to Google Calendar
              </p>
              <p className="small text-muted mt-2 mb-3">{googleCalReturnError}</p>
              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ borderRadius: '8px' }}
                  onClick={() => setGoogleCalReturnError(null)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Spotlight-style search bar (shown when filter mode is search) */}
        {filterMode === 'search' && (
          <div
            className="mb-4"
            style={{
              maxWidth: '560px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 1rem',
                borderRadius: '12px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e9ecef',
              }}
            >
              <i className="bi bi-search text-muted" style={{ fontSize: '1.25rem' }} />
              <input
                type="text"
                className="form-control border-0 p-0"
                placeholder="Search news… (e.g. title, description, category)"
                value={eventsFilter?.searchQuery ?? ''}
                onChange={(e) => eventsFilter?.setSearchQuery(e.target.value)}
                autoFocus
                style={{ fontSize: '1rem', boxShadow: 'none' }}
              />
              <button
                type="button"
                className="btn btn-link p-0 text-muted text-decoration-none"
                onClick={() => { setFilterMode('none'); eventsFilter?.setSearchQuery(''); }}
                aria-label="Close search"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <p className="small text-muted mt-1 mb-0">Search across all schools. Use ⌘+K to focus search (coming soon).</p>
          </div>
        )}

        {/* School filter cards (shown when filter mode is school) */}
        {filterMode === 'school' && (
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span style={{ fontWeight: 600, color: '#1a1f2e' }}>Select a school</span>
              <div className="d-flex gap-2">
                {schoolId && (
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-decoration-none"
                    onClick={() => { clearSchoolFilter(); setFilterMode('none'); }}
                  >
                    Show all events
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none"
                  onClick={() => setFilterMode('none')}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="row justify-content-center g-3">
              {schoolsLoading ? (
                <div className="col-12 text-center py-4">
                  <div className="spinner-border text-secondary" role="status" />
                  <p className="mt-2 mb-0 small text-muted">Loading schools…</p>
                </div>
              ) : schoolsForFilter.length === 0 ? (
                <div className="col-12 text-center py-4 text-muted small">No schools found.</div>
              ) : (
              schoolsForFilter.map((s) => {
                const logoUrl = s.image ? imageSrc(s.image) : '';
                const isSelected = schoolId === s.id;
                return (
                  <div key={s.id} className="col-md-3 col-sm-6">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => selectSchool(s.id)}
                      onKeyDown={(e) => e.key === 'Enter' && selectSchool(s.id)}
                      style={{
                        border: '1px solid rgb(26, 31, 46)',
                        borderRadius: '4px',
                        padding: '1.5rem',
                        backgroundColor: isSelected ? 'rgb(26 31 46 / 5%)' : 'white',
                        cursor: 'pointer',
                        transition: '0.3s',
                        textAlign: 'center',
                        minHeight: '100px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1a1f2e',
                      }}
                    >
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt=""
                          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', marginBottom: '0.5rem' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'rgb(26 31 46 / 8%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <i className="bi bi-building" style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
                        </div>
                      )}
                      <span style={{ fontWeight: '500', fontSize: '1rem' }}>{s.name}</span>
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </div>
        )}

        </div>

        {filterMode !== 'school' && (
          <div
            key={user && bottomNavActive === 'home' ? `feed-${showAllSchoolsFeed ? 'all' : 'my'}` : 'feed-single'}
            className={user && bottomNavActive === 'home' ? 'feed-tab-slide' : ''}
            style={{ minHeight: 0 }}
          >
        {selectedSettingsEvent ? (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <button
              type="button"
              className="btn btn-link btn-sm text-decoration-none mb-2 p-0"
              onClick={() => setSelectedSettingsEvent(null)}
            >
              ← Back to all news
            </button>
            <EventPostCard
              event={selectedSettingsEvent}
              likeCount={engagement?.likes?.[selectedSettingsEvent.id] ?? 0}
              commentCount={engagement?.commentCounts?.[selectedSettingsEvent.id] ?? 0}
              isLiked={engagement?.likedByMe?.includes(selectedSettingsEvent.id) ?? false}
              isSaved={engagement?.savedByMe?.includes(selectedSettingsEvent.id) ?? false}
              currentUserId={user?.id}
              onLike={() => likeMutation.mutate(selectedSettingsEvent.id)}
              onSave={() => saveMutation.mutate(selectedSettingsEvent.id)}
              onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ['public', 'events', 'engagement'] })}
            />
          </div>
        ) : isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-secondary" role="status" />
            <p className="mt-2 mb-0" style={{ color: '#6c757d' }}>Loading…</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ borderRadius: '8px' }}>
            <span>Failed to load events. Check that the API is reachable and CORS allows this site.</span>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['public', 'events', 'approved'] });
              }}
            >
              Retry
            </button>
          </div>
        ) : feedItems.length === 0 ? (
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-body text-center py-5 px-4">
              <i className="bi bi-newspaper" style={{ fontSize: '3rem', color: '#6c757d', marginBottom: '1rem' }} />
              <p className="text-muted mb-0">
                {eventsFilter?.searchQuery?.trim()
                  ? 'No news matches your search.'
                  : schoolId
                    ? 'No approved news for this school yet.'
                    : 'No approved news yet.'}
              </p>
              {!eventsFilter?.searchQuery?.trim() && !schoolId && (
                <p className="small text-muted mt-2 mb-0" style={{ maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                  <strong>Approved</strong> news from schools appears here after category admin approval. Use <strong>Blogs</strong> in the nav for blog posts.
                </p>
              )}
              {!eventsFilter?.searchQuery?.trim() && schoolId && (
                <button
                  type="button"
                  className="btn btn-link btn-sm text-decoration-none mt-2"
                  onClick={() => setShowNoNewsPopup(true)}
                >
                  View message
                </button>
              )}
              {!eventsFilter?.searchQuery?.trim() && !schoolId && !user && (
                <p className="small text-muted mt-2 mb-0">
                  Sign in or register with your school to like, comment, and save.
                </p>
              )}
            </div>
          </div>
        ) : selectedUpcomingPost ? (
          <UpcomingPostDetailCard
            post={selectedUpcomingPost}
            onClose={() => { setSelectedUpcomingPost(null); setUpcomingDateFilter(null); window.location.reload(); }}
          />
        ) : upcomingDateFilter ? (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="small text-muted">Upcoming for {new Date(upcomingDateFilter + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setUpcomingDateFilter(null); setSelectedUpcomingPost(null); window.location.reload(); }}>Show regular feed</button>
            </div>
            {upcomingPostsByDate.length === 0 ? (
              <p className="text-muted text-center py-4">No upcoming news for this date.</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {upcomingPostsByDate.map((post: UpcomingPostPublic) => (
                  <div key={post.id} className="shadow-sm rounded-3 p-0 d-flex align-items-stretch" style={{ backgroundColor: '#fff', overflow: 'visible' }}>
                    <button
                      type="button"
                      className="border-0 text-start p-3 bg-transparent flex-grow-1"
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        minWidth: 0,
                      }}
                      onClick={() => setSelectedUpcomingPost(post)}
                    >
                      {post.school?.image ? (
                        <img src={imageSrc(post.school.image)} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(63deg, rgb(39 158 247 / 35%), rgb(87 177 245 / 36%))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1a1f2e', fontSize: '1rem', flexShrink: 0 }}>
                          {post.school?.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                      )}
                      <span style={{ flex: '1 1 0', minWidth: 0, fontWeight: 600, color: '#1a1f2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }} title={post.title}>{post.title}</span>
                      <span className="small text-muted" style={{ flexShrink: 0, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={post.school?.name ?? 'School'}>{post.school?.name ?? 'School'}</span>
                      <i className="bi bi-chevron-right text-muted" style={{ flexShrink: 0 }} />
                    </button>
                    <div className="d-flex align-items-center pe-2" style={{ position: 'relative' }}>
                      <button
                        ref={googleCalDropdownPostId === post.id ? googleCalAnchorRef : undefined}
                        type="button"
                        className="btn btn-link p-1 text-secondary border-0"
                        style={{ minWidth: 36, minHeight: 36 }}
                        aria-label="Add to Google Calendar"
                        aria-expanded={googleCalDropdownPostId === post.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setGoogleCalDropdownPostId(googleCalDropdownPostId === post.id ? null : post.id);
                        }}
                      >
                        <i className="bi bi-calendar-plus" style={{ fontSize: '1.25rem' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {googleCalDropdownPostId && googleCalDropdownPosition && (() => {
              const post = upcomingPostsByDate.find((p: UpcomingPostPublic) => p.id === googleCalDropdownPostId);
              if (!post) return null;
              const { top, left } = googleCalDropdownPosition;
              return createPortal(
                <div
                  className="dropdown-menu show shadow-sm border py-1 bg-white"
                  style={{
                    position: 'fixed',
                    left,
                    top,
                    minWidth: '200px',
                    borderRadius: '8px',
                    zIndex: 1060,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="dropdown-item small"
                    onClick={(e) => {
                      e.stopPropagation();
                      const returnUrl = `${window.location.origin}/events`;
                      const url = buildGoogleCalendarAddAuthUrl(post, returnUrl);
                      window.open(url, '_blank', 'noopener,noreferrer');
                      setGoogleCalDropdownPostId(null);
                      setGoogleCalDropdownPosition(null);
                    }}
                  >
                    Add to Google Calendar
                  </button>
                </div>,
                document.body,
              );
            })()}
          </div>
        ) : (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {feedItems.map((item) =>
              item.type === 'event' ? (
                <EventPostCard
                  key={item.event.id}
                  event={item.event}
                  likeCount={user ? (engagement?.likes?.[item.event.id] ?? 0) : (publicEngagementCounts?.likes?.[item.event.id] ?? 0)}
                  commentCount={user ? (engagement?.commentCounts?.[item.event.id] ?? 0) : (publicEngagementCounts?.commentCounts?.[item.event.id] ?? 0)}
                  isLiked={!!user && (engagement?.likedByMe?.includes(item.event.id) ?? false)}
                  isSaved={!!user && (engagement?.savedByMe?.includes(item.event.id) ?? false)}
                  currentUserId={user?.id}
                  onLike={() => likeMutation.mutate(item.event.id)}
                  onSave={() => saveMutation.mutate(item.event.id)}
                  onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ['public', 'events', 'engagement'] })}
                />
              ) : (
                <SponsoredAdCard key={`sponsored-${item.ad.id}`} ad={item.ad} />
              ),
            )}
            {displayBannerAd && (
              <div className="mt-3 mb-3 rounded-2 overflow-hidden border shadow-sm" style={{ backgroundColor: '#fff' }}>
                <button
                  type="button"
                  className="border-0 p-0 w-100 bg-transparent d-block text-start"
                  onClick={handleBannerAdClick}
                  aria-label={displayBannerAd.externalLink ? 'Open ad link' : 'Ad'}
                >
                  <img src={imageSrc(displayBannerAd.imageUrl)} alt="Ad" style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} />
                </button>
              </div>
            )}
          </div>
        )}
          </div>
        )}
          </Fragment>
          </div>
        )}
      </div>

      {/* Bottom fixed menu: above login/signup overlays so users can navigate during auth flows */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: showSettingsLoginPopup || showSignupPopup || showFirstLoginCategories || showChangeCategoryModal || showHelpModal || showDeleteAccountModal ? 1070 : 1030,
          display: 'flex',
          justifyContent: 'center',
          paddingLeft: '1rem',
          paddingRight: '1rem',
        }}
      >
        <div
          className="bottom-nav-bar bottom-nav-white"
          style={{
            width: '100%',
            maxWidth: '600px',
          }}
        >
          <div className="d-flex justify-content-between align-items-center py-2 px-2">
            <button
              type="button"
              className={`bottom-nav-btn ${bottomNavActive === 'search' ? 'active' : ''}`}
              aria-label="Search"
              onClick={() => setBottomNavActive('search')}
            >
              <i className="bi bi-search" style={{ fontSize: '1.35rem' }} />
              {bottomNavActive === 'search' && <span className="bottom-nav-label">Search</span>}
            </button>
            <button
              type="button"
              className={`bottom-nav-btn ${bottomNavActive === 'home' ? 'active' : ''}`}
              aria-label="Home"
              onClick={() => { setSelectedSettingsEvent(null); setBottomNavActive('home'); }}
            >
              <i className="bi bi-house-door" style={{ fontSize: '1.35rem' }} />
              {bottomNavActive === 'home' && <span className="bottom-nav-label">Home</span>}
            </button>
            <button
              type="button"
              className={`bottom-nav-btn ${bottomNavActive === 'settings' ? 'active' : ''}`}
              aria-label="Settings"
              onClick={() => setBottomNavActive('settings')}
            >
              <i className="bi bi-gear" style={{ fontSize: '1.35rem' }} />
              {bottomNavActive === 'settings' && <span className="bottom-nav-label">Settings</span>}
            </button>
            <button
              type="button"
              className={`bottom-nav-btn ${bottomNavActive === 'apps' ? 'active' : ''}`}
              aria-label="Apps"
              onClick={() => setBottomNavActive('apps')}
            >
              <i className="bi bi-grid-3x3-gap" style={{ fontSize: '1.35rem' }} />
              {bottomNavActive === 'apps' && <span className="bottom-nav-label">Apps</span>}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .bottom-nav-bar.bottom-nav-white {
          background: #fff;
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          box-shadow: 0 -2px 16px rgba(0,0,0,0.08);
        }
        .bottom-nav-bar.bottom-nav-white .bottom-nav-btn {
          background: none;
          border: none;
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          color: #1a1f2e;
          transition: color 0.2s ease, background 0.3s ease, box-shadow 0.3s ease, opacity 0.2s ease;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .bottom-nav-bar.bottom-nav-white .bottom-nav-btn:hover {
          color: #d5d1c3;
        }
        .bottom-nav-bar.bottom-nav-white .bottom-nav-btn.active {
          background: #f0f0f0;
          color: #1a1f2e;
          box-shadow: 0 1px 6px rgba(0,0,0,0.08);
        }
        .bottom-nav-bar.bottom-nav-white .bottom-nav-btn.active:hover {
          color: #1a1f2e;
        }
        .bottom-nav-bar.bottom-nav-white .bottom-nav-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1a1f2e;
          animation: bottom-nav-label-in 0.25s ease;
        }
        @keyframes bottom-nav-label-in {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
