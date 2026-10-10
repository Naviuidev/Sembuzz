import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  eventPostHasActionButtons,
  eventPostHasScheduleMeta,
  formatEventOccurrenceDate,
  formatEventTimeRange,
  parseEventActionButtonsPublic,
  EVENT_DESCRIPTION_MAX_WORDS,
  isEventPrimaryActionLabel,
  truncateWords,
  type EventPostPublicFields,
} from '../utils/eventPostPublic';
import { imageSrc } from '../utils/image';
import { parseImageUrls } from '../services/publicBlogs';

const TEXT = '#0f172a';
const MUTED = '#64748b';
const ACCENT = '#3468f9';

type Props = {
  event: EventPostPublicFields;
  compact?: boolean;
  showHero?: boolean;
  /** When true, long descriptions omit the inline “Know more” link (e.g. footer CTA on feed cards). */
  hideKnowMore?: boolean;
  descExpanded?: boolean;
  onDescExpand?: () => void;
  descriptionMaxWords?: number;
  /** Horizontal chips (date / time / location) for feed cards. */
  metaChips?: boolean;
  /** Truncated teaser + “....” + info pill on the same row (feed cards). */
  inlineKnowMorePill?: boolean;
  /** Feed “Know more” opens chooser instead of expanding inline. */
  onInlineKnowMorePress?: () => void;
};

function schoolBadgeLabel(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  return name.slice(0, 3).toUpperCase() || 'SB';
}

export function EventPostPublicMeta({ event, compact, metaChips }: Props) {
  return (
    <EventPostDetailBody event={event} compact={compact} showHero={false} metaOnly metaChips={metaChips} />
  );
}

export function EventPostPublicDescriptionRow({
  event,
  compact,
  hideKnowMore,
  descExpanded,
  onDescExpand,
  descriptionMaxWords,
  inlineKnowMorePill,
  onInlineKnowMorePress,
}: Props) {
  return (
    <EventPostDetailBody
      event={event}
      compact={compact}
      showHero={false}
      descOnly
      hideKnowMore={hideKnowMore}
      descExpanded={descExpanded}
      onDescExpand={onDescExpand}
      descriptionMaxWords={descriptionMaxWords}
      inlineKnowMorePill={inlineKnowMorePill}
      onInlineKnowMorePress={onInlineKnowMorePress}
    />
  );
}

export function EventPostPublicActionButtons({ event, compact }: Props) {
  return <EventPostDetailBody event={event} compact={compact} showHero={false} actionsOnly />;
}

