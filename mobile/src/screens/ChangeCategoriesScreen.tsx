import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import type { MainTabParamList, SettingsStackParamList } from '../navigation/types';
import { getCategoriesBySchool, type CategoryPublic } from '../services/events';
import {
  getUserSubCategoryIds,
  setUserCategoryDone,
  setUserSubCategoryIds,
} from '../utils/userCategoryPrefs';
import { userNotificationsService } from '../services/userNotifications';
import { CATEGORY_PREFS_CHANGED } from '../constants/appEvents';

export default function ChangeCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'ChangeCategories'>>();
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryPublic[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [snapshotIds, setSnapshotIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.schoolId || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [cats, localIds] = await Promise.all([
        getCategoriesBySchool(user.schoolId),
        getUserSubCategoryIds(user.id),
      ]);
      let ids = [...localIds];
      try {
        const remote = await userNotificationsService.getSubcategories();
        if (remote.subCategoryIds.length > 0) {
          ids = remote.subCategoryIds;
          await setUserSubCategoryIds(user.id, ids);
        }
      } catch {
        /* offline */
      }
      setCategories(Array.isArray(cats) ? cats : []);
      setSelectedIds(ids);
      setSnapshotIds(ids.slice());
    } catch {
      Alert.alert('Error', 'Could not load categories. Try again.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.schoolId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const toggleSub = (subId: string) => {
    setSelectedIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId],
    );
  };

  const onCancel = () => {
    setSelectedIds(snapshotIds.slice());
  };

  const onSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await setUserCategoryDone(user.id, 'true');
      await setUserSubCategoryIds(user.id, selectedIds);
      try {
        await userNotificationsService.setSubcategories(selectedIds);
      } catch {
        /* push sync optional */
      }
      setSnapshotIds(selectedIds.slice());
      DeviceEventEmitter.emit(CATEGORY_PREFS_CHANGED);
      navigation.popToTop();
      const tabNav = navigation.getParent() as BottomTabNavigationProp<MainTabParamList> | undefined;
      tabNav?.navigate('Events');
    } catch {
      Alert.alert('Error', 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user?.schoolId) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centered}>
          <Text style={styles.muted}>
            Your account must be linked to a school to change categories.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.flex}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1a1f2e" />
            <Text style={styles.muted}>Loading categories…</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.intro}>
              Choose the categories and subcategories you want to see in your home feed.
            </Text>
            {categories.length === 0 ? (
              <Text style={styles.muted}>No categories available for your school yet.</Text>
            ) : (
              categories.map((cat) => (
                <View key={cat.id} style={styles.categoryBlock}>
                  <Text style={styles.categoryBlockTitle}>{cat.name}</Text>
                  <View style={styles.categorySubRow}>
                    {(cat.subcategories ?? []).map((sub) => {
                      const isSelected = selectedIds.includes(sub.id);
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          style={[styles.subCatPill, isSelected ? styles.subCatPillOn : styles.subCatPillOff]}
                          onPress={() => toggleSub(sub.id)}
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
          </ScrollView>
        )}

        <View
          style={[
            styles.footerBar,
            { paddingBottom: Math.max(insets.bottom, 12) + 8 },
          ]}
        >
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.btnOutlineDark}
              onPress={onCancel}
              disabled={saving || loading}
            >
              <Text style={styles.btnOutlineDarkText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnDark, saving && styles.btnDisabled]}
              onPress={onSave}
              disabled={saving || loading}
            >
              <Text style={styles.btnDarkText}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  muted: {
    marginTop: 12,
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  intro: {
    fontSize: 14,
    color: '#5f6b7a',
    lineHeight: 20,
    marginBottom: 16,
  },
  categoryBlock: {
    marginBottom: 16,
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
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
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
  footerBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dee2e6',
    backgroundColor: '#fafafa',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  btnOutlineDark: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#212529',
    backgroundColor: '#fff',
  },
  btnOutlineDarkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
  },
  btnDark: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#212529',
  },
  btnDarkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
