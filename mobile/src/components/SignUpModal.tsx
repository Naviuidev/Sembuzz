import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import {
  getSchools,
  registerUser,
  resendRegistrationOtp,
  uploadProfilePicFromUri,
  uploadRegistrationDocFromUri,
  verifyRegistrationOtp,
  type RegisterResponse,
  type SchoolOption,
} from '../services/userAuth';

type Step = 'method' | 'form' | 'otp' | 'pending';
type RegistrationMethod = 'school_domain' | 'gmail';

export type SignUpCompletePayload = {
  email: string;
  infoMessage?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onCompleteGoToLogin: (payload: SignUpCompletePayload) => void;
};

function parseApiError(e: unknown, fallback: string): string {
  const ax =
    e && typeof e === 'object' && 'response' in e
      ? (e as { response?: { data?: { message?: string | string[] } } })
      : null;
  const raw = ax?.response?.data?.message;
  if (Array.isArray(raw)) return raw.join('. ');
  if (typeof raw === 'string' && raw.length > 0) return raw;
  return fallback;
}

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  schoolId: '',
};

export default function SignUpModal({ visible, onClose, onCompleteGoToLogin }: Props) {
  const [step, setStep] = useState<Step>('method');
  const [registrationMethod, setRegistrationMethod] = useState<RegistrationMethod | null>(null);
  const [formData, setFormData] = useState(initialForm);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolsError, setSchoolsError] = useState<string | null>(null);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);

  const [profileAsset, setProfileAsset] = useState<{ uri: string; name: string; mime: string } | null>(null);
  const [verificationAsset, setVerificationAsset] = useState<{ uri: string; name: string; mime: string } | null>(
    null,
  );

  const [otpEmail, setOtpEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const [pendingEmail, setPendingEmail] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const resetAll = useCallback(() => {
    setStep('method');
    setRegistrationMethod(null);
    setFormData(initialForm);
    setSchools([]);
    setSchoolsError(null);
    setShowSchoolPicker(false);
    setProfileAsset(null);
    setVerificationAsset(null);
    setOtpEmail('');
    setOtpValue('');
    setDevOtp(undefined);
    setPendingEmail('');
    setError('');
    setLoading(false);
    setResendLoading(false);
    setResendSuccess(false);
  }, []);

  useEffect(() => {
    if (!visible) {
      resetAll();
    }
  }, [visible, resetAll]);

  useEffect(() => {
    if (!visible || step !== 'form') return;
    if (schools.length > 0 || schoolsLoading) return;
    setSchoolsLoading(true);
    setSchoolsError(null);
    getSchools()
      .then((list) => setSchools(Array.isArray(list) ? list : []))
      .catch((err) => {
        setSchools([]);
        setSchoolsError(parseApiError(err, 'Unable to load schools.'));
      })
      .finally(() => setSchoolsLoading(false));
  }, [visible, step, schools.length, schoolsLoading]);

  const selectedSchool = useMemo(
    () => schools.find((s) => s.id === formData.schoolId),
    [schools, formData.schoolId],
  );

  const selectedDomain = selectedSchool?.domain?.replace(/^@/, '') ?? null;

  const pickImage = async (kind: 'profile' | 'verification') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo library access to upload.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: kind === 'profile',
      quality: 0.85,
      ...(kind === 'profile' ? { aspect: [1, 1] as [number, number] } : {}),
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    const uri = asset.uri;
    const ext = uri.split('.').pop()?.toLowerCase();
    const fileName = `${kind}-${Date.now()}.${ext || 'jpg'}`;
    const mimeType = asset.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg');
    const payload = { uri, name: fileName, mime: mimeType };
    if (kind === 'profile') setProfileAsset(payload);
    else setVerificationAsset(payload);
    setError('');
  };

  const handleMethodSelect = (method: RegistrationMethod) => {
    setRegistrationMethod(method);
    setStep('form');
    setError('');
  };

  const goBack = () => {
    if (step === 'otp' || step === 'pending') {
      setStep('form');
      setError('');
      return;
    }
    if (step === 'form') {
      setStep('method');
      setRegistrationMethod(null);
      setProfileAsset(null);
      setVerificationAsset(null);
      setFormData(initialForm);
      setError('');
      return;
    }
    onClose();
  };

  const submitRegister = async () => {
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!formData.schoolId) {
      setError('Please select your school');
      return;
    }
    if (!registrationMethod) {
      setError('Choose how you are able to create an account');
      return;
    }
    if (registrationMethod === 'gmail' && !verificationAsset) {
      setError('Please upload a school-related document (e.g. ID card or fee receipt)');
      return;
    }

    setLoading(true);
    try {
      let profilePicUrl: string | undefined;
      let verificationDocUrl: string | undefined;
      if (profileAsset) {
        profilePicUrl = await uploadProfilePicFromUri(profileAsset.uri, profileAsset.name, profileAsset.mime);
      }
      if (verificationAsset) {
        verificationDocUrl = await uploadRegistrationDocFromUri(
          verificationAsset.uri,
          verificationAsset.name,
          verificationAsset.mime,
        );
      }

      const response: RegisterResponse = await registerUser({
        registrationMethod,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        profilePicUrl,
        schoolId: formData.schoolId,
        email: formData.email.trim(),
        password: formData.password,
        verificationDocUrl,
      });

      if ('requiresOtp' in response && response.requiresOtp) {
        setOtpEmail(response.email);
        const showDev = __DEV__ && response.devOtp;
        setDevOtp(showDev ? response.devOtp : undefined);
        setOtpValue(showDev && response.devOtp ? response.devOtp : '');
        setStep('otp');
        return;
      }
      if ('pendingApproval' in response && response.pendingApproval) {
        setPendingEmail(formData.email.trim());
        setStep('pending');
        return;
      }
      setError('Unexpected response from server. Please try again.');
    } catch (e: unknown) {
      setError(parseApiError(e, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    setError('');
    if (!otpValue || otpValue.length !== 6) {
      setError('Please enter the 6-digit OTP sent to your email');
      return;
    }
    setLoading(true);
    try {
      await verifyRegistrationOtp(otpEmail, otpValue);
      onCompleteGoToLogin({
        email: otpEmail,
        infoMessage: 'Account created. Please log in with your email and password.',
      });
    } catch (e: unknown) {
      setError(parseApiError(e, 'Invalid or expired OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResendLoading(true);
    try {
      const res = await resendRegistrationOtp(otpEmail);
      if (__DEV__ && res.devOtp) {
        setDevOtp(res.devOtp);
        setOtpValue(res.devOtp);
      }
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (e: unknown) {
      setError(parseApiError(e, 'Could not resend OTP. Try again.'));
    } finally {
      setResendLoading(false);
    }
  };

  const goToLoginFromPending = () => {
    onCompleteGoToLogin({
      email: pendingEmail || formData.email.trim(),
      infoMessage: 'Once your school admin approves your account, you can log in with the email and password you set.',
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <Pressable style={styles.overlayPress} onPress={onClose}>
          <Pressable style={styles.box} onPress={(e) => e.stopPropagation()}>
            <View style={styles.headerRow}>
              {(step === 'form' || step === 'otp' || step === 'pending') && (
                <TouchableOpacity onPress={goBack} hitSlop={12}>
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            {step === 'method' && (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={styles.brand}>Sembuzz</Text>
                <Text style={styles.title}>How are you able to create an account?</Text>
                <Text style={styles.sub}>
                  Choose the option that applies to you. This helps us verify your identity.
                </Text>
                <TouchableOpacity style={styles.optionPrimary} onPress={() => handleMethodSelect('school_domain')}>
                  <Text style={styles.optionTitle}>School domain</Text>
                  <Text style={styles.optionDesc}>
                    I have an email with my school&apos;s domain (e.g. @school.edu)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionOutline} onPress={() => handleMethodSelect('gmail')}>
                  <Text style={styles.optionTitle}>Gmail / Yahoo / other</Text>
                  <Text style={styles.optionDesc}>
                    Personal email; upload a school document for admin approval
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {step === 'form' && registrationMethod && (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={styles.scrollForm}
                contentContainerStyle={styles.scrollFormContent}
              >
                <Text style={styles.titleLeft}>Create your account</Text>
                <Text style={styles.hint}>
                  {registrationMethod === 'school_domain'
                    ? 'Use an email that matches your school’s domain. We’ll send a one-time password to verify.'
                    : 'Upload a school document. Your school admin will review before you can log in.'}
                </Text>
                {error ? <Text style={styles.err}>{error}</Text> : null}

                <Text style={styles.label}>First name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(t) => setFormData((f) => ({ ...f, firstName: t }))}
                  placeholder="John"
                  placeholderTextColor="#8e8e8e"
                />
                <Text style={styles.label}>Last name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(t) => setFormData((f) => ({ ...f, lastName: t }))}
                  placeholder="Doe"
                  placeholderTextColor="#8e8e8e"
                />

                <TouchableOpacity style={styles.secondaryBtn} onPress={() => pickImage('profile')}>
                  <Text style={styles.secondaryBtnText}>
                    {profileAsset ? 'Change profile photo (optional)' : 'Add profile photo (optional)'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.label}>School</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowSchoolPicker(true)}
                  disabled={schoolsLoading}
                >
                  <Text style={selectedSchool ? styles.schoolSelected : styles.schoolPlaceholder}>
                    {schoolsLoading
                      ? 'Loading schools…'
                      : selectedSchool
                        ? `${selectedSchool.name}${selectedSchool.domain ? ` (${selectedSchool.domain})` : ''}`
                        : 'Select your school'}
                  </Text>
                </TouchableOpacity>
                {schoolsError ? <Text style={styles.warn}>{schoolsError}</Text> : null}
                {!schoolsLoading && !schoolsError && schools.length === 0 ? (
                  <Text style={styles.warnSmall}>No schools available yet.</Text>
                ) : null}

                {registrationMethod === 'gmail' && (
                  <>
                    <Text style={styles.label}>School document (required)</Text>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => pickImage('verification')}>
                      <Text style={styles.secondaryBtnText}>
                        {verificationAsset ? 'Change document image' : 'Choose document image (JPG, PNG)'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {registrationMethod === 'school_domain' && (
                  <>
                    <Text style={styles.label}>School document (optional)</Text>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => pickImage('verification')}>
                      <Text style={styles.secondaryBtnText}>
                        {verificationAsset ? 'Change document image' : 'Choose document image (optional)'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(t) => setFormData((f) => ({ ...f, email: t }))}
                  placeholder={
                    registrationMethod === 'school_domain' && selectedDomain
                      ? `you@${selectedDomain}`
                      : 'you@example.com'
                  }
                  placeholderTextColor="#8e8e8e"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(t) => setFormData((f) => ({ ...f, password: t }))}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#8e8e8e"
                  secureTextEntry
                  autoComplete="new-password"
                />
                <Text style={styles.label}>Confirm password</Text>
                <TextInput
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChangeText={(t) => setFormData((f) => ({ ...f, confirmPassword: t }))}
                  placeholder="Confirm password"
                  placeholderTextColor="#8e8e8e"
                  secureTextEntry
                  autoComplete="new-password"
                />

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={() => void submitRegister()}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Create account</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}

            {step === 'otp' && (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={styles.titleLeft}>Verify your email</Text>
                <Text style={styles.hint}>
                  We sent a 6-digit code to <Text style={styles.bold}>{otpEmail}</Text>. Check spam if needed.
                </Text>
                {__DEV__ && devOtp ? (
                  <Text style={styles.devOtp}>
                    Development: use OTP {devOtp}
                  </Text>
                ) : null}
                {error ? <Text style={styles.err}>{error}</Text> : null}
                {resendSuccess ? <Text style={styles.ok}>A new code was sent.</Text> : null}
                <Text style={styles.label}>One-time password</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otpValue}
                  onChangeText={(t) => setOtpValue(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor="#8e8e8e"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, (loading || otpValue.length !== 6) && styles.btnDisabled]}
                  onPress={() => void submitOtp()}
                  disabled={loading || otpValue.length !== 6}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.outlineBtn, (resendLoading || loading) && styles.btnDisabled]}
                  onPress={() => void handleResendOtp()}
                  disabled={resendLoading || loading}
                >
                  <Text style={styles.outlineBtnText}>{resendLoading ? 'Sending…' : 'Resend OTP'}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {step === 'pending' && (
              <View>
                <Text style={styles.titleCenter}>Pending approval</Text>
                <Text style={styles.hintCenter}>
                  Your registration was sent to your school admin. You can log in after they approve, using the same
                  email and password you set.
                </Text>
                <TouchableOpacity style={styles.outlineDarkBtn} onPress={goToLoginFromPending}>
                  <Text style={styles.outlineDarkBtnText}>Go to login</Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>

      <Modal visible={showSchoolPicker} transparent animationType="fade">
        <Pressable style={styles.pickerOverlay} onPress={() => setShowSchoolPicker(false)}>
          <Pressable style={styles.pickerBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>Select school</Text>
            <FlatList
              data={schools}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => {
                    setFormData((f) => ({ ...f, schoolId: item.id }));
                    setShowSchoolPicker(false);
                  }}
                >
                  <Text style={styles.pickerRowText}>
                    {item.name}
                    {item.domain ? ` (${item.domain})` : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.pickerCancel} onPress={() => setShowSchoolPicker(false)}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
  },
  overlayPress: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
    paddingBottom: 48,
  },
  box: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: '#1a1f2e',
  },
  closeText: {
    fontSize: 28,
    color: '#6c757d',
    lineHeight: 32,
  },
  brand: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1f2e',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1f2e',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleLeft: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1f2e',
    marginBottom: 8,
  },
  titleCenter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1f2e',
    textAlign: 'center',
    marginBottom: 12,
  },
  sub: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  hint: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 18,
  },
  hintCenter: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: '#1a1f2e',
  },
  optionPrimary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#212529',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optionOutline: {
    borderWidth: 1,
    borderColor: '#212529',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1f2e',
    marginBottom: 6,
    textAlign: 'center',
  },
  optionDesc: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 18,
  },
  scrollForm: {
    maxHeight: 520,
  },
  scrollFormContent: {
    paddingBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1f2e',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
    color: '#1a1f2e',
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  schoolSelected: { color: '#1a1f2e', fontSize: 16 },
  schoolPlaceholder: { color: '#8e8e8e', fontSize: 16 },
  err: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 8,
  },
  warn: {
    color: '#856404',
    fontSize: 13,
    marginBottom: 8,
  },
  warnSmall: {
    color: '#6c757d',
    fontSize: 12,
    marginBottom: 8,
  },
  ok: {
    color: '#198754',
    fontSize: 13,
    marginBottom: 8,
  },
  devOtp: {
    backgroundColor: '#e7f1ff',
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
    color: '#084298',
    marginBottom: 10,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#212529',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  secondaryBtnText: {
    fontSize: 15,
    color: '#1a1f2e',
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#212529',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  outlineBtnText: {
    fontSize: 15,
    color: '#495057',
    fontWeight: '500',
  },
  outlineDarkBtn: {
    borderWidth: 1,
    borderColor: '#212529',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineDarkBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 22,
    fontVariant: ['tabular-nums'],
  },
  btnDisabled: {
    opacity: 0.65,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  pickerBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    maxHeight: '80%',
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1f2e',
  },
  pickerRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  pickerRowText: {
    fontSize: 16,
    color: '#1a1f2e',
  },
  pickerCancel: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  pickerCancelText: {
    fontSize: 16,
    color: '#6c757d',
  },
});
