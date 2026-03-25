import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../contexts/AuthContext';
import { getFrontendBaseUrl } from '../config/env';
import { api } from '../config/api';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const BASE_URL = getFrontendBaseUrl();

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openWebUrl = async (path: string) => {
    try {
      await Linking.openURL(`${BASE_URL}${path}`);
    } catch {
      Alert.alert('Unable to open link', 'Please try again later.');
    }
  };

  const handleDeleteAccount = async () => {
    const password = deletePassword.trim();
    if (!password) {
      setDeleteError('Enter your password to continue.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.post('/user/auth/delete-account', { password });
      setShowDeleteModal(false);
      await logout();
      Alert.alert('Account deleted', 'Your account was deleted successfully.');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setDeleteError(typeof msg === 'string' ? msg : 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Account options</Text>
        <Text style={styles.subheading}>Manage your profile, legal pages, and account actions.</Text>

        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('EditProfile')}>
          <View style={styles.optionLeft}>
            <Ionicons name="create-outline" size={20} color="#1a1f2e" />
            <Text style={styles.optionText}>Edit profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6c757d" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('ViewProfile')}>
          <View style={styles.optionLeft}>
            <Ionicons name="person-outline" size={20} color="#1a1f2e" />
            <Text style={styles.optionText}>View profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6c757d" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => openWebUrl('/#privacy')}>
          <View style={styles.optionLeft}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#1a1f2e" />
            <Text style={styles.optionText}>Privacy policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6c757d" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => openWebUrl('/#terms-of-service')}>
          <View style={styles.optionLeft}>
            <Ionicons name="document-text-outline" size={20} color="#1a1f2e" />
            <Text style={styles.optionText}>Terms and conditions</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6c757d" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => openWebUrl('/#community-guidelines')}>
          <View style={styles.optionLeft}>
            <Ionicons name="people-outline" size={20} color="#1a1f2e" />
            <Text style={styles.optionText}>Community guideline</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6c757d" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, styles.deleteOption]}
          onPress={() => {
            setDeletePassword('');
            setDeleteError(null);
            setShowDeleteModal(true);
          }}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="trash-outline" size={20} color="#dc3545" />
            <Text style={styles.deleteOptionText}>Delete account</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#dc3545" />
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !deleteLoading && setShowDeleteModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => !deleteLoading && setShowDeleteModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Delete account</Text>
            <Text style={styles.modalDesc}>This action is permanent. Enter your password to continue.</Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#8e8e8e"
              value={deletePassword}
              onChangeText={(value) => {
                setDeletePassword(value);
                setDeleteError(null);
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              cursorColor="#1a1f2e"
              selectionColor="rgba(26, 31, 46, 0.25)"
            />
            {deleteError ? <Text style={styles.errorText}>{deleteError}</Text> : null}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => !deleteLoading && setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteBtn, (!deletePassword.trim() || deleteLoading) && styles.disabled]}
                onPress={handleDeleteAccount}
                disabled={!deletePassword.trim() || deleteLoading}
              >
                <Text style={styles.confirmDeleteBtnText}>{deleteLoading ? 'Deleting...' : 'Delete account'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '700', color: '#1a1f2e' },
  subheading: { marginTop: 6, marginBottom: 16, fontSize: 14, color: '#6c757d' },
  option: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eceef2',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionText: { fontSize: 15, fontWeight: '500', color: '#1a1f2e' },
  deleteOption: { borderColor: '#f7d7db', backgroundColor: '#fff7f8' },
  deleteOptionText: { fontSize: 15, fontWeight: '600', color: '#dc3545' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginHorizontal: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1f2e', marginBottom: 12 },
  modalDesc: { fontSize: 14, color: '#6c757d', marginBottom: 10 },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1a1f2e',
    marginBottom: 8,
  },
  errorText: { color: '#dc3545', marginBottom: 8, fontSize: 13 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  cancelBtnText: { color: '#6c757d', fontSize: 14, fontWeight: '500' },
  confirmDeleteBtn: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  confirmDeleteBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.6 },
});
