import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  EVENT_DESCRIPTION_MAX_WORDS,
  eventPostHasActionButtons,
  eventPostHasScheduleMeta,
  formatEventDuration,
  formatEventOccurrenceDateShort,
  formatEventTimeRange,
  parseEventActionButtonsPublic,
  truncateWords,
  type EventPostPublicFields,
} from '../utils/eventPostPublic';

const TEXT = '#1a1f2e';
const MUTED = '#6c757d';
const DIVIDER = '#dee2e6';

type Props = {
  event: EventPostPublicFields;
  compact?: boolean;
};

function MetaSep() {
  return <Text style={styles.metaSep}>|</Text>;
}

export function EventPostPublicMeta({ event, compact }: Props) {
  if (!eventPostHasScheduleMeta(event)) return null;

  const dateLabel = formatEventOccurrenceDateShort(event.eventDate ?? null);
  const timeLabel = formatEventTimeRange(event.eventStartTime, event.eventEndTime);
  const durationLabel = formatEventDuration(event.eventStartTime, event.eventEndTime);
  const location = event.eventLocation?.trim() || null;
  const fontSize = compact ? 14 : 15;

  return (
    <View style={[styles.metaWrap, compact && styles.metaWrapCompact]}>
      <Ionicons name="calendar-outline" size={compact ? 18 : 20} color={MUTED} style={styles.metaLeadIcon} />
      <View style={styles.metaTextRow}>
        {dateLabel ? <Text style={[styles.metaText, { fontSize }]}>{dateLabel}</Text> : null}
        {dateLabel && (timeLabel || location) ? <MetaSep /> : null}
        {timeLabel ? (
          <View style={styles.metaInline}>
            <Ionicons name="time-outline" size={14} color={MUTED} />
            <Text style={[styles.metaText, { fontSize }]}>
              {timeLabel}
              {durationLabel ? <Text style={styles.metaDuration}> {durationLabel}</Text> : null}
            </Text>
          </View>
        ) : null}
        {timeLabel && location ? <MetaSep /> : null}
        {location ? (
          <View style={styles.metaInline}>
            <Ionicons name="location-outline" size={14} color={MUTED} />
            <Text style={[styles.metaText, { fontSize, flexShrink: 1 }]}>{location}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function EventPostPublicDescriptionRow({ event, compact }: Props) {
  const [expanded, setExpanded] = useState(false);
  const externalLink = event.externalLink?.trim() || null;
  const trimmed = (event.description ?? '').trim();
  const hasDescription = !!trimmed;

  if (!hasDescription && !externalLink) return null;

  const { text, truncated } = expanded
    ? { text: trimmed, truncated: false }
    : truncateWords(trimmed, EVENT_DESCRIPTION_MAX_WORDS);

  const openLink = () => {
    if (externalLink) Linking.openURL(externalLink).catch(() => {});
  };

  return (
    <View style={[styles.descRow, compact && styles.descRowCompact]}>
      <View style={styles.descCol}>
        {hasDescription ? (
          <Text style={[styles.descText, compact && styles.descTextCompact]}>
            {text}
            {truncated ? (
              <Text style={styles.readMore} onPress={() => setExpanded(true)}>
                {' '}
                Read more
              </Text>
            ) : null}
          </Text>
        ) : null}
      </View>
      {externalLink ? (
        <TouchableOpacity style={[styles.knowMorePill, compact && styles.knowMorePillCompact]} onPress={openLink} activeOpacity={0.85}>
          <Text style={styles.knowMorePillText}>Know more</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function EventPostPublicActionButtons({ event, compact }: Props) {
  if (!eventPostHasActionButtons(event)) return null;
  const buttons = parseEventActionButtonsPublic(event.actionButtons);

  return (
    <View style={[styles.actionsRow, compact && styles.actionsRowCompact]}>
      {buttons.map((b) => (
        <TouchableOpacity
          key={`${b.label}-${b.url}`}
          style={[styles.actionBadge, compact && styles.actionBadgeCompact]}
          onPress={() => Linking.openURL(b.url).catch(() => {})}
          activeOpacity={0.85}
        >
          <Ionicons name="link-outline" size={14} color={TEXT} style={{ opacity: 0.85 }} />
          <Text style={styles.actionBadgeText} numberOfLines={2}>
            {b.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  metaWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 10,
    marginBottom: 8,
  },
  metaWrapCompact: {
    marginTop: 6,
    marginBottom: 6,
  },
  metaLeadIcon: {
    marginTop: 2,
  },
  metaTextRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: TEXT,
    fontWeight: '600',
    lineHeight: 20,
  },
  metaDuration: {
    fontWeight: '400',
    color: MUTED,
    fontSize: 13,
  },
  metaSep: {
    color: DIVIDER,
    fontWeight: '400',
  },
  metaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  descRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  descRowCompact: {
    marginTop: 2,
  },
  descCol: {
    flex: 1,
    minWidth: 0,
  },
  descText: {
    color: '#495057',
    fontSize: 15,
    lineHeight: 22,
  },
  descTextCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  readMore: {
    color: '#0d6efd',
    fontWeight: '500',
  },
  knowMorePill: {
    backgroundColor: '#1a1f2e',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    minWidth: 116,
    alignItems: 'center',
    flexShrink: 0,
  },
  knowMorePillCompact: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    minWidth: 108,
  },
  knowMorePillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    marginBottom: 6,
  },
  actionsRowCompact: {
    marginTop: 8,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 152,
    maxWidth: 184,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f3f5',
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  actionBadgeCompact: {
    minWidth: 140,
    paddingVertical: 9,
  },
  actionBadgeText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
});
