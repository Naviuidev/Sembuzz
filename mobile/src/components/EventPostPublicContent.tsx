import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  eventPostHasActionButtons,
  eventPostHasScheduleMeta,
  formatEventOccurrenceDate,
  formatEventTimeRange,
  parseEventActionButtonsPublic,
  EVENT_DESCRIPTION_MAX_WORDS,
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
};

function schoolBadgeLabel(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  return name.slice(0, 3).toUpperCase() || 'SB';
}

function isPrimaryAction(label: string): boolean {
  const l = label.toLowerCase();
  if (l.includes('google calendar') || l.includes('apple calendar')) return false;
  if (l.includes('calendar') && !l.includes('rsvp')) return false;
  return true;
}

export function EventPostPublicMeta({ event, compact }: Props) {
  return <EventPostDetailBody event={event} compact={compact} showHero={false} metaOnly />;
}

export function EventPostPublicDescriptionRow({ event, compact }: Props) {
  return <EventPostDetailBody event={event} compact={compact} showHero={false} descOnly />;
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
}: Props & { metaOnly?: boolean; descOnly?: boolean; actionsOnly?: boolean }) {
  const [descExpanded, setDescExpanded] = useState(false);
  const schoolName = event.school?.name ?? '';
  const images = parseImageUrls(event.imageUrls);
  const hero = images[0] ? imageSrc(images[0]) : '';
  const dateLabel = formatEventOccurrenceDate(event.eventDate ?? null);
  const timeLabel = formatEventTimeRange(event.eventStartTime, event.eventEndTime);
  const location = event.eventLocation?.trim() || '';
  const trimmedDesc = (event.description ?? '').trim();
  const { text: descPreview, truncated: descTruncated } = descExpanded
    ? { text: trimmedDesc, truncated: false }
    : truncateWords(trimmedDesc, EVENT_DESCRIPTION_MAX_WORDS);
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
      ) : null}

      {categoryLabel && !metaOnly && !descOnly && !actionsOnly ? (
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{categoryLabel}</Text>
        </View>
      ) : null}

      {showDesc ? (
        <Text style={styles.teaser}>
          {descPreview}
          {!descExpanded && descTruncated ? '…' : null}
        </Text>
      ) : null}
      {descTruncated && !descExpanded && !metaOnly && !descOnly && !actionsOnly ? (
        <TouchableOpacity onPress={() => setDescExpanded(true)} activeOpacity={0.7} hitSlop={8}>
          <Text style={styles.knowMore}>Know more</Text>
        </TouchableOpacity>
      ) : null}

      {showActions ? (
        <View style={styles.actions}>
          {buttons.map((b) => {
            const primary = isPrimaryAction(b.label);
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
  rootCompact: { paddingBottom: 2 },
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
