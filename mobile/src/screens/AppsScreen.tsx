import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { getSchoolSocialAccounts, SchoolSocialAccountPublic } from '../services/userSchoolSocial';

function groupAccountsByPage(accounts: SchoolSocialAccountPublic[]) {
  const map = new Map<string, SchoolSocialAccountPublic[]>();
  for (const a of accounts) {
    const key = `${a.pageName}|${a.icon}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return Array.from(map.entries()).map(([key, list]) => {
    const first = list[0];
    return { key, pageName: first.pageName, icon: first.icon, accounts: list };
  });
}

export default function AppsScreen() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SchoolSocialAccountPublic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getSchoolSocialAccounts();
      setAccounts(list);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const groups = groupAccountsByPage(accounts);
  const displayTitle = user?.schoolName?.trim() || 'Sembuzz';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{displayTitle}</Text>
        <Text style={styles.followTitle}>Follow us</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#1a1f2e" style={{ marginVertical: 24 }} />
        ) : user && groups.length > 0 ? (
          groups.map((g) => (
            <View key={g.key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>{g.icon || '🔗'}</Text>
                <Text style={styles.sectionName}>{g.pageName}</Text>
              </View>
              <View style={styles.linksRow}>
                {g.accounts.map((acc) => (
                  <TouchableOpacity
                    key={acc.id}
                    style={styles.socialButton}
                    onPress={() => acc.link && Linking.openURL(acc.link)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.socialButtonText}>{acc.platformName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.hint}>
            {user ? 'No social accounts for your school yet.' : 'Log in to see your school\'s social accounts.'}
          </Text>
        )}
        {user && groups.length > 0 && (
          <Text style={styles.hint}>Your school&apos;s social accounts.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1f2e',
    textAlign: 'left',
    marginBottom: 8,
  },
  followTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1f2e',
    textAlign: 'left',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 72,
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    color: '#8e8e8e',
    textAlign: 'left',
    marginTop: 8,
  },
});
