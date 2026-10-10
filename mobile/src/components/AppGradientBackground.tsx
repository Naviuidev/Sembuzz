import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Full-screen pastel glass gradient used behind main app content. */
export function AppGradientBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <Svg width={width} height={height} style={styles.layer} pointerEvents="none">
      <Defs>
        <LinearGradient id="appGlassBase" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E8E2FF" />
          <Stop offset="28%" stopColor="#E3F0FF" />
          <Stop offset="55%" stopColor="#FFF4E8" />
          <Stop offset="100%" stopColor="#E5FAF3" />
        </LinearGradient>
        <LinearGradient id="appGlassSheen" x1="12%" y1="0%" x2="88%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <Stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.06" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.28" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#appGlassBase)" />
      <Rect x={0} y={0} width={width} height={height} fill="url(#appGlassSheen)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
