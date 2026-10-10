import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import type { ApprovedEventPublic } from '../services/events';
import { imageSrc } from '../utils/image';
import { parseImageUrls } from '../services/publicBlogs';
import { parseEventActionButtonsPublic } from '../utils/eventPostPublic';
import { feedActionPillColors } from '../utils/feedActionPills';
import { SchoolLogo } from './SchoolLogo';
import { EventPostPublicMeta } from './EventPostPublicContent';
import { formatPostedDateDisplay, getPostedDateIso } from '../utils/formatRelativeTime';

const FEED_HERO_HEIGHT = 240;

type Props = {
  event: ApprovedEventPublic;
};

export function FeedStyleEventPostFull({ event }: Props) {
  const images = event.imageUrls ? parseImageUrls(event.imageUrls) : [];
  const firstImage = images[0];
  const schoolHeroImg = event.school?.image?.trim();
  const heroFallbackLogoSize = Math.min(128, Math.round(FEED_HERO_HEIGHT * 0.4));
  const actionButtons = parseEventActionButtonsPublic(event.actionButtons);
  const description = (event.description ?? '').trim();
  const postedDisplay = formatPostedDateDisplay(getPostedDateIso(event));

  return (
    <View style={styles.root}>
      <View style={styles.heroWrap}>
        {firstImage ? (
          <Image
            source={{ uri: imageSrc(firstImage) }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : schoolHeroImg ? (
          <Image source={{ uri: imageSrc(schoolHeroImg) }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <SchoolLogo school={event.school} size={heroFallbackLogoSize} borderRadius={16} />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.schoolRow}>
          <SchoolLogo school={event.school} size={28} borderRadius={6} />
          <Text style={styles.schoolName} numberOfLines={1}>
            {event.school?.name ?? 'School'}
          </Text>
        </View>

        <Text style={styles.headline}>{event.title}</Text>

        <View style={styles.postFieldsSection}>
          <EventPostPublicMeta event={event} compact metaChips />
          {description ? <Text style={styles.description}>{description}</Text> : null}
          {actionButtons.length > 0 ? (
            <View style={styles.actionRow}>
              {actionButtons.map((b, index) => {
                const colors = feedActionPillColors(b.label, index);
                return (
                  <TouchableOpacity
                    key={`${b.label}-${b.url}`}
                    style={[styles.actionPill, { backgroundColor: colors.bg }]}
                    onPress={() => Linking.openURL(b.url).catch(() => {})}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.actionPillText, { color: colors.text }]} numberOfLines={2}>
                      {b.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
          {postedDisplay ? <Text style={styles.postedDateText}>{postedDisplay}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  heroWrap: {
    width: '100%',
    height: FEED_HERO_HEIGHT,
    backgroundColor: '#eef2f7',
  },
  heroImage: {
    width: '100%',
    height: FEED_HERO_HEIGHT,
  },
  heroPlaceholder: {
    width: '100%',
    height: FEED_HERO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2f7',
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    gap: 12,
  },
  schoolName: {
    flex: 1,
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
  headline: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 8,
  },
  postFieldsSection: {
    marginTop: 6,
    gap: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748b',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  actionPill: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    maxWidth: '100%',
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  postedDateText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 20,
  },
});
