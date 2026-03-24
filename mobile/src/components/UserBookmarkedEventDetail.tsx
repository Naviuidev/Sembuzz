import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { parseImageUrls } from '../services/publicBlogs';
import { imageSrc } from '../utils/image';
import type { LikedEventItem, SavedEventItem } from '../services/userEvents';

type BookmarkedEvent = LikedEventItem | SavedEventItem;

type Props = {
  visible: boolean;
  event: BookmarkedEvent | null;
  onClose: () => void;
};

export function UserBookmarkedEventDetailModal({ visible, event, onClose }: Props) {
  const { width } = useWindowDimensions();
  const [slideIndex, setSlideIndex] = useState(0);

  const images = useMemo(() => (event ? parseImageUrls(event.imageUrls) : []), [event?.imageUrls]);

  React.useEffect(() => {
    setSlideIndex(0);
  }, [event?.id]);

  if (!event) return null;

  const schoolName = event.school?.name ?? 'School';
  const schoolLogo = event.school?.image ?? null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { maxHeight: '92%' }]}>
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Close">
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
            <View style={styles.cardHeader}>
              {schoolLogo ? (
                <Image source={{ uri: imageSrc(schoolLogo) }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPh}>
                  <Text style={styles.avatarLetter}>{schoolName.charAt(0)?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
              <View style={styles.headerText}>
                <Text style={styles.schoolName}>{schoolName}</Text>
                <Text style={styles.subCat}>{event.subCategory?.name ?? 'Post'}</Text>
              </View>
            </View>

            {images[0] ? (
              <View style={styles.galleryWrap}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const x = e.nativeEvent.contentOffset.x;
                    const idx = Math.round(x / width);
                    if (idx >= 0 && idx < images.length) setSlideIndex(idx);
                  }}
                >
                  {images.map((url, i) => (
                    <View key={i} style={{ width }}>
                      <Image
                        source={{ uri: imageSrc(url) }}
                        style={styles.heroImage}
                        resizeMode="contain"
                      />
                    </View>
                  ))}
                </ScrollView>
                {images.length > 1 ? (
                  <Text style={styles.pageHint}>
                    {slideIndex + 1} / {images.length}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>No image</Text>
              </View>
            )}

            <Text style={styles.title}>{event.title}</Text>
            {event.description ? <Text style={styles.desc}>{event.description}</Text> : null}
            {event.externalLink ? (
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => Linking.openURL(event.externalLink!).catch(() => {})}
              >
                <Text style={styles.linkBtnText}>View link</Text>
              </TouchableOpacity>
            ) : null}
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
    overflow: 'hidden',
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1f2e',
  },
  scrollInner: {
    paddingBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPh: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6c757d',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  subCat: {
    fontSize: 12,
    color: '#8e8e8e',
    marginTop: 2,
  },
  galleryWrap: {
    backgroundColor: '#fafafa',
  },
  heroImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#fafafa',
  },
  pageHint: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6c757d',
    paddingVertical: 8,
  },
  placeholder: {
    height: 200,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#8e8e8e',
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1f2e',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  desc: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  linkBtn: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#212529',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  linkBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
