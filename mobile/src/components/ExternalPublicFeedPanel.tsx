import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Image,
  FlatList,
  Modal,
  Pressable,
  type ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BookmarkIcon from 'react-native-bootstrap-icons/icons/bookmark';
import BookmarkFillIcon from 'react-native-bootstrap-icons/icons/bookmark-fill';
import type { ExternalCategoryPublic } from '../services/events';
import {
  getExternalFeedCategories,
  getExternalFeedEngagement,
  getExternalFeedPosts,
  toggleExternalFeedSave,
  type ExternalPostRequestRow,
} from '../services/userExternalFeed';
import { imageSrc } from '../utils/image';
import { feedActionPillColors } from '../utils/feedActionPills';
import {
  INSHORTS_FEED_DESCRIPTION_MAX_WORDS,
  truncateWords,
} from '../utils/eventPostPublic';
import { authModalTheme } from '../styles/authModalTheme';

const CATEGORY_BAR_TOP_PAD = 18;
const CATEGORY_BAR_BOTTOM_PAD = 10;
const FEED_PAGE_ROOT_PAD_Y = 8;

function feedPageInnerHeight(pageHeight: number): number {
  return Math.max(160, pageHeight - FEED_PAGE_ROOT_PAD_Y);
}

const BADGE_BACKGROUNDS = ['#e0e7ff', '#dcfce7', '#fef3c7', '#e0f2fe', '#fce7f3', '#f3e8ff'];

function parseImageUrls(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

function parseActionButtons(raw: string | null | undefined): { label: string; url: string }[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const label = String((item as { label?: string }).label ?? '').trim();
        const url = String((item as { url?: string }).url ?? '').trim();
        if (!label || !url) return null;
        return { label, url };
      })
      .filter(Boolean) as { label: string; url: string }[];
  } catch {
    return [];
  }
}

function contentTypeLabel(row: ExternalPostRequestRow): string {
  const t = (row.contentType ?? '').toLowerCase();
  if (t === 'job') return 'Job';
  if (t === 'offer') return 'Offer';
  if (t === 'campaign') return 'Campaign';
  return 'External';
}

function isJobPost(row: ExternalPostRequestRow): boolean {
  return (row.contentType ?? '').toLowerCase() === 'job';
}

function getJobApplyUrl(post: ExternalPostRequestRow): string | null {
  const direct = post.applyButtonUrl?.trim();
  if (direct) return direct;
  if (post.applicationMethod === 'email' && post.applicationTarget?.trim()) {
    return `mailto:${post.applicationTarget.trim()}`;
  }
  return post.externalLink?.trim() || null;
}

function isHeroActionLabel(label: string): boolean {
  return /^(apply|save\s*job|save)$/i.test(label.trim());
}

function computeExternalHeroHeight(pageHeight: number, actionCount: number): number {
  const textBudget = 52 + 96 + 120 + 20;
  const actionBudget = actionCount > 0 ? 10 + Math.ceil(actionCount / 2) * 46 : 0;
  const reserved = textBudget + actionBudget;
  const maxByRatio = Math.round(pageHeight * 0.42);
  const maxByPage = pageHeight - reserved;
  return Math.max(100, Math.min(maxByRatio, maxByPage));
}

