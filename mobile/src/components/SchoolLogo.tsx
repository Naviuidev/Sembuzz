import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { imageSrc } from '../utils/image';

type SchoolLogoProps = {
  school?: { name?: string | null; image?: string | null } | null;
  size?: number;
  borderRadius?: number;
  style?: ViewStyle;
  letterStyle?: TextStyle;
};

/** School avatar for posts/feeds — matches web `imageSrc(event.school.image)` with letter fallback on missing/failed load. */
export function SchoolLogo({
  school,
  size = 28,
  borderRadius = 6,
  style,
  letterStyle,
}: SchoolLogoProps) {
  const [imageError, setImageError] = useState(false);
  const rawImage = typeof school?.image === 'string' ? school.image.trim() : '';
  const logoUrl = rawImage && !imageError ? imageSrc(rawImage) : '';
  const letter = school?.name?.trim()?.charAt(0)?.toUpperCase() ?? '?';

  useEffect(() => {
    setImageError(false);
  }, [rawImage]);

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius },
        style,
      ]}
    >
      {logoUrl ? (
        <Image
          source={{ uri: logoUrl }}
          style={{ width: size, height: size, borderRadius }}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <Text style={[styles.letter, { fontSize: Math.max(11, Math.round(size * 0.5)) }, letterStyle]}>
          {letter}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  letter: {
    color: '#475569',
    fontWeight: '700',
  },
});
