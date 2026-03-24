import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  type ListRenderItem,
} from 'react-native';
import { assignBannersToEventSlides, type PublicFeedItem } from '../utils/publicFeed';
import type { ApprovedEventPublic, SponsoredAdPublic, BannerAdPublic } from '../services/events';
import { imageSrc } from '../utils/image';
import {
  recordBannerAdView,
  recordBannerAdClick,
  recordSponsoredAdView,
  recordSponsoredAdClick,
} from '../services/events';
import { userEventsService, type EventCommentResponse } from '../services/userEvents';
import HeartIcon from 'react-native-bootstrap-icons/icons/heart';
import HeartFillIcon from 'react-native-bootstrap-icons/icons/heart-fill';
import BookmarkIcon from 'react-native-bootstrap-icons/icons/bookmark';
import BookmarkFillIcon from 'react-native-bootstrap-icons/icons/bookmark-fill';
import ChatIcon from 'react-native-bootstrap-icons/icons/chat';

const SPONSORED_AD_BG = '#f1f7ff';

function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(' ')}…`;
}

function parseImageUrlsJson(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

export function formatRelativeTime(iso: string): string {
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
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function InshortsEventPage({
  event,
  pageHeight,
  userId,
  likeCount,
  commentCount,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onCommentAdded,
  banner,
  onBannerClick,
}: {
  event: ApprovedEventPublic;
  pageHeight: number;
  userId: string | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onCommentAdded: () => void;
  banner?: BannerAdPublic | null;
  onBannerClick: (b: BannerAdPublic) => void;
}) {
  const images = event.imageUrls ? parseImageUrlsJson(event.imageUrls) : [];
  const firstImage = images[0];
  const imgH = Math.max(160, Math.round(pageHeight * 0.42));
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [comments, setComments] = React.useState<EventCommentResponse[]>([]);
  const [commentsLoading, setCommentsLoading] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const [posting, setPosting] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [authHintVisible, setAuthHintVisible] = React.useState(false);
  const authHintTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const openLink = () => {
    if (event.externalLink) Linking.openURL(event.externalLink).catch(() => {});
  };

  React.useEffect(() => {
    if (banner?.id) recordBannerAdView(banner.id).catch(() => {});
  }, [banner?.id]);

  React.useEffect(
    () => () => {
      if (authHintTimerRef.current) {
        clearTimeout(authHintTimerRef.current);
      }
    },
    [],
  );

  const showAuthHint = React.useCallback(() => {
    setAuthHintVisible(true);
    if (authHintTimerRef.current) {
      clearTimeout(authHintTimerRef.current);
    }
    authHintTimerRef.current = setTimeout(() => {
      setAuthHintVisible(false);
    }, 1500);
  }, []);

  React.useEffect(() => {
    if (!commentsOpen || !event.commentsEnabled) return;
    setCommentsLoading(true);
    userEventsService
      .getComments(event.id)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [commentsOpen, event.id, event.commentsEnabled]);

  const submitComment = async () => {
    const t = commentText.trim();
    if (!t || !userId) return;
    setPosting(true);
    try {
      await userEventsService.addComment(event.id, t);
      setCommentText('');
      onCommentAdded();
      const next = await userEventsService.getComments(event.id);
      setComments(next);
    } catch {
      /* ignore */
    } finally {
      setPosting(false);
    }
  };

  const removeComment = async (commentId: string) => {
    try {
      await userEventsService.deleteComment(event.id, commentId);
      setDeleteId(null);
      onCommentAdded();
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={[styles.pageRoot, { minHeight: pageHeight }]}>
      <View style={styles.card}>
        <View style={styles.heroWrap}>
          {firstImage ? (
            <Image source={{ uri: imageSrc(firstImage) }} style={[styles.heroImage, { height: imgH }]} resizeMode="cover" />
          ) : (
            <View style={[styles.heroPlaceholder, { height: imgH }]}>
              <Text style={styles.heroPlaceholderText}>SemBuzz</Text>
            </View>
          )}
          <View style={styles.engagePill} pointerEvents="box-none">
            <TouchableOpacity
              onPress={userId ? onLike : showAuthHint}
              style={styles.engagePillBtn}
              hitSlop={8}
              accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
            >
              {isLiked ? (
                <HeartFillIcon width={20} height={20} fill="#ff4d6a" />
              ) : (
                <HeartIcon width={20} height={20} fill="#475569" />
              )}
            </TouchableOpacity>
            <Text style={styles.engagePillCount}>{likeCount}</Text>
            <TouchableOpacity
              onPress={userId ? onSave : showAuthHint}
              style={styles.engagePillBtn}
              hitSlop={8}
              accessibilityLabel={isSaved ? 'Unsave' : 'Save'}
            >
              {isSaved ? (
                <BookmarkFillIcon width={19} height={19} fill="#111827" />
              ) : (
                <BookmarkIcon width={19} height={19} fill="#475569" />
              )}
            </TouchableOpacity>
            {event.commentsEnabled ? (
              <>
                <TouchableOpacity
                  onPress={userId ? () => setCommentsOpen(true) : showAuthHint}
                  style={styles.engagePillBtn}
                  hitSlop={8}
                  accessibilityLabel="Comments"
                >
                  <ChatIcon width={19} height={19} fill="#475569" />
                </TouchableOpacity>
                <Text style={styles.engagePillCount}>{commentCount}</Text>
              </>
            ) : null}
            {authHintVisible ? <Text style={styles.authHintBubble}>Login required</Text> : null}
          </View>
        </View>
        <View style={styles.metaRow}>
          {event.school?.image ? (
            <Image source={{ uri: imageSrc(event.school.image) }} style={styles.smallLogo} />
          ) : (
            <View style={styles.smallLogoPh}>
              <Text style={styles.smallLogoLetter}>{event.school?.name?.charAt(0) ?? '?'}</Text>
            </View>
          )}
          <Text style={styles.sourceName} numberOfLines={1}>
            {event.school?.name ?? 'School'}
          </Text>
        </View>
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text style={[styles.headline, styles.titleInRow]} numberOfLines={4}>
              {event.title}
            </Text>
            {event.externalLink ? (
              <TouchableOpacity style={styles.knowMorePill} onPress={openLink} activeOpacity={0.85}>
                <Text style={styles.knowMorePillText}>Know more</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {event.description ? (
            <Text style={styles.summary} numberOfLines={8}>
              {truncateWords(event.description, 25)}
            </Text>
          ) : null}
          <Text style={styles.timeAgo}>{formatRelativeTime(event.updatedAt || event.createdAt)}</Text>
          {banner ? (
            <TouchableOpacity
              style={styles.inlineBannerBlock}
              onPress={() => onBannerClick(banner)}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Open banner ad"
            >
              <Text style={styles.inlineBannerTag}>Ad Banner</Text>
              <Image
                source={{ uri: imageSrc(banner.imageUrl) }}
                style={styles.inlineBannerImg}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <Modal visible={commentsOpen} animationType="slide" transparent onRequestClose={() => setCommentsOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentsOpen(false)} hitSlop={12}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {commentsLoading ? (
              <ActivityIndicator color="#1a1f2e" style={{ marginVertical: 16 }} />
            ) : (
              <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                {comments.map((c) => (
                  <View key={c.id} style={styles.commentRow}>
                    <Text style={styles.commentAuthor}>{c.user.name}</Text>
                    <Text style={styles.commentBody}>{c.text}</Text>
                    {userId === c.user.id ? (
                      <TouchableOpacity onPress={() => setDeleteId(c.id)}>
                        <Text style={styles.commentDel}>🗑</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            )}
            {userId ? (
              <View style={styles.modalInputRow}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Add a comment…"
                  placeholderTextColor="#888"
                  value={commentText}
                  onChangeText={setCommentText}
                  onSubmitEditing={submitComment}
                />
                <TouchableOpacity
                  style={[styles.modalPost, (!commentText.trim() || posting) && styles.modalPostDisabled]}
                  disabled={!commentText.trim() || posting}
                  onPress={submitComment}
                >
                  <Text style={styles.modalPostText}>Post</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={deleteId != null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText}>Delete this comment?</Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => setDeleteId(null)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnDanger]}
                onPress={() => deleteId && removeComment(deleteId)}
              >
                <Text style={{ color: '#fff' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InshortsSponsoredPage({ ad, pageHeight }: { ad: SponsoredAdPublic; pageHeight: number }) {
  const images = parseImageUrlsJson(ad.imageUrls);
  const firstImage = images[0];
  const imgH = Math.max(160, Math.round(pageHeight * 0.42));
  const schoolName = ad.school?.name ?? 'School';

  React.useEffect(() => {
    recordSponsoredAdView(ad.id).catch(() => {});
  }, [ad.id]);

  const onPress = () => {
    recordSponsoredAdClick(ad.id)
      .then((r) => {
        if (r.redirectUrl) Linking.openURL(r.redirectUrl).catch(() => {});
      })
      .catch(() => {});
  };

  return (
    <View style={[styles.pageRoot, { minHeight: pageHeight }]}>
      <View style={[styles.card, { backgroundColor: SPONSORED_AD_BG }]}>
        <View style={styles.adRow}>
          <View style={styles.adBadge}>
            <Text style={styles.adBadgeText}>Ad</Text>
          </View>
          <Text style={styles.adLabel}>Sponsored</Text>
        </View>
        {firstImage ? (
          <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
            <Image source={{ uri: imageSrc(firstImage) }} style={[styles.heroImage, { height: imgH }]} resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.heroPlaceholder, { height: imgH }]}>
            <Text style={styles.heroPlaceholderText}>Ad</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          {ad.school?.image ? (
            <Image source={{ uri: imageSrc(ad.school.image) }} style={styles.smallLogo} />
          ) : (
            <View style={styles.smallLogoPh}>
              <Text style={styles.smallLogoLetter}>{schoolName.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.sourceName} numberOfLines={1}>
            {schoolName}
          </Text>
        </View>
        <TouchableOpacity style={styles.textBlock} onPress={onPress} activeOpacity={0.9}>
          {ad.title?.trim() ? <Text style={styles.headline}>{ad.title}</Text> : null}
          {ad.description?.trim() ? (
            <Text style={styles.summary} numberOfLines={6}>
              {truncateWords(ad.description, 25)}
            </Text>
          ) : null}
          <Text style={styles.timeAgo}>{formatRelativeTime(ad.createdAt || ad.startAt)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

type Props = {
  feedItems: PublicFeedItem[];
  pageHeight: number;
  onRefresh: () => void;
  refreshing: boolean;
  userId: string | null;
  getEventEngagement: (eventId: string) => {
    likeCount: number;
    commentCount: number;
    isLiked: boolean;
    isSaved: boolean;
  };
  onLike: (eventId: string) => void;
  onSave: (eventId: string) => void;
  onCommentAdded: () => void;
  /** Same as web InshortsHomeFeed: banner items map onto event slides as inline ads. */
  onBannerClick: (banner: BannerAdPublic) => void;
};

export function InshortsPagedFeed({
  feedItems,
  pageHeight,
  onRefresh,
  refreshing,
  userId,
  getEventEngagement,
  onLike,
  onSave,
  onCommentAdded,
  onBannerClick,
}: Props) {
  /** Match web: do not render standalone banner slides — map banners onto news cards. */
  const slides = useMemo(
    () => feedItems.filter((item) => item.type !== 'banner') as Exclude<PublicFeedItem, { type: 'banner' }>[],
    [feedItems],
  );

  /** One banner per event slide; extras flow to the next event card — see `assignBannersToEventSlides`. */
  const bannerBySlideIndex = useMemo(() => assignBannersToEventSlides(feedItems, slides), [feedItems, slides]);

  const renderItem: ListRenderItem<Exclude<PublicFeedItem, { type: 'banner' }>> = useCallback(
    ({ item, index }) => (
      <View style={{ height: pageHeight, justifyContent: 'center' }}>
        {item.type === 'event' ? (
          <InshortsEventPage
            event={item.event}
            pageHeight={pageHeight}
            userId={userId}
            {...getEventEngagement(item.event.id)}
            onLike={() => onLike(item.event.id)}
            onSave={() => onSave(item.event.id)}
            onCommentAdded={onCommentAdded}
            banner={bannerBySlideIndex.get(index)}
            onBannerClick={onBannerClick}
          />
        ) : (
          <InshortsSponsoredPage ad={item.ad} pageHeight={pageHeight} />
        )}
      </View>
    ),
    [pageHeight, userId, getEventEngagement, onLike, onSave, onCommentAdded, bannerBySlideIndex, onBannerClick],
  );

  const keyExtractor = useCallback((item: Exclude<PublicFeedItem, { type: 'banner' }>, index: number) => {
    if (item.type === 'event') return `e-${item.event.id}`;
    return `s-${index}-${item.ad.id}`;
  }, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: pageHeight,
      offset: pageHeight * index,
      index,
    }),
    [pageHeight],
  );

  if (pageHeight <= 0) return null;

  return (
    <FlatList
      data={slides}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      snapToInterval={pageHeight}
      snapToAlignment="start"
      decelerationRate="fast"
      disableIntervalMomentum
      showsVerticalScrollIndicator={false}
      bounces
      overScrollMode="never"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a1f2e" />}
    />
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e9f0',
    maxHeight: '100%',
  },
  heroImage: {
    width: '100%',
    backgroundColor: '#eef2f7',
  },
  heroPlaceholder: {
    width: '100%',
    backgroundColor: '#eef2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    color: '#64748b',
    fontSize: 18,
    fontWeight: '700',
  },
  heroWrap: {
    position: 'relative',
    width: '100%',
  },
  engagePill: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.12)',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  engagePillBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  engagePillCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1f2e',
    marginRight: 4,
    minWidth: 14,
  },
  authHintBubble: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 0,
    gap: 10,
  },
  smallLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  smallLogoPh: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallLogoLetter: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
  sourceName: {
    flex: 1,
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
  textBlock: {
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 8,
    flexGrow: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  titleInRow: {
    flex: 1,
    minWidth: 0,
    marginBottom: 0,
  },
  knowMorePill: {
    backgroundColor: '#212529',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  knowMorePillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  headline: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 8,
  },
  inlineBannerBlock: {
    position: 'relative',
    width: '100%',
    height: 100,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e9f0',
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  inlineBannerTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inlineBannerImg: {
    width: '100%',
    height: '100%',
  },
  summary: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  timeAgo: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 12,
  },
  tapMore: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e9f0',
    backgroundColor: '#f8fbff',
  },
  tapMoreMuted: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e9f0',
    backgroundColor: '#fff',
  },
  tapMoreText: {
    color: '#0d6efd',
    fontSize: 15,
    fontWeight: '600',
  },
  tapMoreSub: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  swipeHint: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
  adRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  adBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#dbeafe',
  },
  adBadgeText: {
    color: '#1457a6',
    fontSize: 11,
    fontWeight: '800',
  },
  adLabel: {
    color: '#4e6a8a',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  modalClose: {
    fontSize: 22,
    color: '#666',
  },
  modalScroll: {
    maxHeight: 280,
    paddingHorizontal: 14,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  commentAuthor: {
    fontWeight: '700',
    color: '#333',
    fontSize: 13,
  },
  commentBody: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  commentDel: {
    fontSize: 14,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1f2e',
  },
  modalPost: {
    backgroundColor: '#0d6efd',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalPostDisabled: {
    opacity: 0.45,
  },
  modalPostText: {
    color: '#fff',
    fontWeight: '600',
  },
  confirmBox: {
    backgroundColor: '#fff',
    margin: 24,
    borderRadius: 12,
    padding: 20,
  },
  confirmText: {
    fontSize: 16,
    marginBottom: 16,
    color: '#1a1f2e',
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  confirmBtnDanger: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
  },
});
