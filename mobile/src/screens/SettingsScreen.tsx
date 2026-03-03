import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { getApprovedEvents, imageSrc, ApprovedEventPublic } from '../services/events';

export default function SettingsScreen() {
  const { user, login, logout, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<ApprovedEventPublic[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const fetchRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const list = await getApprovedEvents(undefined, undefined);
      const sorted = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setRecentEvents(sorted.slice(0, 10));
    } catch {
      setRecentEvents([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a1f2e" />
        </View>
      </SafeAreaView>
    );
  }

  if (user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileRow}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>{user.name?.charAt(0) ?? '?'}</Text>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.userName}>{user.name ?? 'User'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.actionButton, styles.actionGreen]}>
            <Text style={styles.actionIcon}>📁</Text>
            <Text style={styles.actionLabel}>Change categories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionBlue]}>
            <Text style={styles.actionIcon}>❤️</Text>
            <Text style={styles.actionLabel}>Liked news</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionBlue]}>
            <Text style={styles.actionIcon}>🔖</Text>
            <Text style={styles.actionLabel}>Saved news</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionOrange]}>
            <Text style={styles.actionIcon}>?</Text>
            <Text style={styles.actionLabel}>Help — raise a query to school admin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionRed]} onPress={handleLogout}>
            <Text style={styles.actionIcon}>↪</Text>
            <Text style={styles.actionLabel}>Sign out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionGray]} onPress={handleDeleteAccount}>
            <Text style={styles.actionIcon}>🗑</Text>
            <Text style={styles.actionLabel}>Delete account</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Recently added schools / news</Text>
          {recentLoading ? (
            <ActivityIndicator size="small" color="#1a1f2e" style={{ marginVertical: 16 }} />
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
            <TouchableOpacity onPress={() => Linking.openURL('/privacy').catch(() => {})}>
              <Text style={styles.footerLink}>Privacy policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}> · </Text>
            <TouchableOpacity onPress={() => Linking.openURL('/terms').catch(() => {})}>
              <Text style={styles.footerLink}>Terms and conditions</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.loginPromptRow}>
              <Text style={styles.loginPromptIcon}>👤</Text>
              <Text style={styles.loginPromptText}>
                To get filterised categories and subcategories news, like comment and saved options
                needs login.
              </Text>
            </View>
            <View style={styles.loginButtonsRow}>
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={() => Linking.openURL('/register').catch(() => {})}
              >
                <Text style={styles.signUpButtonText}>Sign up</Text>
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#8e8e8e"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#8e8e8e"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
            <TouchableOpacity
              style={[styles.loginButtonFull, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Log in</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.footer}>
              Don&apos;t have an account? Register on the web at SemBuzz.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Recently added schools / news</Text>
          {recentLoading ? (
            <ActivityIndicator size="small" color="#1a1f2e" style={{ marginVertical: 16 }} />
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
            <TouchableOpacity onPress={() => Linking.openURL('/privacy').catch(() => {})}>
              <Text style={styles.footerLink}>Privacy policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}> · </Text>
            <TouchableOpacity onPress={() => Linking.openURL('/terms').catch(() => {})}>
              <Text style={styles.footerLink}>Terms and conditions</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#212529',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  loginButtonFull: {
    backgroundColor: '#212529',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  signUpButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#212529',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
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
});
