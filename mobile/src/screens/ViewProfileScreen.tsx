import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { imageSrc } from '../utils/image';

export default function ViewProfileScreen() {
  const { user } = useAuth();
  const avatarUrl = useMemo(() => imageSrc(user?.profilePicUrl || ''), [user?.profilePicUrl]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        

        <View style={styles.heroCard}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={52} color="#7d8590" />
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionLabel}>PROFILE DETAILS</Text>

          <View style={styles.row}>
            <Text style={styles.label}>First name</Text>
            <Text style={styles.value}>{user?.firstName || user?.name?.split(' ')[0] || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Last name</Text>
            <Text style={styles.value}>{user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>School</Text>
            <Text style={styles.value}>{user?.schoolName || '-'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 32 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1f2e',
    marginBottom: 14,
    textAlign: 'center',
    width: '100%',
  },
  heroCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 14,
    backgroundColor: '#ffffff',
  },
  avatar: { width: 170, height: 170, borderRadius: 85, backgroundColor: '#ffffff' },
  avatarPlaceholder: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#eef1f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    borderWidth: 1,
    borderColor: '#edf0f2',
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 14,
  },
  sectionLabel: { fontSize: 12, color: '#8a9099', fontWeight: '700', letterSpacing: 0.7, marginBottom: 8 },
  row: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e7ebef' },
  label: { fontSize: 12, color: '#7c8590', marginBottom: 2 },
  value: { fontSize: 15, color: '#1a1f2e', fontWeight: '600' },
});
