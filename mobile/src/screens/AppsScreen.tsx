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
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getSchoolSocialAccounts, SchoolSocialAccountPublic } from '../services/userSchoolSocial';
import { imageSrc, isImageIconValue } from '../utils/image';
import { ClubMessagingBadges } from '../components/ClubMessagingBadges';
import { ClubGroupChatWidget } from '../components/ClubGroupChatWidget';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';
import { authModalTheme } from '../styles/authModalTheme';
import { MAIN_TAB_BAR_BODY_HEIGHT } from '../navigation/tabBarMetrics';

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

  return (
    <TouchableOpacity
      style={[styles.platformIconBtn, { backgroundColor: `${color}14` }]}
      onPress={() => link && Linking.openURL(link)}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={platformName}
    >
      <FontAwesome5 name={faName} size={15} color={color} brand={useBrand} />
    </TouchableOpacity>
  );
}

export default function AppsScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<SchoolSocialAccountPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const scrollBottomPad = MAIN_TAB_BAR_BODY_HEIGHT + insets.bottom + 16;

  const fetchAccounts = useCallback(async () => {
    if (authLoading) return;
    if (!user?.id) {
      setAccounts([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const list = await getSchoolSocialAccounts();
      setAccounts(Array.isArray(list) ? list : []);
      setError(null);
    } catch {
      setError('Unable to load social accounts right now.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  useFocusEffect(
    useCallback(() => {
      void fetchAccounts();
    }, [fetchAccounts]),
  );

  const groups = useMemo(() => {
    const list = groupAccountsByPage(accounts);
    return list.sort((a, b) => (a.pageName || '').localeCompare(b.pageName || ''));
  }, [accounts]);

  const showSchoolAccounts = !!(user && groups.length > 0);
  const accountsLoading = authLoading || (loading && groups.length === 0);
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

  const schoolTitle = user?.schoolName?.trim() || 'Sembuzz';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAccounts();
    setRefreshing(false);
  }, [fetchAccounts]);

  useEffect(() => {
    if (!user) setSearchQuery('');
  }, [user?.id]);

  const openLogin = () => {
    navigation.navigate('Settings', {
      screen: 'SettingsMain',
      params: { openLogin: true },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a1f2e" />}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Apps</Text>
          <Text style={styles.pageSubtitle}>
            {user
              ? `Clubs, messaging, and social links for ${schoolTitle}.`
              : 'Follow Sembuzz and sign in for your school’s clubs and chats.'}
          </Text>
        </View>

        {!user ? (
          <View style={styles.card}>
            <View style={styles.guestRow}>
              <View style={styles.guestIconCircle}>
                <Ionicons name="school-outline" size={22} color={authModalTheme.primary} />
              </View>
              <Text style={styles.guestText}>
                Sign in to see your school’s club pages, group chats, and social links.
              </Text>
            </View>
            <View style={styles.guestActions}>
              <TouchableOpacity style={styles.btnPrimary} onPress={openLogin} activeOpacity={0.88}>
                <Text style={styles.btnPrimaryText}>Sign in</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnOutline} onPress={openLogin} activeOpacity={0.88}>
                <Text style={styles.btnOutlineText}>Create account</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {user && !accountsLoading ? (
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search clubs or platforms"
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.cardTitle}>Messaging</Text>
          <Text style={styles.cardDesc}>Group chats and direct messages for your school.</Text>
          <ClubMessagingBadges
            isAuthenticated={!!user}
            currentUserId={user?.id}
            onRequireLogin={openLogin}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.cardTitle}>{showSchoolAccounts ? 'School clubs' : 'Follow Sembuzz'}</Text>
          <Text style={styles.cardDesc}>
            {showSchoolAccounts
              ? 'Tap a platform to open your club’s page.'
              : 'Official Sembuzz channels when your school has no links yet.'}
          </Text>

          {user && accountsLoading ? (
            <ActivityIndicator size="small" color={authModalTheme.primary} style={styles.loader} />
          ) : null}

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {user && !accountsLoading && !showSchoolAccounts && !error ? (
            <Text style={styles.emptyText}>No club pages for your school yet.</Text>
          ) : null}

          {showSchoolAccounts ? (
            <>
              {filteredGroups.length === 0 ? (
                <Text style={styles.emptyText}>No clubs match your search.</Text>
              ) : (
                filteredGroups.map((g) => (
                  <View key={g.key} style={styles.clubBlock}>
                    <View style={styles.clubRow}>
                      <View style={styles.clubAvatar}>
                        {isImageIconValue(g.icon) ? (
                          <Image
                            source={{ uri: imageSrc(g.icon) }}
                            style={styles.clubAvatarImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={styles.clubAvatarLetter}>
                            {(g.pageName || 'C').charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={styles.clubTextCol}>
                        <Text style={styles.clubName} numberOfLines={2}>
                          {g.pageName || 'Club'}
                        </Text>
                        <View style={styles.platformRowBelowName}>
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
                    </View>
                  </View>
                ))
              )}
            </>
          ) : !accountsLoading || !user ? (
            <View style={styles.defaultSocialGrid}>
              {DEFAULT_SOCIAL.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.defaultSocialCard, { borderColor: `${s.color}40` }]}
                  onPress={() => Linking.openURL(s.url)}
                  activeOpacity={0.85}
                  accessibilityRole="link"
                  accessibilityLabel={s.label}
                >
                  <FontAwesome5 name={s.icon} size={28} color={s.color} brand />
                  <Text style={styles.defaultSocialLabel}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ClubGroupChatWidget
        visible={!!user}
        isAuthenticated={!!user}
        currentUserId={user?.id}
        onRequireLogin={openLogin}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  pageHeader: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1f2e',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e8ecf0',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  section: {
    width: '100%',
    backgroundColor: 'transparent',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1f2e',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748b',
    marginBottom: 14,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  guestIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: authModalTheme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  guestActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  btnPrimary: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: authModalTheme.pillRadius,
    backgroundColor: '#1a1f2e',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnOutline: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: authModalTheme.pillRadius,
    borderWidth: 1,
    borderColor: '#1a1f2e',
    backgroundColor: '#fff',
  },
  btnOutlineText: {
    color: '#1a1f2e',
    fontSize: 15,
    fontWeight: '600',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1f2e',
    paddingVertical: 10,
  },
  loader: {
    marginVertical: 12,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 8,
  },
  clubBlock: {
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15, 23, 42, 0.08)',
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  clubTextCol: {
    flex: 1,
    minWidth: 0,
  },
  platformRowBelowName: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  clubAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: authModalTheme.loginPanelBg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  clubAvatarImg: {
    width: '100%',
    height: '100%',
  },
  clubAvatarLetter: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  clubName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  platformIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultSocialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  defaultSocialCard: {
    width: '30%',
    minWidth: 96,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#f8fafc',
    gap: 8,
  },
  defaultSocialLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});
