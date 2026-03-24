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
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { getApprovedEvents, imageSrc, ApprovedEventPublic } from '../services/events';
import { getFrontendBaseUrl } from '../config/env';
import { userHelpService, type UserHelpQueryItem } from '../services/userHelp';
import SignUpModal from '../components/SignUpModal';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const BASE_URL = getFrontendBaseUrl();

/** Gradient ring + inner circle — makes the avatar read clearly as a tappable control. */
const PROFILE_AVATAR_RING = 64;
const PROFILE_AVATAR_STROKE = 6;
const PROFILE_AVATAR_INNER = 52;
/** Circle radius (stroke is centered on this path). */
const PROFILE_AVATAR_R = PROFILE_AVATAR_RING / 2 - PROFILE_AVATAR_STROKE / 2;
const PROFILE_AVATAR_GRAD_ID = 'settingsProfileAvatarRing';

export default function SettingsScreen() {
  const navigation = useNavigation();
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
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [loginInfoMessage, setLoginInfoMessage] = useState<string | null>(null);
  const [profileImageFailed, setProfileImageFailed] = useState(false);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSubmitLoading, setHelpSubmitLoading] = useState(false);
  const [helpError, setHelpError] = useState<string | null>(null);
  const [helpQueries, setHelpQueries] = useState<UserHelpQueryItem[]>([]);
  const [helpQueriesLoading, setHelpQueriesLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'categories' | 'liked' | 'saved' | 'help'>('categories');
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  const profileImageUrl = (() => {
    const candidate =
      (user as { profilePicUrl?: string | null; image?: string | null } | null)?.profilePicUrl ||
      (user as { profilePicUrl?: string | null; image?: string | null } | null)?.image ||
      '';
    return candidate ? imageSrc(candidate) : '';
  })();

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

  useEffect(() => {
    setProfileImageFailed(false);
  }, [user?.id]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Enter email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
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

  const runSelectedAction = useCallback(() => {
    if (selectedAction === 'categories') {
      if (!user?.schoolId) {
        Alert.alert('School required', 'Your account must be linked to a school to change categories.');
        return;
      }
      navigation.navigate('ChangeCategories' as never);
      return;
    }
    if (selectedAction === 'liked') {
      navigateRoot('LikedNews');
      return;
    }
    if (selectedAction === 'saved') {
      navigateRoot('SavedNews');
      return;
    }
    if (selectedAction === 'help') {
      openHelpModal();
      return;
    }
  }, [selectedAction, user?.schoolId, navigation, navigateRoot, openHelpModal]);

  const selectedActionMeta = useMemo(() => {
    switch (selectedAction) {
      case 'categories':
        return {
          title: 'Change categories',
          subtitle: 'Update your preferred categories and subcategories.',
          cta: 'Open categories',
        };
      case 'liked':
        return { title: 'Liked news', subtitle: 'Review news posts you have liked.', cta: 'Open liked news' };
      case 'saved':
        return { title: 'Saved news', subtitle: 'Open your saved news collection.', cta: 'Open saved news' };
      case 'help':
        return { title: 'Help', subtitle: 'Raise a query to your school admin.', cta: 'Raise query' };
    }
  }, [selectedAction]);

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
                  <Defs>
                    <LinearGradient id={PROFILE_AVATAR_GRAD_ID} x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#ff8c42" />
                      <Stop offset="45%" stopColor="#4dabf7" />
                      <Stop offset="100%" stopColor="#a855f7" />
                    </LinearGradient>
                  </Defs>
                  <Circle
                    cx={PROFILE_AVATAR_RING / 2}
                    cy={PROFILE_AVATAR_RING / 2}
                    r={PROFILE_AVATAR_R}
                    stroke={`url(#${PROFILE_AVATAR_GRAD_ID})`}
                    strokeWidth={PROFILE_AVATAR_STROKE}
                    fill="none"
                  />
                </Svg>
                {profileImageUrl && !profileImageFailed ? (
                  <Image
                    source={{ uri: profileImageUrl }}
                    style={styles.avatarImageInner}
                    onError={() => setProfileImageFailed(true)}
                  />
                ) : (
                  <View style={styles.avatarPlaceholderInner}>
                    <Text style={styles.avatarLetter}>{user.name?.charAt(0) ?? '?'}</Text>
                  </View>
                )}
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
            </View>
          </View>

          <View style={styles.actionsIconRow}>
            <TouchableOpacity
              style={[styles.actionIconBtn, selectedAction === 'categories' && styles.actionIconBtnActive]}
              onPress={() => setSelectedAction('categories')}
            >
              <Ionicons name={selectedAction === 'categories' ? 'folder' : 'folder-outline'} size={20} color="#1a1f2e" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionIconBtn, selectedAction === 'liked' && styles.actionIconBtnActive]}
              onPress={() => setSelectedAction('liked')}
            >
              <Ionicons name={selectedAction === 'liked' ? 'heart' : 'heart-outline'} size={20} color="#1a1f2e" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionIconBtn, selectedAction === 'saved' && styles.actionIconBtnActive]}
              onPress={() => setSelectedAction('saved')}
            >
              <Ionicons name={selectedAction === 'saved' ? 'bookmark' : 'bookmark-outline'} size={20} color="#1a1f2e" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionIconBtn, selectedAction === 'help' && styles.actionIconBtnActive]}
              onPress={() => setSelectedAction('help')}
            >
              <Ionicons name={selectedAction === 'help' ? 'help-circle' : 'help-circle-outline'} size={20} color="#1a1f2e" />
            </TouchableOpacity>
          </View>

          <View style={styles.selectedActionPanel}>
            <Text style={styles.selectedActionTitle}>{selectedActionMeta.title}</Text>
            <Text style={styles.selectedActionSubtitle}>{selectedActionMeta.subtitle}</Text>
            <TouchableOpacity style={styles.selectedActionCta} onPress={runSelectedAction}>
              <Text style={styles.selectedActionCtaText}>{selectedActionMeta.cta}</Text>
            </TouchableOpacity>
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
            recentEvents.map((ev) => (
              <View key={ev.id} style={styles.recentItem}>
                {ev.school?.image ? (
                  <Image source={{ uri: imageSrc(ev.school.image) }} style={styles.recentLogo} />
                ) : (
                  <View style={styles.recentLogoPlaceholder}>
                    <Text style={styles.recentLogoLetter}>{ev.school?.name?.charAt(0) ?? '?'}</Text>
                  </View>
                )}
                <View style={styles.recentText}>
                  <Text style={styles.recentTitle}>{ev.title}</Text>
                  <Text style={styles.recentSub}>{ev.school?.name ?? ev.subCategory?.name ?? ''}</Text>
                </View>
              </View>
            ))
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
          recentEvents.map((ev) => (
            <View key={ev.id} style={styles.recentItem}>
              {ev.school?.image ? (
                <Image source={{ uri: imageSrc(ev.school.image) }} style={styles.recentLogo} />
              ) : (
                <View style={styles.recentLogoPlaceholder}>
                  <Text style={styles.recentLogoLetter}>{ev.school?.name?.charAt(0) ?? '?'}</Text>
                </View>
              )}
              <View style={styles.recentText}>
                <Text style={styles.recentTitle}>{ev.title}</Text>
                <Text style={styles.recentSub}>{ev.school?.name ?? ev.subCategory?.name ?? ''}</Text>
              </View>
            </View>
          ))
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

      <Modal visible={showLoginModal} transparent animationType="fade">
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
              />
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
                setShowLoginModal(false);
              }}
              style={styles.modalCancel}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  },
  actionIconBtnActive: {
    backgroundColor: '#dbe7ff',
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
