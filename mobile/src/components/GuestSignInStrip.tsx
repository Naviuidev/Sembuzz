import React, { useCallback, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type Props = {
  onSignInPress: () => void;
};

type CardSize = { width: number; height: number };

function GlassyStripBackground({ width, height }: CardSize) {
  if (width <= 0 || height <= 0) return null;

  const pillRadius = height / 2;

  return (
    <Svg
      width={width}
      height={height}
      style={styles.gradientLayer}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="signInGlassBase" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E8E2FF" />
          <Stop offset="30%" stopColor="#E3F0FF" />
          <Stop offset="58%" stopColor="#FFF0E3" />
          <Stop offset="100%" stopColor="#E5FAF3" />
        </LinearGradient>
        <LinearGradient id="signInGlassSheen" x1="18%" y1="0%" x2="82%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <Stop offset="42%" stopColor="#FFFFFF" stopOpacity="0.12" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.5" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} rx={pillRadius} ry={pillRadius} fill="url(#signInGlassBase)" />
      <Rect x={0} y={0} width={width} height={height} rx={pillRadius} ry={pillRadius} fill="url(#signInGlassSheen)" />
    </Svg>
  );
}

export function GuestSignInStrip({ onSignInPress }: Props) {
  const [cardSize, setCardSize] = useState<CardSize>({ width: 0, height: 0 });

  const onBannerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCardSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
  }, []);

  return (
    <View style={styles.shadowWrap}>
      <View style={styles.banner} onLayout={onBannerLayout}>
        <GlassyStripBackground width={cardSize.width} height={cardSize.height} />
        <Ionicons name="information-circle" size={16} color="#997404" style={styles.icon} />
        <Text style={styles.message}>Sign in to customize your school feed</Text>
        <TouchableOpacity
          onPress={onSignInPress}
          hitSlop={6}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          style={styles.signInBadge}
        >
          <Text style={styles.signInBadgeLabel}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 4,
    borderRadius: 999,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    backgroundColor: 'transparent',
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  icon: {
    flexShrink: 0,
    zIndex: 1,
  },
  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#664d03',
    zIndex: 1,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  signInBadge: {
    flexShrink: 0,
    zIndex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#DDFBE2',
    borderWidth: 1,
    borderColor: '#B8E6C0',
  },
  signInBadgeLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: '#166534',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
});
