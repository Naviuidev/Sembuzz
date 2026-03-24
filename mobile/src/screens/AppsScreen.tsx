import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getSchoolSocialAccounts, SchoolSocialAccountPublic } from '../services/userSchoolSocial';
import Link45degIcon from 'react-native-bootstrap-icons/icons/link-45deg';

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  google: '#4285F4',
  instagram: '#E4405F',
  x: '#000000',
  tiktok: '#000000',
  pinterest: '#BD081C',
  whatsapp: '#25D366',
  telegram: '#26A5E4',
  reddit: '#FF4500',
  snapchat: '#FFFC00',
};

/** FontAwesome5 brand icon names (subset aligned with web platform ids). */
const PLATFORM_FA5_BRANDS: Record<string, string> = {
  facebook: 'facebook',
  linkedin: 'linkedin',
  youtube: 'youtube',
  google: 'google',
  instagram: 'instagram',
  x: 'twitter',
  tiktok: 'tiktok',
  pinterest: 'pinterest',
  whatsapp: 'whatsapp',
  telegram: 'telegram',
  reddit: 'reddit',
  snapchat: 'snapchat',
};

const DEFAULT_SOCIAL = [
  {
    key: 'linkedin',
    url: 'https://www.linkedin.com/company/sembuzzsdmlhq/posts/?feedView=all',
    color: '#0a66c2',
    label: 'LinkedIn',
    icon: 'linkedin' as const,
  },
  {
    key: 'facebook',
    url: 'https://www.facebook.com/people/Sembuzzofficial/61555782134710/?ref=1',
    color: '#1877f2',
    label: 'Facebook',
    icon: 'facebook' as const,
  },
  {
    key: 'instagram',
    url: 'https://www.instagram.com/sembuzzofficial?igsh=MWRxaHRldjZ1N3Z2cg==',
    color: '#e4405f',
    label: 'Instagram',
    icon: 'instagram' as const,
  },
];

function groupAccountsByPage(accounts: SchoolSocialAccountPublic[]) {
  const map = new Map<string, SchoolSocialAccountPublic[]>();
  for (const a of accounts) {
    const key = `${a.pageName}|${a.icon}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return Array.from(map.entries()).map(([key, list]) => {
    const first = list[0];
    return { key, pageName: first.pageName, icon: first.icon, accounts: list };
  });
}

function isClubIconUrl(icon: string): boolean {
  return !!icon && (icon.startsWith('http://') || icon.startsWith('https://'));
}

function PlatformIconButton({
  platformId,
  platformName,
  link,
}: {
  platformId: string;
  platformName: string;
  link: string;
}) {
  const color = PLATFORM_COLORS[platformId] ?? '#1a1f2e';
  const faName = PLATFORM_FA5_BRANDS[platformId] ?? 'link';
  const useBrand = faName !== 'link';

  const onPress = () => {
    if (link) Linking.openURL(link);
  };

  return (
    <TouchableOpacity
      style={[styles.platformPill, { backgroundColor: `${color}18` }]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={platformName}
    >
      <FontAwesome5 name={faName} size={22} color={color} brand={useBrand} />
    </TouchableOpacity>
  );
}

function AnimatedTitle({ text }: { text: string }) {
  const letters = useMemo(() => text.split(''), [text]);
  const animatedValues = useMemo(() => letters.map(() => new Animated.Value(0)), [text]);

  useEffect(() => {
    animatedValues.forEach((v) => v.setValue(0));
    Animated.stagger(
      60,
      animatedValues.map((v) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [text, animatedValues]);

  return (
    <View style={styles.titleRow}>
      {letters.map((letter, i) => {
        const opacity = animatedValues[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });
        const translateX = animatedValues[i].interpolate({
          inputRange: [0, 1],
          outputRange: [-6, 0],
        });
        return (
          <Animated.Text
            key={`${text}-${i}`}
            style={[
              styles.letter,
              {
                opacity,
                transform: [{ translateX }],
              },
            ]}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </Animated.Text>
        );
      })}
    </View>
  );
}

export default function AppsScreen() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SchoolSocialAccountPublic[]>([]);
  const [loading, setLoading] = useState(!!user);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getSchoolSocialAccounts();
      setAccounts(list);
      setError(null);
    } catch {
      setAccounts([]);
      setError('Unable to load social accounts right now.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const groups = groupAccountsByPage(accounts);
  const showSchoolAccounts = !!(user && groups.length > 0);
  const displayTitle = user?.schoolName?.trim() || 'Sembuzz';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAccounts();
    setRefreshing(false);
  }, [fetchAccounts]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <AnimatedTitle text={displayTitle} />

        <Text style={styles.followTitle}>Follow us</Text>

        {user && loading ? (
          <ActivityIndicator size="small" color="#1a1f2e" style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {showSchoolAccounts ? (
          groups.map((g) => (
            <View key={g.key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.clubIconWrap}>
                  {isClubIconUrl(g.icon) ? (
                    <Image source={{ uri: g.icon }} style={styles.clubIconImg} resizeMode="contain" />
                  ) : (
                    <Link45degIcon width={22} height={22} fill="#1a1f2e" />
                  )}
                </View>
                <Text style={styles.sectionName}>{g.pageName || 'Club'}</Text>
              </View>
              <View style={styles.linksRow}>
                {g.accounts.map((acc) => (
                  <PlatformIconButton
                    key={acc.id}
                    platformId={acc.platformId}
                    platformName={acc.platformName}
                    link={acc.link}
                  />
                ))}
              </View>
            </View>
          ))
        ) : !loading || !user ? (
          <View style={styles.defaultSocialRow}>
            {DEFAULT_SOCIAL.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={styles.defaultSocialBtn}
                onPress={() => Linking.openURL(s.url)}
                activeOpacity={0.85}
                accessibilityRole="link"
                accessibilityLabel={s.label}
              >
                <FontAwesome5 name={s.icon} size={32} color={s.color} brand />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={styles.footerHint}>
          {showSchoolAccounts ? "Your school's social accounts." : 'Connect with us on social media.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
    alignItems: 'center',
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
    maxWidth: 600,
  },
  letter: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  followTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1f2e',
    textAlign: 'center',
    marginBottom: 20,
    width: '100%',
  },
  loader: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  clubIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  clubIconImg: {
    width: '100%',
    height: '100%',
  },
  sectionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  platformPill: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultSocialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    marginTop: 4,
    maxWidth: 600,
  },
  defaultSocialBtn: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  footerHint: {
    fontSize: 13,
    color: '#8e8e8e',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#842029',
    backgroundColor: '#f8d7da',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
});
