import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { imageSrc } from '../utils/image';
import { userNotificationsService } from '../services/userNotifications';
import type { MainTabParamList } from '../navigation/types';
import { TAB_BAR_AVATAR_SIZE, TAB_BAR_SLOT_SIZE } from '../navigation/tabBarMetrics';

/** Matches bottom tab slot + home feed tab pill height. */
const OUTER_SIZE = TAB_BAR_SLOT_SIZE;
const AVATAR_SIZE = TAB_BAR_AVATAR_SIZE;
const GRAD_ID = 'homeHeaderProfileGrad';

type Props = {
  onGuestPress?: () => void;
};

function ProfileGradientDisc() {
  const r = OUTER_SIZE / 2;
  return (
    <Svg width={OUTER_SIZE} height={OUTER_SIZE} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={GRAD_ID} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
          <Stop offset="45%" stopColor="#E8F4FF" stopOpacity="0.95" />
          <Stop offset="100%" stopColor="#E5FAF3" stopOpacity="0.92" />
        </LinearGradient>
      </Defs>
      <Circle
        cx={r}
        cy={r}
        r={r - 0.5}
        fill={`url(#${GRAD_ID})`}
        stroke="rgba(0, 0, 0, 0.08)"
        strokeWidth={1}
      />
    </Svg>
  );
}

export function HomeHeaderProfileButton({ onGuestPress }: Props) {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { user, token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileImgFailed, setProfileImgFailed] = useState(false);
  const [schoolImgFailed, setSchoolImgFailed] = useState(false);

  const profileImageValue = useMemo(
    () => user?.profilePicUrl?.trim() || user?.image?.trim() || '',
    [user?.profilePicUrl, user?.image],
  );

  useEffect(() => {
    setProfileImgFailed(false);
    setSchoolImgFailed(false);
  }, [user?.id, user?.schoolImage, profileImageValue]);

  const refreshUnread = useCallback(async () => {
    if (!user?.id || !token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await userNotificationsService.getUnreadCount();
      setUnreadCount(res.unreadCount || 0);
    } catch {
      /* keep last count */
    }
  }, [user?.id, token]);

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread]);

  const onPress = () => {
    if (!user) {
      onGuestPress?.();
      return;
    }
    navigation.navigate('Settings', { screen: 'SettingsMain' });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.hit}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={user ? 'Profile and settings' : 'Sign in'}
    >
      <View style={styles.outer}>
        <ProfileGradientDisc />
        <View style={styles.avatarWrap}>
          {user && profileImageValue && !profileImgFailed ? (
            <Image
              source={{ uri: imageSrc(profileImageValue) }}
              style={styles.avatar}
              resizeMode="cover"
              onError={() => setProfileImgFailed(true)}
            />
          ) : user && user.schoolImage && !schoolImgFailed ? (
            <Image
              source={{ uri: imageSrc(user.schoolImage) }}
              style={styles.avatar}
              resizeMode="cover"
              onError={() => setSchoolImgFailed(true)}
            />
          ) : user ? (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {(user.schoolName?.trim()?.charAt(0) || user.name?.trim()?.charAt(0) || 'U').toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-outline" size={22} color="#1a1f2e" />
            </View>
          )}
        </View>
        {user && unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignSelf: 'center',
  },
  outer: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1a1f2e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#e9ecef',
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  avatarLetter: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: -1,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#dc3545',
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    zIndex: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
