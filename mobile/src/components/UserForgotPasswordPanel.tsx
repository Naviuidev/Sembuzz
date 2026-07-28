import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { requestPasswordResetOtp, resetPassword } from '../services/userAuth';

type ForgotStep = 'email' | 'reset';

interface UserForgotPasswordPanelProps {
  initialEmail?: string;
  onBackToLogin: () => void;
  onSuccess?: () => void;
  styles: {
    modalTitle: object;
    modalInput: object;
    modalError: object;
    modalSignInBtn: object;
    buttonDisabled: object;
    modalSignInText: object;
    modalCancel: object;
    modalCancelText: object;
  };
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

export function UserForgotPasswordPanel({
  initialEmail = '',
  onBackToLogin,
  onSuccess,
  styles,
}: UserForgotPasswordPanelProps) {
  const [step, setStep] = useState<ForgotStep>('email');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setLoading(true);
    try {
      const data = await requestPasswordResetOtp(email.trim());
      setInfo(`OTP has been sent to ${data.email ?? 'your email'}.`);
      setStep('reset');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setInfo(null);
    if (!otp.trim() || !newPassword || !confirmPassword) {
      setError('OTP and both password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
        confirmPassword,
      });
      setInfo('Password reset successfully. You can sign in with your new password.');
      onSuccess?.();
      setTimeout(() => {
        onBackToLogin();
      }, 1200);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reset password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.modalTitle}>Forgot password</Text>
      <Text style={{ fontSize: 14, color: '#6c757d', textAlign: 'center', marginBottom: 16, lineHeight: 20 }}>
        {step === 'email'
          ? 'Enter your registered email to receive a one-time password.'
          : 'Enter the OTP from your email and choose a new password.'}
      </Text>

      {error ? <Text style={styles.modalError}>{error}</Text> : null}
      {info ? (
        <Text style={{ fontSize: 14, color: '#0f5132', marginBottom: 8, textAlign: 'center' }}>{info}</Text>
      ) : null}

      {step === 'email' ? (
        <>
          <TextInput
            style={styles.modalInput}
            placeholder="Email"
            placeholderTextColor="#8e8e8e"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TouchableOpacity
            style={[styles.modalSignInBtn, loading && styles.buttonDisabled]}
            onPress={() => void handleRequestOtp()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.modalSignInText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.modalInput}
            placeholder="OTP"
            placeholderTextColor="#8e8e8e"
            value={otp}
            onChangeText={(t) => {
              setOtp(t);
              setError(null);
            }}
            keyboardType="number-pad"
            autoComplete="one-time-code"
          />
          <TextInput
            style={styles.modalInput}
            placeholder="New password"
            placeholderTextColor="#8e8e8e"
            value={newPassword}
            onChangeText={(t) => {
              setNewPassword(t);
              setError(null);
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            cursorColor="#1a1f2e"
            selectionColor="rgba(26, 31, 46, 0.25)"
          />
          <TextInput
            style={styles.modalInput}
            placeholder="Confirm new password"
            placeholderTextColor="#8e8e8e"
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              setError(null);
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            cursorColor="#1a1f2e"
            selectionColor="rgba(26, 31, 46, 0.25)"
          />
          <TouchableOpacity
            style={[styles.modalSignInBtn, loading && styles.buttonDisabled]}
            onPress={() => void handleResetPassword()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.modalSignInText}>Reset password</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setStep('email');
              setOtp('');
              setNewPassword('');
              setConfirmPassword('');
              setError(null);
              setInfo(null);
            }}
            style={styles.modalCancel}
            disabled={loading}
          >
            <Text style={styles.modalCancelText}>Resend OTP</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={onBackToLogin} style={styles.modalCancel} disabled={loading}>
        <Text style={styles.modalCancelText}>Back to sign in</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
