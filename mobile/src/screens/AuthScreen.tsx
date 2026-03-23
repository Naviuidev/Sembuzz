import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getFrontendBaseUrl } from '../config/env';

const REGISTER_URL = getFrontendBaseUrl();

export default function AuthScreen() {
  const { user, login, loading: authLoading } = useAuth();
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigation.replace('Events');
    }
  }, [user, navigation]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Enter email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigation.replace('Events');
    } catch (e: unknown) {
      const msgRaw =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Login failed.';
      if (typeof msgRaw === 'string' && msgRaw.trim()) {
        setError(msgRaw);
      } else if (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: string }).message === 'string') {
        setError((e as { message: string }).message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openRegister = () => {
    const url = REGISTER_URL.startsWith('http') ? `${REGISTER_URL.replace(/\/$/, '')}/register` : `https://${REGISTER_URL}/register`;
    Linking.openURL(url).catch(() => {});
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
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Log in to SemBuzz</Text>
            <Text style={styles.subtitle}>Sign in to see your school’s events and filter by category.</Text>

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

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Log in</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.registerLink} onPress={openRegister}>
              <Text style={styles.registerLinkText}>Don’t have an account? Register on the web</Text>
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
    backgroundColor: '#fafafa',
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1f2e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: '#1a1f2e',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerLinkText: {
    color: '#4dabf7',
    fontSize: 14,
  },
});
