import { useMemo, useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApprovedEventPublic, SponsoredAdPublic, BannerAdPublic } from '../services/public-events.service';
import type { PublicFeedItem } from '../utils/publicFeed';
import { imageSrc } from '../utils/image';
import { userEventsService, type EventCommentResponse } from '../services/user-events.service';

function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function parseImages(json: string | null): string[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(' ')}...`;
}

/** Multi-image hero: prev/next, dots, horizontal swipe — does not remove vertical feed scroll. */
function InshortsHeroCarousel({ urls, emptyLabel }: { urls: string[]; emptyLabel: string }) {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const n = urls.length;

  useEffect(() => {
    setIdx(0);
  }, [urls.join('|')]);

  if (n === 0) {
    return (
      <div className="inshorts-hero inshorts-hero--empty">
        <span>{emptyLabel}</span>
      </div>
    );
  }

  if (n === 1) {
    return (
      <div className="inshorts-hero">
        <img src={imageSrc(urls[0])} alt="" className="inshorts-hero-img" />
      </div>
    );
  }

  const go = (delta: number) => {
    setIdx((i) => (i + delta + n) % n);
  };

  return (
    <div
      className="inshorts-hero inshorts-hero--multi"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        const end = e.changedTouches[0]?.clientX ?? null;
        touchStartX.current = null;
        if (start == null || end == null) return;
        const dx = end - start;
        if (Math.abs(dx) < 45) return;
        if (dx < 0) go(1);
        else go(-1);
      }}
    >
      <div className="inshorts-hero-carousel-viewport">
        <div
          className="inshorts-hero-carousel-track"
          style={{
            width: `${n * 100}%`,
            transform: `translateX(-${(idx / n) * 100}%)`,
          }}
        >
          {urls.map((u, i) => (
            <img
              key={i}
              src={imageSrc(u)}
              alt=""
              className="inshorts-hero-img inshorts-hero-img--carousel"
              style={{ width: `${100 / n}%` }}
            />
          ))}
        </div>
        <button
          type="button"
          className="inshorts-hero-carousel-nav inshorts-hero-carousel-nav--prev"
          aria-label="Previous image"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
        >
          <i className="bi bi-chevron-left" aria-hidden />
        </button>
        <button
          type="button"
          className="inshorts-hero-carousel-nav inshorts-hero-carousel-nav--next"
          aria-label="Next image"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
        >
          <i className="bi bi-chevron-right" aria-hidden />
        </button>
        <div className="inshorts-hero-carousel-dots" aria-hidden>
          {urls.map((_, i) => (
            <span
              key={i}
              className={`inshorts-hero-carousel-dot ${i === idx ? 'inshorts-hero-carousel-dot--active' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EventSlideWithEngagement({
  slideIndex,
  event,
  banner,
  onBannerClick,
  likeCount,
  commentCount,
  isLiked,
  isSaved,
  currentUserId,
  onLike,
  onSave,
  onCommentAdded,
}: {
  slideIndex: number;
  event: ApprovedEventPublic;
  banner?: BannerAdPublic;
  onBannerClick: (b: BannerAdPublic) => void;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  currentUserId: string | undefined;
  onLike: () => void;
  onSave: () => void;
  onCommentAdded: () => void;
}) {
  const queryClient = useQueryClient();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const imgs = parseImages(event.imageUrls);

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

  useEffect(() => {
    if (!commentsOpen) setCommentText('');
  }, [commentsOpen]);

  return (
    <article className="inshorts-slide" data-slide-index={slideIndex}>
      <div className="inshorts-card inshorts-card--event">
        <div className="inshorts-hero-wrap">
          <InshortsHeroCarousel urls={imgs} emptyLabel="SemBuzz" />
          <div
            className="inshorts-engage-pill"
            role="toolbar"
            aria-label="Engagement"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={`inshorts-engage-pill-btn ${isLiked ? 'inshorts-engage-pill-btn--liked' : ''}`}
              title={!currentUserId ? 'Sign in to like' : undefined}
              onClick={currentUserId ? onLike : undefined}
              disabled={!currentUserId}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              <i className={isLiked ? 'bi bi-heart-fill' : 'bi bi-heart'} aria-hidden />
            </button>
            <span className="inshorts-engage-pill-count">{likeCount}</span>
            <button
              type="button"
              className={`inshorts-engage-pill-btn ${isSaved ? 'inshorts-engage-pill-btn--saved' : ''}`}
              title={!currentUserId ? 'Sign in to save' : undefined}
              onClick={currentUserId ? onSave : undefined}
              disabled={!currentUserId}
              aria-label={isSaved ? 'Unsave' : 'Save'}
            >
              <i className={isSaved ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'} aria-hidden />
            </button>
            {event.commentsEnabled ? (
              <>
                <button
                  type="button"
                  className="inshorts-engage-pill-btn"
                  title={!currentUserId ? 'Sign in to comment' : undefined}
                  onClick={currentUserId ? () => setCommentsOpen((o) => !o) : undefined}
                  disabled={!currentUserId}
                  aria-label="Comments"
                >
                  <i className="bi bi-chat" aria-hidden />
                </button>
                <span className="inshorts-engage-pill-count">{commentCount}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="inshorts-meta">
          {event.school?.image ? (
            <img src={imageSrc(event.school.image)} alt="" className="inshorts-mini-logo" />
          ) : (
            <div className="inshorts-mini-logo-ph">{event.school?.name?.charAt(0) ?? '?'}</div>
          )}
          <span className="inshorts-source">{event.school?.name ?? 'School'}</span>
        </div>
        <div className="inshorts-body inshorts-body--grow">
          <div className="inshorts-title-row">
            <h2 className="inshorts-title">{event.title}</h2>
            {event.externalLink ? (
              <a
                href={event.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-dark btn-sm rounded-pill inshorts-inline-link"
              >
                Know more
              </a>
            ) : null}
          </div>
          {event.description ? <p className="inshorts-summary">{truncateWords(event.description, 25)}</p> : null}
          <p className="inshorts-time">{formatRelativeTime(event.updatedAt || event.createdAt)}</p>
          {banner ? (
            <button
              type="button"
              className="inshorts-inline-banner-block"
              onClick={() => onBannerClick(banner)}
              aria-label="Open banner ad"
            >
              <span className="inshorts-inline-banner-tag">Ad Banner</span>
              <img src={imageSrc(banner.imageUrl)} alt="" className="inshorts-inline-banner-img" />
            </button>
          ) : null}
        </div>

        {event.commentsEnabled && commentsOpen && (
          <div className="inshorts-comments-panel">
            {commentsLoading ? (
              <div className="inshorts-comments-loading">Loading comments…</div>
            ) : (
              <div className="inshorts-comments-list">
                {comments.map((c: EventCommentResponse) => (
                  <div key={c.id} className="inshorts-comment-row">
                    <span className="inshorts-comment-author">{c.user.name}</span>
                    <span className="inshorts-comment-text">{c.text}</span>
                    {currentUserId === c.user.id && (
                      <button
                        type="button"
                        className="inshorts-comment-del"
                        onClick={() => setCommentToDelete(c.id)}
                        disabled={deleteCommentMutation.isPending}
                        aria-label="Delete comment"
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

        {event.commentsEnabled && commentsOpen && currentUserId && (
          <div className="inshorts-comment-input-row">
            <input
              type="text"
              className="inshorts-comment-input"
              placeholder="Add a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (commentText.trim()) addCommentMutation.mutate(commentText.trim());
                }
              }}
            />
            <button
              type="button"
              className="inshorts-comment-post"
              disabled={!commentText.trim() || addCommentMutation.isPending}
              onClick={() => {
                if (commentText.trim()) addCommentMutation.mutate(commentText.trim());
              }}
            >
              Post
            </button>
          </div>
        )}

      </div>

      {commentToDelete && (
        <div className="inshorts-modal-overlay" role="dialog" aria-modal="true">
          <div className="inshorts-modal-box">
            <p className="mb-3">Delete this comment?</p>
            <div className="d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setCommentToDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={deleteCommentMutation.isPending}
                onClick={() => commentToDelete && deleteCommentMutation.mutate(commentToDelete)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function SponsoredSlide({
  slideIndex,
  ad,
  onAdClick,
}: {
  slideIndex: number;
  ad: SponsoredAdPublic;
  onAdClick: (ad: SponsoredAdPublic) => void;
}) {
  const imgs = parseImages(ad.imageUrls);
  const name = ad.school?.name ?? 'School';
  return (
    <article className="inshorts-slide" data-slide-index={slideIndex}>
      <div className="inshorts-card inshorts-card--ad">
        <div className="inshorts-ad-row">
          <span className="inshorts-ad-badge">Ad</span>
          <span className="inshorts-ad-label">Sponsored</span>
        </div>
        <div
          className="inshorts-hero-sponsored-wrap"
          role="button"
          tabIndex={0}
          onClick={() => onAdClick(ad)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onAdClick(ad);
            }
          }}
        >
          <InshortsHeroCarousel urls={imgs} emptyLabel="Ad" />
        </div>
        <div className="inshorts-meta">
          {ad.school?.image ? (
            <img src={imageSrc(ad.school.image)} alt="" className="inshorts-mini-logo" />
          ) : (
            <div className="inshorts-mini-logo-ph">{name.charAt(0)}</div>
          )}
          <span className="inshorts-source">{name}</span>
        </div>
        <button type="button" className="inshorts-body inshorts-body--btn" onClick={() => onAdClick(ad)}>
          {ad.title?.trim() ? <h2 className="inshorts-title">{ad.title}</h2> : null}
          {ad.description?.trim() ? <p className="inshorts-summary">{truncateWords(ad.description, 25)}</p> : null}
          <p className="inshorts-time">{formatRelativeTime(ad.createdAt || ad.startAt)}</p>
        </button>
      </div>
    </article>
  );
}

export type InshortsHomeFeedProps = {
  feedItems: PublicFeedItem[];
  onFeedSwipeDirection?: (direction: 'up' | 'down') => void;
  userId: string | undefined;
  likeCount: (eventId: string) => number;
  commentCount: (eventId: string) => number;
  isLiked: (eventId: string) => boolean;
  isSaved: (eventId: string) => boolean;
  onLike: (eventId: string) => void;
  onSave: (eventId: string) => void;
  onCommentAdded: () => void;
  onSponsoredClick: (ad: SponsoredAdPublic) => void;
  onBannerClick: (b: BannerAdPublic) => void;
};

export function InshortsHomeFeed({
  feedItems,
  onFeedSwipeDirection,
  userId,
  likeCount,
  commentCount,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onCommentAdded,
  onSponsoredClick,
  onBannerClick,
}: InshortsHomeFeedProps) {
  const slides = useMemo(() => feedItems.filter((item) => item.type !== 'banner'), [feedItems]);
  const lastScrollTopRef = useRef(0);
  const bannerBySlideIndex = useMemo(() => {
    const bySlide = new Map<number, BannerAdPublic>();
    let nonBannerIdx = -1;
    for (const item of feedItems) {
      if (item.type === 'banner') {
        const target = nonBannerIdx >= 0 ? nonBannerIdx : 0;
        if (!bySlide.has(target)) bySlide.set(target, item.banner);
      } else {
        nonBannerIdx += 1;
      }
    }
    return bySlide;
  }, [feedItems]);

  return (
    <div
      className="inshorts-feed-host"
      onScroll={(e) => {
        const nextTop = e.currentTarget.scrollTop;
        const delta = nextTop - lastScrollTopRef.current;
        if (Math.abs(delta) >= 4 && onFeedSwipeDirection) {
          onFeedSwipeDirection(delta > 0 ? 'up' : 'down');
        }
        lastScrollTopRef.current = nextTop;
      }}
    >
      {slides.map((item, i) =>
        item.type === 'event' ? (
          <EventSlideWithEngagement
            key={item.event.id}
            slideIndex={i}
            event={item.event}
            banner={bannerBySlideIndex.get(i)}
            onBannerClick={onBannerClick}
            likeCount={likeCount(item.event.id)}
            commentCount={commentCount(item.event.id)}
            isLiked={isLiked(item.event.id)}
            isSaved={isSaved(item.event.id)}
            currentUserId={userId}
            onLike={() => onLike(item.event.id)}
            onSave={() => onSave(item.event.id)}
            onCommentAdded={onCommentAdded}
          />
        ) : item.type === 'sponsored' ? (
          <SponsoredSlide key={`s-${i}-${item.ad.id}`} slideIndex={i} ad={item.ad} onAdClick={onSponsoredClick} />
        ) : null,
      )}
    </div>
  );
}