function ExternalActionButtons({ actions }: { actions: { label: string; url: string }[] }) {
  if (actions.length === 0) return null;
  return (
    <View style={styles.feedActionButtonsRow}>
      {actions.map((b, index) => {
        const colors = feedActionPillColors(b.label, index);
        return (
          <TouchableOpacity
            key={`${b.label}-${b.url}`}
            style={[styles.footerActionPill, { backgroundColor: colors.bg }]}
            onPress={() => void Linking.openURL(b.url)}
            activeOpacity={0.85}
          >
            <Text style={[styles.footerActionPillText, { color: colors.text }]} numberOfLines={1}>
              {b.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ExternalPostPage({
  post,
  pageHeight,
  isSaved,
  onToggleSave,
}: {
  post: ExternalPostRequestRow;
  pageHeight: number;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  const [knowMoreOpen, setKnowMoreOpen] = useState(false);
  const images = parseImageUrls(post.imageUrls);
  const firstImage = images[0];
  const isJob = isJobPost(post);
  const jobApplyUrl = isJob ? getJobApplyUrl(post) : null;
  const showJobApply =
    isJob && (post.applyButtonEnabled ?? Boolean(jobApplyUrl)) && Boolean(jobApplyUrl);
  const showJobSave = isJob && (post.saveJobButtonEnabled ?? true);
  const showOfferSave = !isJob;

  const actionButtons = parseActionButtons(post.actionButtons ?? null);
  const applyUrl = post.applyButtonUrl?.trim() || post.externalLink?.trim();
  let footerActions =
    actionButtons.length > 0
      ? actionButtons
      : !isJob && applyUrl
        ? [{ label: 'View details', url: applyUrl }]
        : [];
  if (isJob) {
    footerActions = footerActions.filter((b) => !isHeroActionLabel(b.label));
  }
  const showHeroEngage = showOfferSave || showJobApply || showJobSave;
  const descRaw = post.description?.trim() ?? '';
  const { text: descPreview, truncated: descTruncated } = truncateWords(
    descRaw,
    INSHORTS_FEED_DESCRIPTION_MAX_WORDS,
  );
  const descPreviewTeaser = descTruncated ? descPreview.replace(/…\s*$/, '').trimEnd() : descPreview;
  const innerPageHeight = feedPageInnerHeight(pageHeight);
  const imgH = computeExternalHeroHeight(innerPageHeight, footerActions.length);
  const bodyScrollMaxHeight = Math.max(120, innerPageHeight - imgH - 54);

  return (
    <View style={styles.pageRoot}>
      <View style={styles.card}>
        <View style={styles.heroWrap}>
          {firstImage ? (
            <Image
              source={{ uri: imageSrc(firstImage) }}
              style={[styles.heroImage, { height: imgH }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroPlaceholder, { height: imgH }]}>
              <Ionicons name="briefcase-outline" size={36} color="#94a3b8" />
            </View>
          )}
          {showHeroEngage ? (
            <View style={styles.engagePillRow} pointerEvents="box-none">
              {showJobApply ? (
                <TouchableOpacity
                  onPress={() => void Linking.openURL(jobApplyUrl!)}
                  style={styles.engageApplyBtn}
                  hitSlop={8}
                  activeOpacity={0.88}
                  accessibilityLabel="Apply"
                >
                  <Ionicons name="paper-plane-outline" size={17} color={authModalTheme.successDark} />
                  <Text style={styles.engageApplyText}>Apply</Text>
                </TouchableOpacity>
              ) : null}
              {showJobSave || showOfferSave ? (
                <TouchableOpacity
                  onPress={onToggleSave}
                  style={styles.engageSaveBtn}
                  hitSlop={8}
                  activeOpacity={0.88}
                  accessibilityLabel={isSaved ? (isJob ? 'Unsave job' : 'Unsave') : isJob ? 'Save job' : 'Save'}
                >
                  {isSaved ? (
                    <BookmarkFillIcon width={19} height={19} fill={authModalTheme.primaryDark} />
                  ) : (
                    <BookmarkIcon width={19} height={19} fill={authModalTheme.primaryDark} />
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          <View style={styles.typeChip}>
            <Text style={styles.typeChipText}>{contentTypeLabel(post)}</Text>
          </View>
          <Text style={styles.sourceName} numberOfLines={1}>
            {post.externalCategory?.name ?? 'External'}
          </Text>
        </View>
        <ScrollView
          style={[styles.cardBodyScroll, { maxHeight: bodyScrollMaxHeight }]}
          contentContainerStyle={styles.cardBodyScrollContent}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.textBlock}>
            <Text style={styles.headline} numberOfLines={4}>{post.title}</Text>
            {post.companyName ? (
              <Text style={styles.companyLine} numberOfLines={2}>{post.companyName}</Text>
            ) : null}
            {descRaw ? (
              descTruncated ? (
                <View style={styles.descKnowMoreRow}>
                  <Text style={styles.teaserFlex}>
                    {descPreviewTeaser}
                    <Text style={styles.teaserEllipsis}>....</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.inlineKnowMorePill}
                    onPress={() => setKnowMoreOpen(true)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                  >
                    <Text style={styles.inlineKnowMorePillText}>Know more</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.summary}>{descRaw}</Text>
              )
            ) : null}
            <ExternalActionButtons actions={footerActions} />
          </View>
        </ScrollView>
      </View>

      <Modal visible={knowMoreOpen} transparent animationType="fade" onRequestClose={() => setKnowMoreOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setKnowMoreOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{post.title}</Text>
            {post.companyName ? <Text style={styles.modalCompany}>{post.companyName}</Text> : null}
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator>
              <Text style={styles.modalBody}>{descRaw}</Text>
            </ScrollView>
            <ExternalActionButtons actions={footerActions} />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setKnowMoreOpen(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

type Props = {
  pageHeight: number;
};

export function ExternalPublicFeedPanel({ pageHeight }: Props) {
  const [categories, setCategories] = useState<ExternalCategoryPublic[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [posts, setPosts] = useState<ExternalPostRequestRow[]>([]);
  const [savedByMe, setSavedByMe] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listAreaHeight, setListAreaHeight] = useState(0);
  const listRef = useRef<FlatList<ExternalPostRequestRow>>(null);

  const load = useCallback(async () => {
    try {
      const [cats, list] = await Promise.all([
        getExternalFeedCategories(),
        getExternalFeedPosts(selectedCategoryId),
      ]);
      setCategories(cats);
      setPosts(list);
      setError(null);
      if (list.length > 0) {
        const engagement = await getExternalFeedEngagement(list.map((p) => p.id));
        setSavedByMe(new Set(engagement.savedByMe));
      } else {
        setSavedByMe(new Set());
      }
    } catch {
      setError('Unable to load external posts right now.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [selectedCategoryId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filteredPosts = useMemo(() => {
    if (!selectedCategoryId) return posts;
    return posts.filter((p) => p.externalCategory?.id === selectedCategoryId);
  }, [posts, selectedCategoryId]);

  const slideHeight = useMemo(() => {
    if (listAreaHeight > 0) return listAreaHeight;
    const reserved = CATEGORY_BAR_TOP_PAD + CATEGORY_BAR_BOTTOM_PAD + 44;
    return Math.max(320, pageHeight - reserved);
  }, [listAreaHeight, pageHeight]);

  const toggleSave = useCallback(async (postId: string) => {
    try {
      const result = await toggleExternalFeedSave(postId);
      setSavedByMe((prev) => {
        const next = new Set(prev);
        if (result.saved) next.add(postId);
        else next.delete(postId);
        return next;
      });
    } catch {
      /* keep previous */
    }
  }, []);

  const renderItem: ListRenderItem<ExternalPostRequestRow> = useCallback(
    ({ item }) => (
      <View style={[styles.feedSlide, { height: slideHeight }]}>
        <ExternalPostPage
          post={item}
          pageHeight={slideHeight}
          isSaved={savedByMe.has(item.id)}
          onToggleSave={() => void toggleSave(item.id)}
        />
      </View>
    ),
    [slideHeight, savedByMe, toggleSave],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: slideHeight,
      offset: slideHeight * index,
      index,
    }),
    [slideHeight],
  );

  const showCategoryBar = loading || categories.length > 0;

  if (loading && posts.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a1f2e" />
        <Text style={styles.loadingText}>Loading external posts…</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {showCategoryBar ? (
        <View style={styles.categoryBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            <TouchableOpacity
              style={[styles.categoryBadge, selectedCategoryId === null && styles.categoryBadgeActive]}
              onPress={() => setSelectedCategoryId(null)}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.categoryBadgeText, selectedCategoryId === null && styles.categoryBadgeTextActive]}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map((cat, index) => {
              const active = selectedCategoryId === cat.id;
              const bg = BADGE_BACKGROUNDS[index % BADGE_BACKGROUNDS.length];
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: active ? '#1a1f2e' : bg },
                    active && styles.categoryBadgeActive,
                  ]}
                  onPress={() => setSelectedCategoryId(active ? null : cat.id)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.categoryBadgeText, active && styles.categoryBadgeTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View
        style={styles.listHost}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - listAreaHeight) > 1) setListAreaHeight(h);
        }}
      >
        {slideHeight > 0 ? (
          <FlatList
            ref={listRef}
            style={styles.feedList}
            data={filteredPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            snapToInterval={slideHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor="#1a1f2e" />
            }
            ListEmptyComponent={
              <View style={[styles.emptyWrap, { minHeight: slideHeight }]}>
                <Ionicons name="briefcase-outline" size={40} color="#94a3b8" />
                <Text style={styles.emptyTitle}>
                  {selectedCategoryId ? 'No posts in this category yet.' : 'No approved external posts yet.'}
                </Text>
                <Text style={styles.emptySub}>
                  Jobs, offers, and partner posts from your school&apos;s external pipeline appear here.
                </Text>
              </View>
            }
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews={false}
          />
        ) : (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1a1f2e" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },
  categoryBar: {
    paddingTop: CATEGORY_BAR_TOP_PAD,
    paddingBottom: CATEGORY_BAR_BOTTOM_PAD,
    paddingHorizontal: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  categoryBadge: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  categoryBadgeActive: {
    backgroundColor: '#1a1f2e',
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  categoryBadgeTextActive: {
    color: '#fff',
  },
  listHost: {
    flex: 1,
    minHeight: 0,
  },
  feedList: { flex: 1 },
  feedSlide: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  pageRoot: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignSelf: 'stretch',
  },
  heroWrap: {
    position: 'relative',
    width: '100%',
  },
  heroImage: {
    width: '100%',
    backgroundColor: '#eef2f7',
    borderRadius: 16,
  },
  heroPlaceholder: {
    width: '100%',
    backgroundColor: '#eef2f7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  engagePillRow: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  engageApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: authModalTheme.pillRadius,
    backgroundColor: authModalTheme.successLight,
    borderWidth: 1,
    borderColor: '#b8dfc8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  engageApplyText: {
    fontSize: 13,
    fontWeight: '700',
    color: authModalTheme.successDark,
  },
  engageSaveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: authModalTheme.pillRadius,
    backgroundColor: authModalTheme.primaryLight,
    borderWidth: 1,
    borderColor: '#b6d4fe',
    minWidth: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  typeChip: {
    backgroundColor: '#cff4fc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#055160',
    textTransform: 'uppercase',
  },
  sourceName: {
    flex: 1,
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
  cardBodyScroll: { alignSelf: 'stretch' },
  cardBodyScrollContent: { flexGrow: 1, paddingBottom: 4 },
  textBlock: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headline: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 6,
  },
  companyLine: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  summary: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  feedActionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  footerActionPill: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    maxWidth: '100%',
  },
  footerActionPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1f2e',
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    textAlign: 'center',
  },
  errorBanner: {
    marginHorizontal: 12,
    marginBottom: 6,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 10,
  },
  errorText: { color: '#b91c1c', fontSize: 13, textAlign: 'center' },
  descKnowMoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    marginBottom: 4,
  },
  teaserFlex: {
    flex: 1,
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    minWidth: 0,
    paddingRight: 6,
  },
  teaserEllipsis: {
    color: '#475569',
  },
  inlineKnowMorePill: {
    backgroundColor: '#212529',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexShrink: 0,
    marginBottom: 1,
  },
  inlineKnowMorePillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1f2e',
    marginBottom: 4,
  },
  modalCompany: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  modalScroll: {
    maxHeight: 280,
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  modalCloseBtn: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalCloseBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0b4a99',
  },
});
