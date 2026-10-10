import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const STOPS = [
  { offset: '0%', color: '#D9D0FF' },
  { offset: '32%', color: '#D7E9FF' },
  { offset: '62%', color: '#DDFBF2' },
  { offset: '100%', color: '#D9F7F8' },
] as const;

export function SplashBackground() {
  const { width, height } = useWindowDimensions();
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Defs>
        <LinearGradient id="splashMesh" x1="0%" y1="0%" x2="100%" y2="100%">
          {STOPS.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </LinearGradient>
        <LinearGradient id="splashMesh2" x1="100%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#D9D0FF" stopOpacity={0.45} />
          <Stop offset="50%" stopColor="#D7E9FF" stopOpacity={0} />
          <Stop offset="100%" stopColor="#DDFBF2" stopOpacity={0.35} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#splashMesh)" />
      <Rect x={0} y={0} width={width} height={height} fill="url(#splashMesh2)" />
    </Svg>
  );
}
