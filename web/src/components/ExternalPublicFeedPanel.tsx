import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExternalCategoryPublic } from '../services/public-events.service';
import { userExternalFeedService } from '../services/user-external-feed.service';
import { ExternalPublicCategoryBadges } from './ExternalPublicCategoryBadges';
import { ExternalPublicSwipeFeed } from './ExternalPublicSwipeFeed';

type Props = {
  signedIn: boolean;
  onSignIn: () => void;
  pipelineCategories?: ExternalCategoryPublic[];
  onFeedSwipeDirection?: (direction: 'up' | 'down') => void;
};

export function ExternalPublicFeedPanel({
  signedIn,
  onSignIn,
  pipelineCategories,
  onFeedSwipeDirection,
}: Props) {
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryBarVisible, setCategoryBarVisible] = useState(true);

  const { data: categoriesFromApi = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['user', 'external-feed', 'categories'],
    queryFn: () => userExternalFeedService.getCategories(),
    enabled: signedIn,
  });

  const categories = signedIn ? categoriesFromApi : (pipelineCategories ?? []);

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['user', 'external-feed', 'posts', selectedCategoryId ?? 'all'],
    queryFn: () => userExternalFeedService.getPosts(selectedCategoryId),
    enabled: signedIn,
  });

  const filteredPosts = useMemo(() => {
    if (!selectedCategoryId) return posts;
    return posts.filter((p) => p.externalCategory?.id === selectedCategoryId);
  }, [posts, selectedCategoryId]);

  const postIdsKey = filteredPosts.map((p) => p.id).join(',');

  const { data: externalEngagement } = useQuery({
    queryKey: ['user', 'external-feed', 'engagement', postIdsKey],
    queryFn: () => userExternalFeedService.getEngagement(filteredPosts.map((p) => p.id)),
    enabled: signedIn && filteredPosts.length > 0,
  });

  const engagementQueryKey = ['user', 'external-feed', 'engagement', postIdsKey] as const;

  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!signedIn || !postIdsKey) return;
    const fromServer = externalEngagement?.savedByMe;
    if (fromServer) setSavedPostIds(new Set(fromServer));
  }, [signedIn, postIdsKey, externalEngagement]);

  const applySavedToCache = useCallback(
    (ids: string[]) => {
      queryClient.setQueryData(engagementQueryKey, { savedByMe: ids });
    },
    [queryClient, engagementQueryKey],
  );

  const saveMutation = useMutation({
    mutationFn: (postId: string) => userExternalFeedService.toggleSave(postId),
    onMutate: (postId) => {
      let prevSet = new Set<string>();
      setSavedPostIds((current) => {
        prevSet = new Set(current);
        const nextSet = new Set(current);
        if (nextSet.has(postId)) nextSet.delete(postId);
        else nextSet.add(postId);
        applySavedToCache([...nextSet]);
        return nextSet;
      });
      return { prevSet };
    },
    onSuccess: (data, postId) => {
      setSavedPostIds((current) => {
        const next = new Set(current);
        if (data.saved) next.add(postId);
        else next.delete(postId);
        applySavedToCache([...next]);
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: ['user', 'external-feed', 'saved'] });
    },
    onError: (_err, _postId, ctx) => {
      if (ctx?.prevSet) {
        setSavedPostIds(ctx.prevSet);
        applySavedToCache([...ctx.prevSet]);
      }
    },
  });

  const savedByMe = useMemo(() => [...savedPostIds], [savedPostIds]);

  const swipeActive = signedIn && !postsLoading && filteredPosts.length > 0;
  const showCategoryBar = categoriesLoading || categories.length > 0;

  const handleSelectCategory = useCallback((id: string | null) => {
    setSelectedCategoryId(id);
    setCategoryBarVisible(true);
  }, []);

  const handleFeedScroll = useCallback((scrollTop: number, delta: number) => {
    if (scrollTop <= 16) {
      setCategoryBarVisible(true);
      return;
    }
    if (delta > 8) {
      setCategoryBarVisible(false);
    } else if (delta < -8) {
      setCategoryBarVisible(true);
    }
  }, []);

  return (
    <div className={`external-public-feed${swipeActive ? ' external-public-feed--swipe' : ''}`}>
      {!signedIn ? (
        <div className="external-public-feed__signin-card card border-0 shadow-sm">
          <div className="card-body text-center py-4 px-4 text-white">
            <i className="bi bi-lock-fill d-block mb-2 external-public-feed__signin-icon" aria-hidden />
            <p className="fw-semibold mb-1">Sign in to avail the feature</p>
            <p className="small mb-3 external-public-feed__signin-sub">
              External jobs, offers, campaigns, and partner posts for your school are available after you sign in.
            </p>
            <button type="button" className="btn btn-light rounded-pill px-4 fw-semibold" onClick={onSignIn}>
              Sign in
            </button>
          </div>
        </div>
      ) : null}

      {signedIn && !swipeActive && showCategoryBar ? (
        <ExternalPublicCategoryBadges
          categories={categories}
          categoriesLoading={categoriesLoading}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleSelectCategory}
        />
      ) : null}

      {signedIn ? (
        postsLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-secondary" role="status" />
            <p className="mt-2 mb-0 text-muted small">Loading external posts…</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="card border-0 shadow-sm external-public-feed__empty">
            <div className="card-body text-center py-5 px-4">
              <i className="bi bi-briefcase external-public-feed__empty-icon" aria-hidden />
              <p className="text-muted mb-0 mt-2">
                {selectedCategoryId ? 'No approved posts in this category yet.' : 'No approved external posts yet.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {showCategoryBar ? (
              <div
                className={`external-public-feed__badges-fixed${categoryBarVisible ? '' : ' is-collapsed'}`}
                aria-hidden={!categoryBarVisible}
              >
                <ExternalPublicCategoryBadges
                  categories={categories}
                  categoriesLoading={categoriesLoading}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={handleSelectCategory}
                  compact
                />
              </div>
            ) : null}
            <ExternalPublicSwipeFeed
              posts={filteredPosts}
              reserveTopSpace={showCategoryBar}
              onScroll={handleFeedScroll}
              onFeedSwipeDirection={onFeedSwipeDirection}
              savedByMe={savedByMe}
              onToggleSave={(postId) => saveMutation.mutate(postId)}
            />
          </>
        )
      ) : null}
    </div>
  );
}
