import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  Image,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PersonPlusIcon from 'react-native-bootstrap-icons/icons/person-plus';
import { FontAwesome5 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, SettingsStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { getApprovedEvents, imageSrc, ApprovedEventPublic } from '../services/events';
import { getFrontendBaseUrl } from '../config/env';
import { userHelpService, type UserHelpQueryItem } from '../services/userHelp';
import { userNotificationsService } from '../services/userNotifications';
import SignUpModal from '../components/SignUpModal';
import { UserForgotPasswordPanel } from '../components/UserForgotPasswordPanel';
import Svg, { Circle } from 'react-native-svg';
import { UserBookmarkedEventDetailModal } from '../components/UserBookmarkedEventDetail';

const BASE_URL = getFrontendBaseUrl();

/** Gradient ring + inner circle — makes the avatar read clearly as a tappable control. */
const PROFILE_AVATAR_RING = 64;
const PROFILE_AVATAR_STROKE = 3;
const PROFILE_AVATAR_INNER = 52;
/** Circle radius (stroke is centered on this path). */
const PROFILE_AVATAR_R = PROFILE_AVATAR_RING / 2 - PROFILE_AVATAR_STROKE / 2;

function getEventThumbUrl(ev: ApprovedEventPublic): string {
  const rawImageUrls = typeof ev.imageUrls === 'string' ? ev.imageUrls : '';
  if (rawImageUrls) {
    try {
      const parsed = JSON.parse(rawImageUrls);
      if (Array.isArray(parsed)) {
        const first = parsed.find((u): u is string => typeof u === 'string' && u.trim().length > 0);
        if (first) return imageSrc(first);
      }
    } catch {
      // Ignore malformed JSON and fallback.
    }
  }
  return ev.school?.image ? imageSrc(ev.school.image) : '';
}

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'SettingsMain'>>();
  const route = useRoute<RouteProp<SettingsStackParamList, 'SettingsMain'>>();
  const { user, login, logout, loading: authLoading } = useAuth();

  /** Root stack screens (Liked/Saved/Profile) — Settings lives in a nested stack under the tab. */
  const navigateRoot = useCallback(
    <K extends keyof RootStackParamList>(name: K) => {
      const tab = navigation.getParent();
      const root = tab?.getParent?.();
      if (root && typeof (root as { navigate?: unknown }).navigate === 'function') {
        (root as { navigate: (n: K) => void }).navigate(name);
      }
    },
    [navigation],
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<ApprovedEventPublic[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalView, setLoginModalView] = useState<'login' | 'forgot'>('login');
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [loginInfoMessage, setLoginInfoMessage] = useState<string | null>(null);
  const [profileImageFailed, setProfileImageFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) return;
      if (route.params?.openLogin) {
        setLoginInfoMessage(null);
        setLoginModalView('login');
        setShowLoginModal(true);
        navigation.setParams({});
      } else if (route.params?.openSignUp) {
        setShowSignUpModal(true);
        navigation.setParams({});
      }
    }, [user, route.params?.openLogin, route.params?.openSignUp, navigation]),
  );

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSubmitLoading, setHelpSubmitLoading] = useState(false);
  const [helpError, setHelpError] = useState<string | null>(null);
  const [helpQueries, setHelpQueries] = useState<UserHelpQueryItem[]>([]);
  const [helpQueriesLoading, setHelpQueriesLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [selectedRecentEvent, setSelectedRecentEvent] = useState<ApprovedEventPublic | null>(null);
  const [showRecentNewsList, setShowRecentNewsList] = useState(false);

  /** Settings header = user photo only (school logo stays on bottom tab). */
  const profileImageUrl = useMemo(() => {
    const raw = user?.profilePicUrl?.trim() || user?.image?.trim() || '';
    return raw ? imageSrc(raw) : '';
  }, [user]);

  useEffect(() => {
    setProfileImageFailed(false);
  }, [profileImageUrl, user?.id]);

  const fetchRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const list = await getApprovedEvents(undefined, undefined);
      const sorted = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setRecentEvents(sorted.slice(0, 10));
      setRecentError(null);
    } catch {
      setRecentEvents([]);
      setRecentError('Unable to load recent news right now.');
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user?.id) {
        setUnreadCount(0);
        return () => {
          active = false;
        };
      }
      void userNotificationsService
        .getUnreadCount()
        .then((r) => {
          if (active) setUnreadCount(r.unreadCount || 0);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [user?.id]),
  );

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Enter email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      setShowLoginModal(false);
      setLoginInfoMessage(null);
      setPassword('');
      const tabNav = navigation.getParent();
      if (tabNav && typeof (tabNav as { navigate?: unknown }).navigate === 'function') {
        (tabNav as { navigate: (name: string) => void }).navigate('Events');
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Login failed.';
      setError(typeof msg === 'string' ? msg : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const confirmLogout = useCallback(async () => {
    setShowLogoutConfirmModal(false);
    setShowLoginModal(false);
    setLoginInfoMessage(null);
    await logout();
    const tabNav = navigation.getParent();
    if (tabNav && typeof (tabNav as { navigate?: unknown }).navigate === 'function') {
      (tabNav as { navigate: (name: string) => void }).navigate('Events');
    }
  }, [logout, navigation]);

  const loadHelpQueries = useCallback(async () => {
    setHelpQueriesLoading(true);
    try {
      const list = await userHelpService.getMyQueries();
      setHelpQueries(Array.isArray(list) ? list : []);
    } catch {
      setHelpQueries([]);
    } finally {
      setHelpQueriesLoading(false);
    }
  }, []);

  const openHelpModal = useCallback(() => {
    setHelpMessage('');
    setHelpError(null);
    setShowHelpModal(true);
    void loadHelpQueries();
  }, [loadHelpQueries]);

  const submitHelpQuery = useCallback(async () => {
    const text = helpMessage.trim();
    if (!text) return;
    setHelpSubmitLoading(true);
    setHelpError(null);
    try {
      await userHelpService.create(text);
      setHelpMessage('');
      setShowHelpModal(false);
      Alert.alert('Sent', 'Your school admin will see your query in the Users help section.');
      void loadHelpQueries();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setHelpError(typeof msg === 'string' ? msg : 'Failed to submit. Try again.');
    } finally {
      setHelpSubmitLoading(false);
    }
  }, [helpMessage, loadHelpQueries]);

  const handleActionPress = useCallback((action: 'categories' | 'liked' | 'notifications' | 'saved' | 'help') => {
    if (action === 'categories') {
      if (!user?.schoolId) {
        Alert.alert('School required', 'Your account must be linked to a school to change categories.');
        return;
      }
      navigation.navigate('ChangeCategories' as never);
      return;
    }
    if (action === 'liked') {
      navigateRoot('LikedNews');
      return;
    }
    if (action === 'saved') {
      navigateRoot('SavedNews');
      return;
    }
    if (action === 'notifications') {
      navigateRoot('Notifications');
      return;
    }
    if (action === 'help') {
      openHelpModal();
      return;
    }
  }, [user?.schoolId, navigation, navigateRoot, openHelpModal]);

  const openRecentNews = useCallback(
    (ev: ApprovedEventPublic) => {
      setSelectedRecentEvent(ev);
    },
    [],
  );

  const settingsActions = useMemo(
    () => [
      {
        key: 'categories' as const,
        title: 'Change categories',
        subtitle: 'Update your preferred categories and subcategories.',
        icon: 'folder-outline' as const,
      },
      {
        key: 'liked' as const,
        title: 'Liked posts',
        subtitle: 'Review news posts you have liked.',
        icon: 'heart-outline' as const,
      },
      {
        key: 'notifications' as const,
        title: 'Notifications',
        subtitle: 'Review updates for your selected categories.',
        icon: 'notifications-outline' as const,
        badge: unreadCount,
      },
      {
        key: 'saved' as const,
        title: 'Bookmarks',
        subtitle: 'Open your saved news collection.',
        icon: 'bookmark-outline' as const,
      },
      {
        key: 'help' as const,
        title: 'Feedback/Query/Ask your School Admin',
        subtitle: 'Send feedback or ask questions directly to your school admin.',
        icon: 'help-circle-outline' as const,
      },
    ],
    [unreadCount],
  );

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a1f2e" />
        </View>
      </SafeAreaView>
    );
  }

  if (user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileRow}>
            <TouchableOpacity
              onPress={() => navigateRoot('Profile')}
              activeOpacity={0.85}
              accessibilityLabel="Open profile screen"
              accessibilityRole="button"
              style={styles.avatarRingTouchable}
            >
              <View style={styles.avatarRingOuter}>
                <Svg
                  width={PROFILE_AVATAR_RING}
                  height={PROFILE_AVATAR_RING}
                  style={styles.avatarRingSvg}
                >
                  <Circle
                    cx={PROFILE_AVATAR_RING / 2}
                    cy={PROFILE_AVATAR_RING / 2}
                    r={PROFILE_AVATAR_R}
                    stroke="#0b4a99"
                    strokeWidth={PROFILE_AVATAR_STROKE}
                    fill="none"
                  />
                </Svg>
                {profileImageUrl && !profileImageFailed ? (
                  <Image
                    key={profileImageUrl}
                    source={{ uri: profileImageUrl }}
                    style={styles.avatarImageInner}
                    onError={() => {
                      if (__DEV__) {
                        console.warn('[SettingsScreen] profile image failed', profileImageUrl);
                      }
                      setProfileImageFailed(true);
                    }}
                  />
                ) : (
                  <View style={styles.avatarPlaceholderInner}>
                    <Text style={styles.avatarLetter}>{user.name?.charAt(0) ?? '?'}</Text>
                  </View>
                )}
                <View style={styles.avatarOnlineBadge} />
              </View>
            </TouchableOpacity>
            <View style={styles.profileText}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.name ?? 'User'}
                </Text>
                <TouchableOpacity
                  style={styles.logoutHeaderBtn}
                  onPress={() => setShowLogoutConfirmModal(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Log out"
                  accessibilityRole="button"
                >
                  <Ionicons name="log-out-outline" size={22} color="#1a1f2e" />
                </TouchableOpacity>
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
              {user.userId ? (
                <Text style={styles.userId}>User ID: {user.userId}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.actionListCard}>
            {settingsActions.map((item, index) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.actionListItem, index < settingsActions.length - 1 && styles.actionListItemDivider]}
                onPress={() => handleActionPress(item.key)}
                activeOpacity={0.85}
              >
                <View style={styles.actionListLeft}>
                  <View style={styles.actionListIconWrap}>
                    <Ionicons name={item.icon} size={18} color="#1a1f2e" />
                    {item.key === 'notifications' && (item.badge ?? 0) > 0 ? (
                      <View style={styles.actionNotifBadgeBlack}>
                        <Text style={styles.actionNotifBadgeText}>{(item.badge ?? 0) > 99 ? '99+' : item.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.actionListTextWrap}>
                    <Text style={styles.actionListTitle}>{item.title}</Text>
                    <Text style={styles.actionListSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8e8e8e" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionDivider} />
          <View style={styles.actionListCard}>
            <TouchableOpacity
              style={styles.actionListItem}
              onPress={() => setShowRecentNewsList((v) => !v)}
              activeOpacity={0.85}
            >
              <View style={styles.actionListLeft}>
                <View style={styles.actionListIconWrap}>
                  <Ionicons name="newspaper-outline" size={18} color="#1a1f2e" />
                </View>
                <View style={styles.actionListTextWrap}>
                  <Text style={styles.actionListTitle}>Recently added schools / news</Text>
                  <Text style={styles.actionListSubtitle}>Tap to view latest posted news</Text>
                </View>
              </View>
              <Ionicons name={showRecentNewsList ? 'chevron-up' : 'chevron-forward'} size={18} color="#8e8e8e" />
            </TouchableOpacity>
          </View>

          {showRecentNewsList ? (
            recentLoading ? (
              <ActivityIndicator size="small" color="#1a1f2e" style={{ marginVertical: 16 }} />
            ) : recentError ? (
              <Text style={styles.errorText}>{recentError}</Text>
            ) : recentEvents.length === 0 ? (
              <Text style={styles.emptyRecentText}>No news yet.</Text>
            ) : (
              recentEvents.map((ev) => {
                const thumbUrl = getEventThumbUrl(ev);
                return (
                <TouchableOpacity key={ev.id} style={styles.recentItem} activeOpacity={0.85} onPress={() => openRecentNews(ev)}>
                  {thumbUrl ? (
                    <Image source={{ uri: thumbUrl }} style={styles.recentLogo} />
                  ) : (
                    <View style={styles.recentLogoPlaceholder}>
                      <Text style={styles.recentLogoLetter}>{ev.school?.name?.charAt(0) ?? '?'}</Text>
                    </View>
                  )}
                  <View style={styles.recentText}>
                    <Text style={styles.recentTitle}>{ev.title}</Text>
                    <Text style={styles.recentSub}>{ev.school?.name ?? ev.subCategory?.name ?? ''}</Text>
                  </View>
                </TouchableOpacity>
                );
              })
            )
          ) : null}

          <View style={styles.sectionDivider} />
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Linking.openURL(`${BASE_URL}/#privacy`).catch(() => {})}>
              <Text style={styles.footerLink}>Privacy policy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL(`${BASE_URL}/#terms-of-service`).catch(() => {})}>
              <Text style={styles.footerLink}>Terms and conditions</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          visible={showLogoutConfirmModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowLogoutConfirmModal(false)}
        >
          <Pressable style={styles.overlayDim} onPress={() => setShowLogoutConfirmModal(false)}>
            <Pressable style={styles.logoutNotifyCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.logoutNotifyTitle}>Log out</Text>
              <Text style={styles.logoutNotifyMessage}>
                Are you sure you want to log out from your account?
              </Text>
              <View style={styles.logoutNotifyActions}>
                <TouchableOpacity
                  style={styles.logoutNotifyCancel}
                  onPress={() => setShowLogoutConfirmModal(false)}
                >
                  <Text style={styles.logoutNotifyCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.logoutNotifyConfirm} onPress={() => void confirmLogout()}>
                  <Text style={styles.logoutNotifyConfirmText}>Log out</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Help — raise query (same API as web) */}
        <Modal visible={showHelpModal} animationType="fade" transparent onRequestClose={() => setShowHelpModal(false)}>
          <Pressable style={styles.overlayDim} onPress={() => !helpSubmitLoading && setShowHelpModal(false)}>
            <Pressable style={styles.helpModalBox} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.helpModalTitle}>Raise a query</Text>
              <Text style={styles.helpModalDesc}>
                Describe your issue. Your school admin will see it in the Users help section.
              </Text>
              <TextInput
                style={styles.helpTextArea}
                placeholder="Your message…"
                placeholderTextColor="#8e8e8e"
                value={helpMessage}
                onChangeText={(t) => {
                  setHelpMessage(t);
                  setHelpError(null);
                }}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              {helpError ? <Text style={styles.helpError}>{helpError}</Text> : null}
              {helpQueriesLoading ? (
                <ActivityIndicator size="small" color="#1a1f2e" style={{ marginBottom: 12 }} />
              ) : helpQueries.length > 0 ? (
                <View style={styles.helpHistory}>
                  <Text style={styles.helpHistoryTitle}>Your recent queries</Text>
                  {helpQueries.slice(0, 5).map((q) => (
                    <View key={q.id} style={styles.helpHistoryItem}>
                      <Text style={styles.helpHistoryDate}>
                        {new Date(q.createdAt).toLocaleString()}
                      </Text>
                      <Text style={styles.helpHistoryMsg} numberOfLines={3}>
                        {q.message}
                      </Text>
                      <Text style={styles.helpHistoryStatus}>{q.status}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={styles.helpActions}>
                <TouchableOpacity
                  style={styles.helpCancelBtn}
                  onPress={() => !helpSubmitLoading && setShowHelpModal(false)}
                  disabled={helpSubmitLoading}
                >
                  <Text style={styles.helpCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.helpSendBtn, (!helpMessage.trim() || helpSubmitLoading) && styles.buttonDisabled]}
                  onPress={submitHelpQuery}
                  disabled={helpSubmitLoading || !helpMessage.trim()}
                >
                  <Text style={styles.helpSendBtnText}>{helpSubmitLoading ? 'Sending…' : 'Send'}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
        <UserBookmarkedEventDetailModal
          visible={!!selectedRecentEvent}
          event={selectedRecentEvent}
          onClose={() => setSelectedRecentEvent(null)}
        />
      </SafeAreaView>
    );
  }

  const openRegister = () => {
    setShowLoginModal(false);
    setShowSignUpModal(true);
  };

  const handleSignUpCompleteGoToLogin = (payload: { email: string; infoMessage?: string }) => {
    setShowSignUpModal(false);
    setEmail(payload.email);
    setPassword('');
    setLoginInfoMessage(payload.infoMessage ?? null);
    setError(null);
    setLoginModalView('login');
    setShowLoginModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.loginPromptRow}>
            <View style={styles.personIconWrap}>
              <FontAwesome5 name="user" size={20} color="#6c757d" />
            </View>
            <Text style={styles.loginPromptText}>
              To get filterised categories and subcategories news, like comment and saved options
              needs login.
            </Text>
          </View>
          <View style={styles.loginButtonsRow}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => {
                setLoginInfoMessage(null);
                setLoginModalView('login');
                setShowLoginModal(true);
              }}
            >
              <FontAwesome5 name="sign-in-alt" size={16} color="#fff" />
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => setShowSignUpModal(true)}
            >
              <PersonPlusIcon width={18} height={18} fill="#1a1f2e" />
              <Text style={[styles.signUpButtonText, { marginLeft: 6 }]}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>Recently added schools / news</Text>
        {recentLoading ? (
          <ActivityIndicator size="small" color="#1a1f2e" style={{ marginVertical: 16 }} />
        ) : recentError ? (
          <Text style={styles.errorText}>{recentError}</Text>
        ) : recentEvents.length === 0 ? (
          <Text style={styles.emptyRecentText}>No news yet.</Text>
        ) : (
          recentEvents.map((ev) => {
            const thumbUrl = getEventThumbUrl(ev);
            return (
            <TouchableOpacity key={ev.id} style={styles.recentItem} activeOpacity={0.85} onPress={() => openRecentNews(ev)}>
              {thumbUrl ? (
                <Image source={{ uri: thumbUrl }} style={styles.recentLogo} />
              ) : (
                <View style={styles.recentLogoPlaceholder}>
                  <Text style={styles.recentLogoLetter}>{ev.school?.name?.charAt(0) ?? '?'}</Text>
                </View>
              )}
              <View style={styles.recentText}>
                <Text style={styles.recentTitle}>{ev.title}</Text>
                <Text style={styles.recentSub}>{ev.school?.name ?? ev.subCategory?.name ?? ''}</Text>
              </View>
            </TouchableOpacity>
            );
          })
        )}

        <View style={styles.sectionDivider} />
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => Linking.openURL(`${BASE_URL}/#privacy`).catch(() => {})}>
            <Text style={styles.footerLink}>Privacy policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL(`${BASE_URL}/#terms-of-service`).catch(() => {})}>
            <Text style={styles.footerLink}>Terms and conditions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Login modal — matches web: Sembuzz, Login to your Account, Email, Password, Sign in, Create new account? Sign up, Privacy, Terms, Cancel */}
      <SignUpModal
        visible={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onCompleteGoToLogin={handleSignUpCompleteGoToLogin}
      />
      <UserBookmarkedEventDetailModal
        visible={!!selectedRecentEvent}
        event={selectedRecentEvent}
        onClose={() => setSelectedRecentEvent(null)}
      />

      {showLoginModal ? (
        <Modal visible transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setLoginInfoMessage(null);
              setShowLoginModal(false);
            }}
          >
            <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={() => {
                    setLoginInfoMessage(null);
                    setShowLoginModal(false);
                  }}
                  hitSlop={12}
                >
                  <Text style={styles.modalClose}>×</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalBrand}>Sembuzz</Text>
              {loginModalView === 'forgot' ? (
                <UserForgotPasswordPanel
                  initialEmail={email}
                  onBackToLogin={() => setLoginModalView('login')}
                  onSuccess={() => {
                    setPassword('');
                    setError(null);
                  }}
                  styles={styles}
                />
              ) : (
                <>
              <Text style={styles.modalTitle}>Login to your Account</Text>
              {loginInfoMessage ? <Text style={styles.modalInfoBanner}>{loginInfoMessage}</Text> : null}
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Email"
                  placeholderTextColor="#8e8e8e"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setError(null);
                    setLoginInfoMessage(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Password"
                  placeholderTextColor="#8e8e8e"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setError(null);
                    setLoginInfoMessage(null);
                  }}
                  secureTextEntry
                  autoComplete="password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  cursorColor="#1a1f2e"
                  selectionColor="rgba(26, 31, 46, 0.25)"
                />
                <TouchableOpacity
                  onPress={() => setLoginModalView('forgot')}
                  style={{ alignSelf: 'flex-end', marginBottom: 8, marginTop: -4 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ fontSize: 14, color: '#6c757d' }}>Forgot password?</Text>
                </TouchableOpacity>
                {error ? <Text style={styles.modalError}>{error}</Text> : null}
                <TouchableOpacity
                  style={[styles.modalSignInBtn, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSignInText}>Sign in</Text>}
                </TouchableOpacity>
              </KeyboardAvoidingView>
              <Text style={styles.modalSignUpPrompt}>
                Create new account?{' '}
                <Text style={styles.modalSignUpLink} onPress={openRegister}>Sign up</Text>
              </Text>
              <View style={styles.modalLegalRow}>
                <TouchableOpacity onPress={() => Linking.openURL(`${BASE_URL}/#privacy`).catch(() => {})}>
                  <Text style={styles.modalLegalLink}>Privacy policy</Text>
                </TouchableOpacity>
                <Text style={styles.footerDot}> </Text>
                <TouchableOpacity onPress={() => Linking.openURL(`${BASE_URL}/#terms-of-service`).catch(() => {})}>
                  <Text style={styles.modalLegalLink}>Terms and conditions</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setLoginInfoMessage(null);
                  setLoginModalView('login');
                  setShowLoginModal(false);
                }}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  loginPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginPromptText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1f2e',
    lineHeight: 20,
  },
  loginButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  loginButton: {
    backgroundColor: '#212529',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  personIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  signUpButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#212529',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonFull: {
    backgroundColor: '#212529',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  signUpButtonText: {
    color: '#212529',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
    color: '#1a1f2e',
  },
  footer: {
    marginTop: 12,
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarRingTouchable: {
    borderRadius: PROFILE_AVATAR_RING / 2,
  },
  avatarRingOuter: {
    width: PROFILE_AVATAR_RING,
    height: PROFILE_AVATAR_RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatarPlaceholderInner: {
    width: PROFILE_AVATAR_INNER,
    height: PROFILE_AVATAR_INNER,
    borderRadius: PROFILE_AVATAR_INNER / 2,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImageInner: {
    width: PROFILE_AVATAR_INNER,
    height: PROFILE_AVATAR_INNER,
    borderRadius: PROFILE_AVATAR_INNER / 2,
    backgroundColor: '#e9ecef',
  },
  avatarOnlineBadge: {
    position: 'absolute',
    right: 1,
    top: 1,
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6c757d',
  },
  profileText: {
    marginLeft: 16,
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  logoutHeaderBtn: {
    padding: 4,
    borderRadius: 8,
  },
  userEmail: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  userId: {
    fontSize: 11,
    color: '#8e8e8e',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actionsIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  actionIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef1f6',
    position: 'relative',
  },
  actionIconBtnActive: {
    backgroundColor: '#dbe7ff',
  },
  actionNotifBadgeBlack: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 999,
    backgroundColor: '#111315',
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  actionNotifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  actionListCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4e7ee',
    backgroundColor: '#fff',
    marginBottom: 8,
    overflow: 'hidden',
  },
  actionListItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  actionListItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f6',
  },
  actionListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  actionListIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#eef1f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    position: 'relative',
  },
  actionListTextWrap: {
    flex: 1,
  },
  actionListTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  actionListSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  selectedActionPanel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4e7ee',
    backgroundColor: '#f9fbff',
    padding: 14,
    marginBottom: 4,
  },
  selectedActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1f2e',
    marginBottom: 4,
  },
  selectedActionSubtitle: {
    fontSize: 13,
    color: '#5f6b7a',
    lineHeight: 18,
  },
  selectedActionCta: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1a1f2e',
  },
  selectedActionCtaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  actionGreen: { backgroundColor: '#d4edda' },
  actionBlue: { backgroundColor: '#cce5ff' },
  actionOrange: { backgroundColor: '#ffe5cc' },
  actionRed: { backgroundColor: '#f8d7da' },
  actionGray: { backgroundColor: '#e9ecef' },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1f2e',
    marginTop: 0,
    marginBottom: 12,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginVertical: 16,
  },
  emptyRecentText: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'left',
    marginBottom: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  recentLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  recentLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentLogoLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6c757d',
  },
  recentText: {
    marginLeft: 12,
    flex: 1,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  recentSub: {
    fontSize: 13,
    color: '#8e8e8e',
    marginTop: 2,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 0,
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 8,
    width: '100%',
  },
  footerLink: {
    fontSize: 14,
    color: '#6c757d',
    textDecorationLine: 'underline',
  },
  footerDot: {
    fontSize: 14,
    color: '#6c757d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalClose: {
    fontSize: 28,
    color: '#6c757d',
    lineHeight: 32,
  },
  modalBrand: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1f2e',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInfoBanner: {
    fontSize: 14,
    color: '#0f5132',
    backgroundColor: '#d1e7dd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    /** Required on many Android devices or password bullets render white/invisible. */
    color: '#1a1f2e',
  },
  modalError: {
    fontSize: 14,
    color: '#dc3545',
    marginBottom: 8,
  },
  modalSignInBtn: {
    backgroundColor: '#212529',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  modalSignInText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalSignUpPrompt: {
    fontSize: 14,
    color: '#212529',
    textAlign: 'center',
    marginTop: 16,
  },
  modalSignUpLink: {
    color: '#0d6efd',
    fontWeight: '500',
  },
  modalLegalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  modalLegalLink: {
    fontSize: 14,
    color: '#6c757d',
  },
  modalCancel: {
    alignItems: 'center',
    marginTop: 16,
  },
  modalCancelText: {
    fontSize: 14,
    color: '#6c757d',
  },
  overlayDim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
    paddingBottom: 100,
  },
  logoutNotifyCard: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#eef0f3',
  },
  logoutNotifyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1f2e',
    marginBottom: 8,
  },
  logoutNotifyMessage: {
    fontSize: 14,
    color: '#5f6b7a',
    lineHeight: 20,
    marginBottom: 18,
  },
  logoutNotifyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  logoutNotifyCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
    backgroundColor: '#fff',
  },
  logoutNotifyCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6c757d',
  },
  logoutNotifyConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#dc3545',
  },
  logoutNotifyConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  helpModalBox: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '85%',
  },
  helpModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1f2e',
    marginBottom: 8,
  },
  helpModalDesc: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 18,
  },
  helpTextArea: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1a1f2e',
    minHeight: 100,
    marginBottom: 8,
  },
  helpError: {
    fontSize: 13,
    color: '#dc3545',
    marginBottom: 8,
  },
  helpHistory: {
    marginBottom: 12,
    maxHeight: 160,
  },
  helpHistoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
  },
  helpHistoryItem: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  helpHistoryDate: {
    fontSize: 11,
    color: '#8e8e8e',
    marginBottom: 4,
  },
  helpHistoryMsg: {
    fontSize: 14,
    color: '#1a1f2e',
  },
  helpHistoryStatus: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  helpActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  helpCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
    backgroundColor: '#fff',
  },
  helpCancelBtnText: {
    fontSize: 15,
    color: '#6c757d',
    fontWeight: '500',
  },
  helpSendBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#0d6efd',
  },
  helpSendBtnText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
