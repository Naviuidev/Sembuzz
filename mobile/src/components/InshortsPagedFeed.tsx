import React, { useCallback } from 'react';
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
import type { PublicFeedItem } from '../utils/publicFeed';
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

const SPONSORED_AD_BG = '#0d1f2d';

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

  const openLink = () => {
    if (event.externalLink) Linking.openURL(event.externalLink).catch(() => {});
  };

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
              onPress={userId ? onLike : undefined}
              disabled={!userId}
              style={styles.engagePillBtn}
              hitSlop={8}
              accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
            >
              {isLiked ? (
                <HeartFillIcon width={20} height={20} fill="#ff4d6a" />
              ) : (
                <HeartIcon width={20} height={20} fill="#ffffff" />
              )}
            </TouchableOpacity>
            <Text style={styles.engagePillCount}>{likeCount}</Text>
            <TouchableOpacity
              onPress={userId ? onSave : undefined}
              disabled={!userId}
              style={styles.engagePillBtn}
              hitSlop={8}
              accessibilityLabel={isSaved ? 'Unsave' : 'Save'}
            >
              {isSaved ? (
                <BookmarkFillIcon width={19} height={19} fill="#ffffff" />
              ) : (
                <BookmarkIcon width={19} height={19} fill="#ffffff" />
              )}
            </TouchableOpacity>
            {event.commentsEnabled ? (
              <>
                <TouchableOpacity
                  onPress={userId ? () => setCommentsOpen(true) : undefined}
                  disabled={!userId}
                  style={styles.engagePillBtn}
                  hitSlop={8}
                  accessibilityLabel="Comments"
                >
                  <ChatIcon width={19} height={19} fill="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.engagePillCount}>{commentCount}</Text>
              </>
            ) : null}
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
          <Text style={styles.headline}>{event.title}</Text>
          {event.description ? (
            <Text style={styles.summary} numberOfLines={8}>
              {event.description}
            </Text>
          ) : null}
          <Text style={styles.timeAgo}>{formatRelativeTime(event.updatedAt || event.createdAt)}</Text>
        </View>

        {event.externalLink ? (
          <TouchableOpacity style={styles.tapMore} onPress={openLink} activeOpacity={0.85}>
            <Text style={styles.tapMoreText}>Tap to read more</Text>
            <Text style={styles.tapMoreSub}>Opens in browser</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.tapMoreMuted}>
            <Text style={styles.swipeHint}>Swipe up for next</Text>
          </View>
        )}
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
              {ad.description}
            </Text>
          ) : null}
          <Text style={styles.timeAgo}>{formatRelativeTime(ad.createdAt || ad.startAt)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tapMore} onPress={onPress} activeOpacity={0.85}>
          <Text style={styles.tapMoreText}>Tap to know more</Text>
          {ad.externalLink ? <Text style={styles.tapMoreSub} numberOfLines={1}>{ad.externalLink}</Text> : null}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InshortsBannerPage({ banner, pageHeight }: { banner: BannerAdPublic; pageHeight: number }) {
  const uri = imageSrc(banner.imageUrl);
  const [failed, setFailed] = React.useState(false);
  const imgH = Math.max(200, Math.round(pageHeight * 0.55));

  React.useEffect(() => {
    recordBannerAdView(banner.id).catch(() => {});
  }, [banner.id]);

  const onPress = () => {
    recordBannerAdClick(banner.id)
      .then((r) => {
        if (r.redirectUrl) Linking.openURL(r.redirectUrl).catch(() => {});
      })
      .catch(() => {});
  };

  return (
    <View style={[styles.pageRoot, { minHeight: pageHeight }]}>
      <TouchableOpacity style={styles.card} activeOpacity={0.95} onPress={onPress}>
        <Text style={styles.bannerTag}>Advertisement</Text>
        {uri && !failed ? (
          <Image
            source={{ uri }}
            style={[styles.heroImage, { height: imgH }]}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <View style={[styles.heroPlaceholder, { height: imgH }]}>
            <Text style={styles.heroPlaceholderText}>Banner</Text>
          </View>
        )}
        <View style={styles.tapMoreMuted}>
          <Text style={styles.swipeHint}>Tap to open link · Swipe up for next</Text>
        </View>
      </TouchableOpacity>
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
}: Props) {
  const renderItem: ListRenderItem<PublicFeedItem> = useCallback(
    ({ item }) => (
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
          />
        ) : item.type === 'sponsored' ? (
          <InshortsSponsoredPage ad={item.ad} pageHeight={pageHeight} />
        ) : (
          <InshortsBannerPage banner={item.banner} pageHeight={pageHeight} />
        )}
      </View>
    ),
    [pageHeight, userId, getEventEngagement, onLike, onSave, onCommentAdded],
  );

  const keyExtractor = useCallback((item: PublicFeedItem, index: number) => {
    if (item.type === 'event') return `e-${item.event.id}`;
    if (item.type === 'sponsored') return `s-${index}-${item.ad.id}`;
    return `b-${index}-${item.banner.id}`;
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
      data={feedItems}
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    />
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#161616',
    maxHeight: '100%',
  },
  heroImage: {
    width: '100%',
    backgroundColor: '#222',
  },
  heroPlaceholder: {
    width: '100%',
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    color: '#555',
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
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
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
    color: 'rgba(255,255,255,0.95)',
    marginRight: 4,
    minWidth: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
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
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallLogoLetter: {
    color: '#ccc',
    fontWeight: '700',
    fontSize: 14,
  },
  sourceName: {
    flex: 1,
    color: '#e8e8e8',
    fontSize: 14,
    fontWeight: '600',
  },
  textBlock: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    flexGrow: 1,
  },
  headline: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 8,
  },
  summary: {
    color: '#b8b8b8',
    fontSize: 15,
    lineHeight: 22,
  },
  timeAgo: {
    marginTop: 10,
    color: '#666',
    fontSize: 12,
  },
  tapMore: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tapMoreMuted: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tapMoreText: {
    color: '#7ec8ff',
    fontSize: 15,
    fontWeight: '600',
  },
  tapMoreSub: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  swipeHint: {
    color: '#666',
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
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  adBadgeText: {
    color: '#aee',
    fontSize: 11,
    fontWeight: '800',
  },
  adLabel: {
    color: '#8ab',
    fontSize: 12,
  },
  bannerTag: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
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
