import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getSchoolSocialAccounts, SchoolSocialAccountPublic } from '../services/userSchoolSocial';
import Link45degIcon from 'react-native-bootstrap-icons/icons/link-45deg';
import { imageSrc, isImageIconValue } from '../utils/image';

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
  linktree: '#43E660',
  weebly: '#1cb0a1',
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
  /** FA5 solid “link” — Linktree has no stable FA5 brand glyph in all builds */
  linktree: 'link',
  weebly: 'weebly',
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
  const navigation = useNavigation();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SchoolSocialAccountPublic[]>([]);
  const [loading, setLoading] = useState(!!user);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => {
      const inName = (g.pageName || '').toLowerCase().includes(q);
      const inPlatforms = g.accounts.some(
        (acc) =>
          (acc.platformName || '').toLowerCase().includes(q) ||
          (acc.platformId || '').toLowerCase().includes(q),
      );
      return inName || inPlatforms;
    });
  }, [groups, searchQuery]);
  const displayTitle = user?.schoolName?.trim() || 'Sembuzz';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAccounts();
    setRefreshing(false);
  }, [fetchAccounts]);

  useEffect(() => {
    if (!user) setSearchQuery('');
  }, [user?.id]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {!user ? (
          <View style={styles.authPromptCard}>
            <View style={styles.authPromptTopRow}>
              <View style={styles.authPromptIconWrap}>
                <FontAwesome5 name="user" size={14} color="#6c757d" />
              </View>
              <Text style={styles.authPromptDesc}>Sign up to filter by your school and get personalized social links.</Text>
            </View>
            <View style={styles.authPromptActions}>
              <TouchableOpacity
                style={styles.authLoginBtn}
                onPress={() => (navigation as { navigate: (name: string) => void }).navigate('Settings')}
                activeOpacity={0.85}
              >
                <FontAwesome5 name="sign-in-alt" size={13} color="#fff" />
                <Text style={styles.authLoginBtnText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.authSignupBtn}
                onPress={() => (navigation as { navigate: (name: string) => void }).navigate('Settings')}
                activeOpacity={0.85}
              >
                <FontAwesome5 name="user-plus" size={13} color="#1a1f2e" />
                <Text style={styles.authSignupBtnText}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {user && !loading ? (
          <View style={styles.searchWrap}>
            <FontAwesome5 name="search" size={14} color="#6c757d" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search clubs"
              placeholderTextColor="#8e8e8e"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ) : null}

        <View style={[styles.mainContentWrap, !showSchoolAccounts && !loading ? styles.mainContentCentered : null]}>
          <AnimatedTitle text={displayTitle} />

          <Text style={styles.followTitle}>Follow us</Text>

          {user && loading ? (
            <ActivityIndicator size="small" color="#1a1f2e" style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {showSchoolAccounts ? (
            <>
              {filteredGroups.length === 0 ? (
                <Text style={styles.emptySearchText}>No matching groups found.</Text>
              ) : null}
              {filteredGroups.map((g) => (
              <View key={g.key} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.clubIconWrap}>
                    {isImageIconValue(g.icon) ? (
                      <Image source={{ uri: imageSrc(g.icon) }} style={styles.clubIconImg} resizeMode="contain" />
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
              ))}
            </>
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
        </View>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
    alignItems: 'center',
    width: '100%',
  },
  mainContentWrap: {
    width: '100%',
    alignItems: 'center',
  },
  mainContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 24,
  },
  authPromptCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8edf5',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  authPromptTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 14,
  },
  authPromptIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#f1f4f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authPromptDesc: {
    fontSize: 13,
    color: '#1a1f2e',
    lineHeight: 17,
    flex: 1,
  },
  authPromptActions: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 44,
  },
  authLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 118,
    gap: 8,
  },
  authLoginBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  authSignupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1a1f2e',
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 118,
    gap: 8,
  },
  authSignupBtnText: {
    color: '#1a1f2e',
    fontSize: 15,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
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
    alignSelf: 'center',
    marginBottom: 20,
    width: '100%',
  },
  loader: {
    marginVertical: 16,
  },
  searchWrap: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    minHeight: 50,
    paddingVertical: 12,
    marginBottom: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1f2e',
    paddingVertical: 0,
  },
  emptySearchText: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 12,
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
    alignSelf: 'center',
    width: '100%',
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
    alignSelf: 'center',
    marginTop: 16,
    width: '100%',
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
