import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { authModalTheme } from '../../styles/authModalTheme';

const GRAD_ID = 'signUpModalGrad';

/** Success-light → primary-light diagonal fill for the signup modal card. */
export function SignUpModalGradient() {
  const [successLight, mid, primaryLight] = authModalTheme.signUpGradientStops;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={GRAD_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={successLight} />
            <Stop offset="48%" stopColor={mid} />
            <Stop offset="100%" stopColor={primaryLight} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${GRAD_ID})`} />
      </Svg>
    </View>
  );
}
