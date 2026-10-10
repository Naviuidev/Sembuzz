import React from 'react';
import { Platform } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

const FONT = Platform.OS === 'ios' ? 'Poppins-SemiBold' : 'Poppins_600SemiBold';

type Props = {
  fontSize?: number;
};

export function BuzzGradientText({ fontSize = 32 }: Props) {
  const height = fontSize * 1.25;
  const width = fontSize * 2.05;
  return (
    <Svg height={height} width={width}>
      <Defs>
        <LinearGradient id="buzzWordGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#4F46E5" />
          <Stop offset="32%" stopColor="#7C3AED" />
          <Stop offset="68%" stopColor="#0EA5E9" />
          <Stop offset="100%" stopColor="#14B8A6" />
        </LinearGradient>
      </Defs>
      <SvgText
        fill="url(#buzzWordGrad)"
        fontSize={fontSize}
        fontFamily={FONT}
        fontWeight="600"
        x={0}
        y={fontSize}
      >
        buzz
      </SvgText>
    </Svg>
  );
}