export function EventPostDetailBody({
  event,
  compact,
  showHero = true,
  metaOnly,
  descOnly,
  actionsOnly,
  hideKnowMore,
  descExpanded: descExpandedProp,
  onDescExpand,
  descriptionMaxWords,
  metaChips,
  inlineKnowMorePill,
  onInlineKnowMorePress,
}: Props & { metaOnly?: boolean; descOnly?: boolean; actionsOnly?: boolean }) {
  const [descExpandedLocal, setDescExpandedLocal] = useState(false);
  const descExpanded = descExpandedProp ?? descExpandedLocal;
  const expandDesc = onDescExpand ?? (() => setDescExpandedLocal(true));
  const schoolName = event.school?.name ?? '';
  const images = parseImageUrls(event.imageUrls);
  const hero = images[0] ? imageSrc(images[0]) : '';
  const dateLabel = formatEventOccurrenceDate(event.eventDate ?? null);
  const timeLabel = formatEventTimeRange(event.eventStartTime, event.eventEndTime);
  const location = event.eventLocation?.trim() || '';
  const trimmedDesc = (event.description ?? '').trim();
  const descWordLimit = descriptionMaxWords ?? EVENT_DESCRIPTION_MAX_WORDS;
  const { text: descPreviewRaw, truncated: descTruncated } = descExpanded
    ? { text: trimmedDesc, truncated: false }
    : truncateWords(trimmedDesc, descWordLimit);
  const descPreview = descPreviewRaw.replace(/\u2026$/, '').replace(/…$/, '');
  const categoryLabel = event.subCategory?.name ?? '';
  const buttons = parseEventActionButtonsPublic(event.actionButtons);

  const showMeta = !descOnly && !actionsOnly && eventPostHasScheduleMeta(event);
  const showDesc = !metaOnly && !actionsOnly && !!descPreview;
  const showActions = !metaOnly && !descOnly && eventPostHasActionButtons(event);
  const showTitle = !metaOnly && !descOnly && !actionsOnly;

  return (
    <View style={compact ? styles.rootCompact : styles.root}>
      {showHero && !metaOnly && !descOnly && !actionsOnly ? (
        <View style={styles.heroWrap}>
          {hero ? (
            <Image source={{ uri: hero }} style={styles.hero} resizeMode="cover" />
          ) : (
            <View style={[styles.hero, styles.heroPh]}>
              <Ionicons name="image-outline" size={32} color="#94a3b8" />
            </View>
          )}
          {schoolName ? (
            <View style={styles.schoolBadge}>
              <Text style={styles.schoolBadgeText}>{schoolBadgeLabel(schoolName)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {showTitle ? <Text style={styles.title}>{event.title}</Text> : null}

      {showMeta ? (
        metaChips ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.metaChipsRow}
          >
            {dateLabel ? (
              <View style={[styles.metaChip, styles.metaChipSuccess]}>
                <Ionicons name="calendar-outline" size={14} color="#0f5132" />
                <Text style={[styles.metaChipText, styles.metaChipTextSuccess]} numberOfLines={1}>
                  {dateLabel}
                </Text>
              </View>
            ) : null}
            {timeLabel ? (
              <View style={[styles.metaChip, styles.metaChipWarning]}>
                <Ionicons name="time-outline" size={14} color="#664d03" />
                <Text style={[styles.metaChipText, styles.metaChipTextWarning]} numberOfLines={1}>
                  {timeLabel}
                </Text>
              </View>
            ) : null}
            {location ? (
              <View style={[styles.metaChip, styles.metaChipInfo]}>
                <Ionicons name="location-outline" size={14} color="#055160" />
                <Text style={[styles.metaChipText, styles.metaChipTextInfo]} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        ) : (
          <View style={styles.metaBlock}>
            {dateLabel ? (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color={MUTED} />
                <Text style={styles.metaText}>{dateLabel}</Text>
              </View>
            ) : null}
            {timeLabel ? (
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color={MUTED} />
                <Text style={styles.metaText}>{timeLabel}</Text>
              </View>
            ) : null}
            {location ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={MUTED} />
                <Text style={styles.metaText}>{location}</Text>
              </View>
            ) : null}
          </View>
        )
      ) : null}

      {categoryLabel && !metaOnly && !descOnly && !actionsOnly ? (
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{categoryLabel}</Text>
        </View>
      ) : null}

      {showDesc ? (
        inlineKnowMorePill && descTruncated && !descExpanded ? (
          <View style={styles.descKnowMoreRow}>
            <Text style={styles.teaserFlex}>
              {descPreview}
              <Text style={styles.teaserEllipsis}>....</Text>
            </Text>
            <TouchableOpacity
              style={styles.inlineKnowMorePill}
              onPress={onInlineKnowMorePress ?? expandDesc}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.inlineKnowMorePillText}>Know more</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.teaser}>
            {descExpanded ? trimmedDesc : descPreviewRaw}
            {!descExpanded && descTruncated && !inlineKnowMorePill ? '…' : null}
          </Text>
        )
      ) : null}
      {descTruncated &&
      !descExpanded &&
      !hideKnowMore &&
      !inlineKnowMorePill &&
      !metaOnly &&
      !descOnly &&
      !actionsOnly ? (
        <TouchableOpacity onPress={expandDesc} activeOpacity={0.7} hitSlop={8}>
          <Text style={styles.knowMore}>Know more</Text>
        </TouchableOpacity>
      ) : null}

      {showActions ? (
        <View style={styles.actions}>
          {buttons.map((b) => {
            const primary = isEventPrimaryActionLabel(b.label);
            return (
              <TouchableOpacity
                key={`${b.label}-${b.url}`}
                style={[styles.actionBtn, primary ? styles.actionPrimary : styles.actionSecondary]}
                onPress={() => Linking.openURL(b.url).catch(() => {})}
                activeOpacity={0.85}
              >
                <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{b.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: 4 },
  rootCompact: { paddingBottom: 2, marginTop: 2 },
  heroWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#f1f5f9',
    aspectRatio: 16 / 10,
    maxHeight: 220,
  },
  hero: { width: '100%', height: '100%' },
  heroPh: { alignItems: 'center', justifyContent: 'center' },
  schoolBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  schoolBadgeText: { fontSize: 11, fontWeight: '800', color: TEXT },
  title: { fontSize: 18, fontWeight: '700', color: TEXT, lineHeight: 24, marginBottom: 12 },
  metaBlock: { gap: 8, marginBottom: 12 },
  metaChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    maxWidth: 220,
  },
  metaChipSuccess: { backgroundColor: '#d1e7dd' },
  metaChipWarning: { backgroundColor: '#fff3cd' },
  metaChipInfo: { backgroundColor: '#cff4fc' },
  metaChipText: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  metaChipTextSuccess: { color: '#0f5132' },
  metaChipTextWarning: { color: '#664d03' },
  metaChipTextInfo: { color: '#055160' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14, color: '#475569', flex: 1 },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#1d4ed8' },
  teaser: { fontSize: 14, lineHeight: 22, color: MUTED, marginBottom: 6 },
  descKnowMoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    marginBottom: 4,
  },
  teaserFlex: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 22,
    color: MUTED,
    minWidth: 0,
    paddingRight: 6,
  },
  teaserEllipsis: {
    color: MUTED,
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
  knowMore: { fontSize: 14, fontWeight: '600', color: ACCENT, marginBottom: 14 },
  actions: { gap: 8, marginBottom: 12 },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  actionPrimary: { backgroundColor: ACCENT },
  actionSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  actionText: { fontSize: 14, fontWeight: '600', color: TEXT, textAlign: 'center' },
  actionTextPrimary: { color: '#fff' },
});
