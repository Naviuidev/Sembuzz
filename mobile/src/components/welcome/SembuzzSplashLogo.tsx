import React from 'react';
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

type Props = {
  size?: number;
};

/** Glossy 3D-style gradient letter S (brand mark only). */
export function SembuzzSplashLogo({ size = 104 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="SemBuzz">
      <Defs>
        <LinearGradient id="sBody" x1="20%" y1="5%" x2="85%" y2="95%">
          <Stop offset="0%" stopColor="#C4B5FD" />
          <Stop offset="28%" stopColor="#7C3AED" />
          <Stop offset="58%" stopColor="#3B82F6" />
          <Stop offset="100%" stopColor="#2DD4BF" />
        </LinearGradient>
        <LinearGradient id="sInner" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#312E81" stopOpacity="0.25" />
          <Stop offset="100%" stopColor="#0F766E" stopOpacity="0.08" />
        </LinearGradient>
        <LinearGradient id="sGloss" x1="25%" y1="0%" x2="75%" y2="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      <Ellipse cx="50" cy="91" rx="28" ry="5" fill="#6366F1" opacity={0.14} />

      <G>
        <Path
          d="M72 26C58 14 36 16 28 34C22 48 30 60 44 64C32 68 24 80 32 92C42 106 66 104 76 88C86 72 80 54 64 48C78 42 84 28 72 26Z"
          fill="#4338CA"
          opacity={0.2}
          transform="translate(2, 3)"
        />
        <Path
          d="M70 24C56 12 34 14 26 32C20 46 28 58 42 62C30 66 22 78 30 90C40 104 64 102 74 86C84 70 78 52 62 46C76 40 82 26 70 24Z"
          fill="url(#sBody)"
        />
        <Path
          d="M70 24C56 12 34 14 26 32C20 46 28 58 42 62C30 66 22 78 30 90C40 104 64 102 74 86C84 70 78 52 62 46C76 40 82 26 70 24Z"
          fill="url(#sInner)"
        />
        <Path
          d="M64 28C52 18 38 20 32 34C28 44 34 52 44 56C38 58 34 66 40 74C48 84 62 82 68 72C74 62 70 50 58 46C66 42 70 34 64 28Z"
          fill="url(#sGloss)"
        />
        <Path
          d="M70 24C56 12 34 14 26 32C20 46 28 58 42 62C30 66 22 78 30 90C40 104 64 102 74 86C84 70 78 52 62 46C76 40 82 26 70 24Z"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.45}
          strokeWidth={1}
        />
      </G>
    </Svg>
  );
}
