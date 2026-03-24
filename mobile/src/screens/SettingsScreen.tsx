import React, { useState, useEffect, useCallback } from 'react';
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
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PersonPlusIcon from 'react-native-bootstrap-icons/icons/person-plus';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getApprovedEvents, getCategoriesBySchool, imageSrc, ApprovedEventPublic, CategoryPublic } from '../services/events';
import { getFrontendBaseUrl } from '../config/env';
import {
  getUserSubCategoryIds,
  setUserCategoryDone,
  setUserSubCategoryIds,
} from '../utils/userCategoryPrefs';
import { userNotificationsService } from '../services/userNotifications';
import { userHelpService, type UserHelpQueryItem } from '../services/userHelp';
import { CATEGORY_PREFS_CHANGED } from '../constants/appEvents';

const BASE_URL = getFrontendBaseUrl();

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, login, logout, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<ApprovedEventPublic[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [profileImageFailed, setProfileImageFailed] = useState(false);

  const [showChangeCategoryModal, setShowChangeCategoryModal] = useState(false);
  const [categoriesForModal, setCategoriesForModal] = useState<CategoryPublic[]>([]);
  const [categoriesModalLoading, setCategoriesModalLoading] = useState(false);
  const [changeCategorySelectedIds, setChangeCategorySelectedIds] = useState<string[]>([]);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSubmitLoading, setHelpSubmitLoading] = useState(false);
  const [helpError, setHelpError] = useState<string | null>(null);
  const [helpQueries, setHelpQueries] = useState<UserHelpQueryItem[]>([]);
  const [helpQueriesLoading, setHelpQueriesLoading] = useState(false);

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

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'Account deletion must be done on the web. Open SemBuzz in a browser to delete your account.',
      [{ text: 'OK' }],
    );
  };

  const openChangeCategoryModal = useCallback(async () => {
    if (!user?.schoolId) {
      Alert.alert('School required', 'Your account must be linked to a school to change categories.');
      return;
    }
    if (!user?.id) return;
    setCategoriesModalLoading(true);
    try {
      const cats = await getCategoriesBySchool(user.schoolId);
      let ids = await getUserSubCategoryIds(user.id);
      try {
        const remote = await userNotificationsService.getSubcategories();
        if (remote.subCategoryIds.length > 0) {
          ids = remote.subCategoryIds;
          await setUserSubCategoryIds(user.id, ids);
        }
      } catch {
        /* offline or API unavailable — keep local prefs */
      }
      setCategoriesForModal(Array.isArray(cats) ? cats : []);
      setChangeCategorySelectedIds(ids);
      setShowChangeCategoryModal(true);
    } catch {
      Alert.alert('Error', 'Could not load categories. Try again.');
    } finally {
      setCategoriesModalLoading(false);
    }
  }, [user?.id, user?.schoolId]);

  const toggleChangeCategorySub = useCallback((subId: string) => {
    setChangeCategorySelectedIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId],
    );
  }, []);

  const saveChangeCategory = useCallback(async () => {
    if (!user?.id) return;
    setCategoriesModalLoading(true);
    try {
      await setUserCategoryDone(user.id, 'true');
      await setUserSubCategoryIds(user.id, changeCategorySelectedIds);
      try {
        await userNotificationsService.setSubcategories(changeCategorySelectedIds);
      } catch {
        /* feed prefs still saved locally; push targeting may be out of sync until next successful sync */
      }
      setShowChangeCategoryModal(false);
      DeviceEventEmitter.emit(CATEGORY_PREFS_CHANGED);
      Alert.alert('Saved', 'Your category preferences were updated.');
    } catch {
      Alert.alert('Error', 'Could not save. Try again.');
    } finally {
      setCategoriesModalLoading(false);
    }
  }, [user?.id, changeCategorySelectedIds]);

  const closeChangeCategoryModal = useCallback(() => {
    setShowChangeCategoryModal(false);
    setChangeCategorySelectedIds([]);
  }, []);

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

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a1f2e" />
        </View>
      </SafeAreaView>
    );
  }

  if (user) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileRow}>
            {profileImageUrl && !profileImageFailed ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.avatarImage}
                onError={() => setProfileImageFailed(true)}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{user.name?.charAt(0) ?? '?'}</Text>
              </View>
            )}
            <View style={styles.profileText}>
              <Text style={styles.userName}>{user.name ?? 'User'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionGreen]}
              onPress={openChangeCategoryModal}
              disabled={categoriesModalLoading}
            >
              <Text style={styles.actionIcon}>📁</Text>
              <Text style={styles.actionLabel}>Change categories</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionBlue]}
              onPress={() => navigation.navigate('LikedNews' as never)}
            >
              <Text style={styles.actionIcon}>❤️</Text>
              <Text style={styles.actionLabel}>Liked news</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionBlue]}
              onPress={() => navigation.navigate('SavedNews' as never)}
            >
              <Text style={styles.actionIcon}>🔖</Text>
              <Text style={styles.actionLabel}>Saved news</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionRed]} onPress={handleLogout}>
              <Text style={styles.actionIcon}>↪</Text>
              <Text style={styles.actionLabel}>Sign out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionOrange]} onPress={openHelpModal}>
              <Text style={styles.actionIcon}>?</Text>
              <Text style={styles.actionLabel}>Help — raise a query to school admin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionGray]} onPress={handleDeleteAccount}>
              <Text style={styles.actionIcon}>🗑</Text>
              <Text style={styles.actionLabel}>Delete account</Text>
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

        {/* Change categories — same data as web / Events first-login; stays on Settings */}
        <Modal
          visible={showChangeCategoryModal}
          animationType="fade"
          transparent
          onRequestClose={closeChangeCategoryModal}
        >
          <View style={styles.overlayDim}>
            <ScrollView
              style={styles.categoryModalScroll}
              contentContainerStyle={styles.categoryModalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.categoryModalHeaderRow}>
                <Text style={styles.categoryModalTitle}>Change your categories</Text>
                <TouchableOpacity onPress={closeChangeCategoryModal} hitSlop={12} accessibilityLabel="Close">
                  <Text style={styles.categoryModalClose}>×</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.categoryModalDesc}>
                Choose the categories and subcategories you want to see in your home feed.
              </Text>
              {categoriesModalLoading && categoriesForModal.length === 0 ? (
                <ActivityIndicator color="#1a1f2e" style={{ marginVertical: 24 }} />
              ) : categoriesForModal.length === 0 ? (
                <Text style={styles.mutedSmall}>No categories available for your school yet.</Text>
              ) : (
                categoriesForModal.map((cat) => (
                  <View key={cat.id} style={styles.categoryBlock}>
                    <Text style={styles.categoryBlockTitle}>{cat.name}</Text>
                    <View style={styles.categorySubRow}>
                      {(cat.subcategories ?? []).map((sub) => {
                        const isSelected = changeCategorySelectedIds.includes(sub.id);
                        return (
                          <TouchableOpacity
                            key={sub.id}
                            style={[styles.subCatPill, isSelected ? styles.subCatPillOn : styles.subCatPillOff]}
                            onPress={() => toggleChangeCategorySub(sub.id)}
                            activeOpacity={0.85}
                          >
                            <Text style={[styles.subCatPillText, isSelected && styles.subCatPillTextOn]}>
                              {sub.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))
              )}
              <View style={styles.categoryModalActions}>
                <TouchableOpacity
                  style={styles.catCancelBtn}
                  onPress={closeChangeCategoryModal}
                  disabled={categoriesModalLoading}
                >
                  <Text style={styles.catCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.catSaveBtn, categoriesModalLoading && styles.buttonDisabled]}
                  onPress={saveChangeCategory}
                  disabled={categoriesModalLoading}
                >
                  <Text style={styles.catSaveBtnText}>{categoriesModalLoading ? 'Saving…' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
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
    Linking.openURL(`${BASE_URL}/register`).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
              onPress={() => setShowLoginModal(true)}
            >
              <FontAwesome5 name="sign-in-alt" size={16} color="#fff" />
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={openRegister}
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
      <Modal visible={showLoginModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowLoginModal(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setShowLoginModal(false)} hitSlop={12}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBrand}>Sembuzz</Text>
            <Text style={styles.modalTitle}>Login to your Account</Text>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <TextInput
                style={styles.modalInput}
                placeholder="Email"
                placeholderTextColor="#8e8e8e"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Password"
                placeholderTextColor="#8e8e8e"
                value={password}
                onChangeText={(t) => { setPassword(t); setError(null); }}
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
            <TouchableOpacity onPress={() => setShowLoginModal(false)} style={styles.modalCancel}>
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
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  userEmail: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
  signupModalBox: {
    maxWidth: 420,
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
  categoryModalScroll: {
    maxHeight: '88%',
  },
  categoryModalScrollContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  categoryModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryModalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1f2e',
    paddingRight: 8,
  },
  categoryModalClose: {
    fontSize: 26,
    color: '#6c757d',
    lineHeight: 28,
  },
  categoryModalDesc: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 16,
  },
  mutedSmall: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
  },
  categoryBlock: {
    marginBottom: 14,
  },
  categoryBlockTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  categorySubRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subCatPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  subCatPillOff: {
    borderColor: '#212529',
    backgroundColor: 'transparent',
  },
  subCatPillOn: {
    borderColor: '#212529',
    backgroundColor: '#212529',
  },
  subCatPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#212529',
  },
  subCatPillTextOn: {
    color: '#fff',
  },
  categoryModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  catCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#212529',
    backgroundColor: '#fff',
  },
  catCancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
  },
  catSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#212529',
  },
  catSaveBtnText: {
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
  signupModalHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1f2e',
    textAlign: 'center',
    marginBottom: 8,
  },
  signupModalSub: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  signupOption: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#212529',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  signupOptionOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#212529',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  signupOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1f2e',
    marginBottom: 4,
  },
  signupOptionDesc: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
  },
  signupOptionG: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1f2e',
    marginBottom: 8,
  },
});
