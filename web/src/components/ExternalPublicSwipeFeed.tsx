import { useEffect, useRef } from 'react';
import type { ExternalPostRequestRow } from '../services/external-admin-post-requests.service';
import { externalPostContentTypeLabel } from '../utils/externalOfferPostView';
import { ExternalPublicPostCard } from './ExternalPublicPostCard';

type Props = {
  posts: ExternalPostRequestRow[];
  reserveTopSpace?: boolean;
  onScroll?: (scrollTop: number, delta: number) => void;
  onFeedSwipeDirection?: (direction: 'up' | 'down') => void;
  savedByMe?: string[];
  onToggleSave?: (postId: string) => void;
};

export function ExternalPublicSwipeFeed({
  posts,
  reserveTopSpace = false,
  onScroll,
  onFeedSwipeDirection,
  savedByMe = [],
  onToggleSave,
}: Props) {
  const lastScrollTopRef = useRef(0);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hostRef.current) hostRef.current.scrollTop = 0;
    lastScrollTopRef.current = 0;
  }, [posts.map((p) => p.id).join(',')]);

  return (
    <div
      ref={hostRef}
      className={`inshorts-feed-host external-public-feed__scroll${reserveTopSpace ? ' external-public-feed__scroll--badge-pad' : ''}`}
      onScroll={(e) => {
        const nextTop = e.currentTarget.scrollTop;
        const delta = nextTop - lastScrollTopRef.current;
        onScroll?.(nextTop, delta);
        if (Math.abs(delta) >= 4 && onFeedSwipeDirection) {
          onFeedSwipeDirection(delta > 0 ? 'up' : 'down');
        }
        lastScrollTopRef.current = nextTop;
      }}
    >
      {posts.map((row, i) => (
        <article key={row.id} className="inshorts-slide inshorts-slide--external-post" data-slide-index={i}>
          <div className="inshorts-card external-public-inshorts-card">
            <div className="inshorts-meta external-public-inshorts-meta">
              <span className="external-public-inshorts-type">{externalPostContentTypeLabel(row)}</span>
              {row.externalCategory?.name ? (
                <span className="external-public-inshorts-cat">{row.externalCategory.name}</span>
              ) : null}
              {onToggleSave && row.contentType !== 'job' ? (
                <button
                  type="button"
                  className={`external-public-inshorts-save${savedByMe.includes(row.id) ? ' is-saved' : ''}`}
                  onClick={() => onToggleSave(row.id)}
                  aria-label={savedByMe.includes(row.id) ? 'Unsave' : 'Save'}
                >
                  <i className={savedByMe.includes(row.id) ? 'bi bi-bookmark-fill' : 'bi bi-bookmark'} aria-hidden />
                </button>
              ) : null}
            </div>
            <div className="inshorts-body inshorts-body--grow external-public-inshorts-body">
              <ExternalPublicPostCard
                row={row}
                isSaved={savedByMe.includes(row.id)}
                onToggleSave={onToggleSave ? () => onToggleSave(row.id) : undefined}
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
