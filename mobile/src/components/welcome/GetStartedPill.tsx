import React from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const PURPLE = '#7C3AED';
const TEAL = '#14B8A6';

type Props = {
  width: number;
  scale: Animated.Value;
  onPress: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
};

export function GetStartedPill({ width, scale, onPress, onPressIn, onPressOut }: Props) {
  const height = 56;
  const radius = height / 2;

  return (
    <Animated.View style={{ width, transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel="Get started"
        style={({ pressed }) => [styles.wrap, { height, borderRadius: radius }, pressed && styles.pressed]}
      >
        <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="pillGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <Stop offset="0%" stopColor={PURPLE} />
              <Stop offset="45%" stopColor="#6366F1" />
              <Stop offset="100%" stopColor={TEAL} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={height} rx={radius} fill="url(#pillGrad)" />
        </Svg>
        <View style={styles.row}>
          <Text style={styles.label}>Get Started</Text>
          <View style={styles.arrowCircle}>
            <Ionicons name="arrow-forward" size={18} color="#0EA5E9" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    justifyContent: 'center',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  pressed: {
    opacity: 0.94,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    height: 56,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    marginLeft: 36,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.2,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
