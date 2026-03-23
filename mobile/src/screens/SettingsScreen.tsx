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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PersonPlusIcon from 'react-native-bootstrap-icons/icons/person-plus';
import { useAuth } from '../contexts/AuthContext';
import { getApprovedEvents, imageSrc, ApprovedEventPublic } from '../services/events';
import { getFrontendBaseUrl } from '../config/env';

const BASE_URL = getFrontendBaseUrl();

export default function SettingsScreen() {
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
            <TouchableOpacity style={[styles.actionButton, styles.actionGreen]}>
              <Text style={styles.actionIcon}>📁</Text>
              <Text style={styles.actionLabel}>Change categories</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionBlue]}
              onPress={() => Linking.openURL(`${BASE_URL}/events`).catch(() => {})}
            >
              <Text style={styles.actionIcon}>❤️</Text>
              <Text style={styles.actionLabel}>Liked news</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionBlue]}
              onPress={() => Linking.openURL(`${BASE_URL}/events`).catch(() => {})}
            >
              <Text style={styles.actionIcon}>🔖</Text>
              <Text style={styles.actionLabel}>Saved news</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionRed]} onPress={handleLogout}>
              <Text style={styles.actionIcon}>↪</Text>
              <Text style={styles.actionLabel}>Sign out</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionOrange]}
              onPress={() => Linking.openURL(`${BASE_URL}/events`).catch(() => {})}
            >
              <Text style={styles.actionIcon}>?</Text>
              <Text style={styles.actionLabel}>Help — raise a query to school admin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionGray]} onPress={handleDeleteAccount}>
              <Text style={styles.actionIcon}>🗑</Text>
              <Text style={styles.actionLabel}>Delete account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Recently added schools / news</Text>
          {recentLoading ? (
            <ActivityIndicator size="small" color="#1a1f2e" style={{ marginVertical: 16 }} />
          ) : recentError ? (
            <Text style={styles.errorText}>{recentError}</Text>
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

          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Linking.openURL(`${BASE_URL}/#privacy`).catch(() => {})}>
              <Text style={styles.footerLink}>Privacy policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}> · </Text>
            <TouchableOpacity onPress={() => Linking.openURL(`${BASE_URL}/#terms-of-service`).catch(() => {})}>
              <Text style={styles.footerLink}>Terms and conditions</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
              <Text style={styles.loginPromptIcon}>👤</Text>
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

        <Text style={styles.sectionTitle}>Recently added schools / news</Text>
        {recentLoading ? (
          <ActivityIndicator size="small" color="#1a1f2e" style={{ marginVertical: 16 }} />
        ) : recentError ? (
          <Text style={styles.errorText}>{recentError}</Text>
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

        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => Linking.openURL(`${BASE_URL}/#privacy`).catch(() => {})}>
            <Text style={styles.footerLink}>Privacy policy</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}> · </Text>
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  loginPromptIcon: {
    fontSize: 24,
    marginRight: 10,
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
    marginTop: 24,
    marginBottom: 12,
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
    justifyContent: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
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
