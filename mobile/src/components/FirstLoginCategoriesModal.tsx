import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { CategoryPublic } from '../services/events';
import { authModalTheme } from '../styles/authModalTheme';

type Props = {
  visible: boolean;
  categories: CategoryPublic[];
  categoriesLoading: boolean;
  selectedSubCategoryIds: string[];
  saving: boolean;
  onToggleSubCategory: (subId: string) => void;
  onSkip: () => void;
  onNext: () => void;
};

export function FirstLoginCategoriesModal({
  visible,
  categories,
  categoriesLoading,
  selectedSubCategoryIds,
  saving,
  onToggleSubCategory,
  onSkip,
  onNext,
}: Props) {
  if (!visible) return null;

  const selectedCount = selectedSubCategoryIds.length;

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      onRequestClose={() => {
        if (!saving) onSkip();
      }}
    >
      <Pressable
        style={styles.overlay}
        onPress={() => {
          if (!saving) onSkip();
        }}
      >
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title} accessibilityRole="header">
            Select your categories
          </Text>
          <Text style={styles.desc}>
            Tap the topics you care about. We'll tailor your home feed — or skip to see all school news.
            You can change this anytime in Settings.
          </Text>

          {selectedCount > 0 ? (
            <View style={styles.selectionBadge}>
              <Text style={styles.selectionBadgeText}>
                {selectedCount} selected
              </Text>
            </View>
          ) : null}

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {categoriesLoading || categories.length === 0 ? (
              <ActivityIndicator color={authModalTheme.primary} style={styles.loader} />
            ) : (
              categories.map((cat) => (
                <View key={cat.id} style={styles.categoryBlock}>
                  <Text style={styles.categoryTitle}>{cat.name}</Text>
                  <View style={styles.subRow}>
                    {(cat.subcategories ?? []).length === 0 ? (
                      <Text style={styles.emptySub}>No subcategories yet</Text>
                    ) : (
                      (cat.subcategories ?? []).map((sub) => {
                        const isSelected = selectedSubCategoryIds.includes(sub.id);
                        return (
                          <TouchableOpacity
                            key={sub.id}
                            style={[styles.subPill, isSelected ? styles.subPillOn : styles.subPillOff]}
                            onPress={() => !saving && onToggleSubCategory(sub.id)}
                            activeOpacity={0.85}
                            disabled={saving}
                          >
                            <Text style={[styles.subPillText, isSelected && styles.subPillTextOn]}>
                              {sub.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btnSkip, saving && styles.btnDisabled]}
              onPress={onSkip}
              activeOpacity={0.85}
              disabled={saving}
            >
              <Text style={styles.btnSkipText}>{saving ? 'Please wait…' : 'Skip'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnNext, saving && styles.btnDisabled]}
              onPress={onNext}
              activeOpacity={0.85}
              disabled={saving}
            >
              <Text style={styles.btnNextText}>{saving ? 'Saving…' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: authModalTheme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#e8ecf0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1f2e',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 21,
    marginBottom: 12,
  },
  selectionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: authModalTheme.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: authModalTheme.pillRadius,
    marginBottom: 8,
  },
  selectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: authModalTheme.primaryDark,
  },
  list: {
    flexGrow: 0,
    maxHeight: 400,
  },
  listContent: {
    paddingBottom: 8,
  },
  loader: {
    marginVertical: 28,
  },
  categoryBlock: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: authModalTheme.loginPanelBg,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 10,
  },
  subRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#6c757d',
  },
  subPill: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: authModalTheme.pillRadius,
    borderWidth: 1,
  },
  subPillOff: {
    borderColor: '#cfe2ff',
    backgroundColor: '#f4f8fc',
  },
  subPillOn: {
    borderColor: '#86D9A0',
    backgroundColor: '#DDFBE2',
  },
  subPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  subPillTextOn: {
    fontWeight: '700',
    color: authModalTheme.successDark,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  btnSkip: {
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: authModalTheme.pillRadius,
    borderWidth: 1,
    borderColor: '#212529',
    backgroundColor: '#fff',
  },
  btnSkipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
  },
  btnNext: {
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: authModalTheme.pillRadius,
    backgroundColor: '#212529',
  },
  btnNextText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
