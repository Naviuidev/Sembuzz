import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import type { LikedEventItem, SavedEventItem } from '../services/userEvents';
import type { ApprovedEventPublic } from '../services/events';
import { EventPostDetailBody } from './EventPostPublicContent';

type BookmarkedEvent = LikedEventItem | SavedEventItem | ApprovedEventPublic;

type Props = {
  visible: boolean;
  event: BookmarkedEvent | null;
  onClose: () => void;
};

export function UserBookmarkedEventDetailModal({ visible, event, onClose }: Props) {
  if (!event) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { maxHeight: '92%' }]}>
          <View style={styles.sheetHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={onClose} hitSlop={12} accessibilityLabel="Close">
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
            <EventPostDetailBody event={event} showHero />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { fontSize: 20, color: '#1a1f2e' },
  backText: { fontSize: 16, fontWeight: '500', color: '#1a1f2e' },
  scrollInner: { paddingHorizontal: 16, paddingVertical: 16 },
});
