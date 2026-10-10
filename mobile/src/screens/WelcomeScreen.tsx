import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const POPPINS_SEMIBOLD = Platform.OS === 'ios' ? 'Poppins-SemiBold' : 'Poppins_600SemiBold';

const WATERMARK_WORD = 'Sembuzz';
const WATERMARK_SLIDE_DURATION_MS = 32000;
const WATERMARK_VISIBLE_OPACITY = 0.36;
const PAGE_HORIZONTAL_PADDING = 28;

const WELCOME_HERO_IMAGE_URI =
  'https://thumbs.dreamstime.com/b/vertical-shot-young-group-teenage-student-people-having-fun-using-mobile-phone-together-outdoors-multiracial-friends-344613381.jpg';

function glassyWordTextProps(fontSize: number, textX: number, baselineY: number) {
  return {
    x: textX,
    y: baselineY,
    textAnchor: 'start' as const,
    fontSize,
    fontFamily: POPPINS_SEMIBOLD,
    fontWeight: '600' as const,
    letterSpacing: -fontSize * 0.04,
  };
}

function GlassyBrandWatermark({ fontSize, width }: { fontSize: number; width: number }) {
  const height = fontSize * 1.18;
  const baselineY = fontSize * 0.92;
  const textX = fontSize * 0.04;
  const wordProps = glassyWordTextProps(fontSize, textX, baselineY);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="glassWordFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.42" />
          <Stop offset="45%" stopColor="#EEF2FF" stopOpacity="0.22" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.32" />
        </LinearGradient>
        <LinearGradient id="glassWordSheen" x1="12%" y1="0%" x2="88%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.28" />
        </LinearGradient>
      </Defs>
      <SvgText
        {...wordProps}
        fill="url(#glassWordFill)"
        stroke="rgba(0, 0, 0, 0.79)"
        strokeWidth={fontSize * 0.006}
        strokeLinejoin="round"
      >
        {WATERMARK_WORD}
      </SvgText>
      <SvgText {...wordProps} fill="url(#glassWordSheen)" opacity={0.45}>
        {WATERMARK_WORD}
      </SvgText>
    </Svg>
  );
}

/** Approximate rendered width so slide starts with “S” at the right screen edge. */
function estimateWatermarkWordWidth(fontSize: number) {
  return fontSize * 4.62;
}

type Props = {
  onLayoutReady?: () => void;
  onLogin: () => void;
  onSignUp: () => void;
  onContinueAsGuest: () => void;
};

function HeroPhotoScrim() {
  const { width, height } = useWindowDimensions();
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Defs>
        <LinearGradient id="heroScrim" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#000000" stopOpacity="0.38" />
          <Stop offset="55%" stopColor="#000000" stopOpacity="0.48" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#heroScrim)" />
    </Svg>
  );
}

export function WelcomeScreen({ onLayoutReady, onLogin, onSignUp, onContinueAsGuest }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();

  const enter = useRef(new Animated.Value(0)).current;
  const watermarkEnter = useRef(new Animated.Value(0)).current;
  const loginScale = useRef(new Animated.Value(1)).current;
  const signUpScale = useRef(new Animated.Value(1)).current;
  const watermarkFontSize = Math.max(screenW * 0.62, 168);
  const watermarkTextX = watermarkFontSize * 0.04;
  const watermarkWordWidth = estimateWatermarkWordWidth(watermarkFontSize);
  const watermarkSvgWidth = watermarkWordWidth + watermarkTextX + watermarkFontSize * 0.15;
  const watermarkBandHeight = watermarkFontSize * 1.2;
  const watermarkSlideStartX = screenW - watermarkFontSize * 0.58 - watermarkTextX;
  const watermarkSlideEndX = screenW - watermarkWordWidth - watermarkTextX - 12;

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    Animated.timing(enter, { toValue: 1, duration: 420, easing: ease, useNativeDriver: true }).start();

    const slideLoop = Animated.loop(
      Animated.timing(watermarkEnter, {
        toValue: 1,
        duration: WATERMARK_SLIDE_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    slideLoop.start();
    return () => slideLoop.stop();
  }, [enter, watermarkEnter]);

  const opacity = enter;
  const watermarkSlideX = watermarkEnter.interpolate({
    inputRange: [0, 1],
    outputRange: [watermarkSlideStartX, watermarkSlideEndX],
  });
  return (
    <View style={styles.root} onLayout={onLayoutReady}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <Image
        source={{ uri: WELCOME_HERO_IMAGE_URI }}
        style={styles.heroBgImage}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        {...(Platform.OS === 'android' ? { fadeDuration: 0 } : {})}
      />
      <HeroPhotoScrim />

      <Animated.View
        pointerEvents="none"
        accessible={false}
        style={[
          styles.watermarkLayer,
          {
            top: insets.top + 6,
            height: watermarkBandHeight,
            opacity: WATERMARK_VISIBLE_OPACITY,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ translateX: watermarkSlideX }] }}>
          <GlassyBrandWatermark fontSize={watermarkFontSize} width={watermarkSvgWidth} />
        </Animated.View>
      </Animated.View>

      <View
        style={[
          styles.page,
          {
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Animated.View style={[styles.actionsWrap, { opacity }]}>
          <View style={styles.pillRow}>
            <Pressable
              onPress={onLogin}
              onPressIn={() => {
                Animated.spring(loginScale, { toValue: 0.97, friction: 8, useNativeDriver: true }).start();
              }}
              onPressOut={() => {
                Animated.spring(loginScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
              }}
              accessibilityRole="button"
              accessibilityLabel="Log in"
              style={({ pressed }) => [styles.pillHalf, pressed && styles.pillPressed]}
            >
              <Animated.View style={[styles.loginPill, { transform: [{ scale: loginScale }] }]}>
                <Text style={styles.loginPillLabel}>Login</Text>
              </Animated.View>
            </Pressable>

            <Pressable
              onPress={onSignUp}
              onPressIn={() => {
                Animated.spring(signUpScale, { toValue: 0.97, friction: 8, useNativeDriver: true }).start();
              }}
              onPressOut={() => {
                Animated.spring(signUpScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
              }}
              accessibilityRole="button"
              accessibilityLabel="Sign up"
              style={({ pressed }) => [styles.pillHalf, pressed && styles.pillPressed]}
            >
              <Animated.View style={[styles.signUpPill, { transform: [{ scale: signUpScale }] }]}>
                <Text style={styles.signUpPillLabel}>Sign up</Text>
              </Animated.View>
            </Pressable>
          </View>

          <Pressable
            onPress={onContinueAsGuest}
            accessibilityRole="button"
            accessibilityLabel="Continue as guest"
            style={({ pressed }) => [styles.guestBtn, pressed && styles.guestBtnPressed]}
          >
            <Text style={styles.guestBtnLabel}>Continue as guest</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  heroBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  page: {
    flex: 1,
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  actionsWrap: {
    width: '100%',
    zIndex: 2,
    gap: 14,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  pillHalf: {
    flex: 1,
  },
  pillPressed: {
    opacity: 0.92,
  },
  watermarkLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    zIndex: 3,
  },
  loginPill: {
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginPillLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  signUpPill: {
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  signUpPillLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#111827',
    letterSpacing: 0.2,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  guestBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  guestBtnPressed: {
    opacity: 0.75,
  },
  guestBtnLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    letterSpacing: 0.15,
    textDecorationLine: 'underline',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
});
