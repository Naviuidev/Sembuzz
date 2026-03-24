import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { imageSrc } from '../utils/image';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const EDIT_AVATAR_RING = 64;
const EDIT_AVATAR_STROKE = 6;
const EDIT_AVATAR_INNER = 52;
const EDIT_AVATAR_R = EDIT_AVATAR_RING / 2 - EDIT_AVATAR_STROKE / 2;
const EDIT_AVATAR_GRAD_ID = 'editProfileAvatarRing';

type UpdateProfileResponse = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  schoolId: string;
  schoolName?: string;
  schoolImage?: string;
  profilePicUrl?: string;
};

export default function EditProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, setUser, logout } = useAuth();
  const [firstName, setFirstName] = useState(
    user?.firstName?.trim() || user?.name?.split(' ').slice(0, 1).join(' ') || '',
  );
  const [lastName, setLastName] = useState(
    user?.lastName?.trim() || user?.name?.split(' ').slice(1).join(' ') || '',
  );
  const [profilePicUrl, setProfilePicUrl] = useState(user?.profilePicUrl || '');
  const [showEmailTooltip, setShowEmailTooltip] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedImageUrl = useMemo(() => imageSrc(profilePicUrl), [profilePicUrl]);

  const showEmailLockedTooltip = () => {
    setShowEmailTooltip(true);
    setTimeout(() => setShowEmailTooltip(false), 2000);
  };

  const handleUploadPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo library access to upload profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const ext = uri.split('.').pop()?.toLowerCase();
    const fileName = `profile-${Date.now()}.${ext || 'jpg'}`;
    const mimeType = asset.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg');

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    } as any);

    setUploading(true);
    setError(null);
    try {
      const uploadRes = await api.post<{ url: string }>('/user/auth/upload-profile-pic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (uploadRes.data?.url) {
        setProfilePicUrl(uploadRes.data.url);
      }
    } catch {
      setError('Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    if (changePassword) {
      if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
        setError('Fill current password, new password and confirm password.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirm password do not match.');
        return;
      }
    }

    const passwordChangeRequested = changePassword;

    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, string> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profilePicUrl: profilePicUrl.trim(),
      };

      if (passwordChangeRequested) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
        payload.confirmPassword = confirmPassword;
      }

      const res = await api.post<UpdateProfileResponse>('/user/auth/update-profile', payload);
      const updatedUser = res.data;

      if (passwordChangeRequested) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setChangePassword(false);
        await logout();
        Alert.alert('Password updated', 'Please sign in again with your new password.', [
          {
            text: 'OK',
            onPress: () =>
              navigation.navigate(
                'MainTabs',
                { screen: 'Settings', params: { screen: 'SettingsMain' } } as never,
              ),
          },
        ]);
        return;
      }

      setUser({
        id: updatedUser.id,
        name: updatedUser.name,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        schoolId: updatedUser.schoolId ?? null,
        schoolName: updatedUser.schoolName ?? null,
        schoolImage: updatedUser.schoolImage,
        profilePicUrl: updatedUser.profilePicUrl,
      });

      Alert.alert('Profile updated', 'Your profile details were saved successfully.');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(typeof msg === 'string' ? msg : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 82 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Edit profile</Text>

        <View style={styles.picRow}>
          <TouchableOpacity
            onPress={handleUploadPhoto}
            disabled={uploading}
            activeOpacity={0.85}
            accessibilityLabel="Change profile photo"
            accessibilityRole="button"
            style={styles.avatarRingTouchable}
          >
            <View style={styles.avatarRingOuter}>
              <Svg width={EDIT_AVATAR_RING} height={EDIT_AVATAR_RING} style={styles.avatarRingSvg}>
                <Defs>
                  <LinearGradient id={EDIT_AVATAR_GRAD_ID} x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#ff8c42" />
                    <Stop offset="45%" stopColor="#4dabf7" />
                    <Stop offset="100%" stopColor="#a855f7" />
                  </LinearGradient>
                </Defs>
                <Circle
                  cx={EDIT_AVATAR_RING / 2}
                  cy={EDIT_AVATAR_RING / 2}
                  r={EDIT_AVATAR_R}
                  stroke={`url(#${EDIT_AVATAR_GRAD_ID})`}
                  strokeWidth={EDIT_AVATAR_STROKE}
                  fill="none"
                />
              </Svg>
              {resolvedImageUrl ? (
                <Image source={{ uri: resolvedImageUrl }} style={styles.avatarInner} />
              ) : (
                <View style={styles.avatarPlaceholderInner}>
                  <Ionicons name="person" size={32} color="#8b9198" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadPhoto} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color="#111" />
            ) : (
              <Text style={styles.uploadBtnText}>Upload photo</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>PERSONAL DETAILS</Text>

        <Text style={styles.fieldLabel}>First name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First name"
          placeholderTextColor="#9aa0a6"
        />

        <Text style={styles.fieldLabel}>Last name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last name"
          placeholderTextColor="#9aa0a6"
        />

        <Text style={styles.fieldLabel}>Email address</Text>
        <View style={styles.emailRow}>
          <TextInput
            style={[styles.input, styles.emailInput]}
            value={user?.email ?? ''}
            editable={false}
            selectTextOnFocus={false}
          />
          <Pressable onPress={showEmailLockedTooltip} hitSlop={10}>
            <Text style={styles.editTextDisabled}>Edit</Text>
          </Pressable>
        </View>
        {showEmailTooltip ? <Text style={styles.tooltip}>Email id cannot be edited</Text> : null}

        <View style={styles.passwordToggleRow}>
          <Text style={styles.fieldLabel}>Change password</Text>
          <Pressable onPress={() => setChangePassword((prev) => !prev)} style={styles.toggleBtn}>
            <Text style={styles.toggleBtnText}>{changePassword ? 'Selected' : 'Select'}</Text>
          </Pressable>
        </View>

        {changePassword ? (
          <View style={styles.passwordFieldsWrap}>
            <Text style={styles.fieldLabel}>Current password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              placeholderTextColor="#9aa0a6"
            />
            <Text style={styles.fieldLabel}>New password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              placeholderTextColor="#9aa0a6"
            />
            <Text style={styles.fieldLabel}>Confirm password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              placeholderTextColor="#9aa0a6"
            />
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitBtn, (saving || uploading) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={saving || uploading}
          >
            <Text style={styles.submitBtnText}>{saving ? 'Submitting...' : 'Submit'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  keyboardWrap: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 140, flexGrow: 1 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1f2e',
    marginBottom: 16,
    textAlign: 'center',
    width: '100%',
  },
  picRow: { alignItems: 'center', marginBottom: 20 },
  avatarRingTouchable: {
    borderRadius: EDIT_AVATAR_RING / 2,
    marginBottom: 10,
  },
  avatarRingOuter: {
    width: EDIT_AVATAR_RING,
    height: EDIT_AVATAR_RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingSvg: { position: 'absolute', top: 0, left: 0 },
  avatarInner: {
    width: EDIT_AVATAR_INNER,
    height: EDIT_AVATAR_INNER,
    borderRadius: EDIT_AVATAR_INNER / 2,
    backgroundColor: '#e9ecef',
  },
  avatarPlaceholderInner: {
    width: EDIT_AVATAR_INNER,
    height: EDIT_AVATAR_INNER,
    borderRadius: EDIT_AVATAR_INNER / 2,
    backgroundColor: '#eef1f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtn: {
    borderWidth: 1,
    borderColor: '#d7dce2',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  uploadBtnText: { fontSize: 14, color: '#1a1f2e', fontWeight: '600' },
  sectionLabel: { fontSize: 12, letterSpacing: 0.8, color: '#8a9099', marginBottom: 12, fontWeight: '700' },
  fieldLabel: { fontSize: 13, color: '#6c757d', marginBottom: 6, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#e4e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#1a1f2e',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emailInput: { flex: 1, backgroundColor: '#f3f5f7', color: '#8f96a0' },
  editTextDisabled: { color: '#8f96a0', fontWeight: '600', fontSize: 14 },
  tooltip: { marginTop: -6, marginBottom: 10, color: '#dc3545', fontSize: 12 },
  passwordToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  toggleBtn: {
    borderWidth: 1,
    borderColor: '#e4e7eb',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
  },
  toggleBtnText: { fontSize: 12, color: '#1a1f2e', fontWeight: '600' },
  passwordFieldsWrap: { marginTop: 4 },
  errorText: { color: '#dc3545', fontSize: 13, marginBottom: 12 },
  submitBtn: {
    marginTop: 8,
    backgroundColor: '#111315',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
