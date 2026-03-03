import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
  useWindowDimensions,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SearchIcon from 'react-native-bootstrap-icons/icons/search';
import BuildingIcon from 'react-native-bootstrap-icons/icons/building';
import TagsIcon from 'react-native-bootstrap-icons/icons/tags';
import FunnelIcon from 'react-native-bootstrap-icons/icons/funnel';
import { getApprovedEvents, imageSrc, ApprovedEventPublic } from '../services/events';
import { getSchools, SchoolOption } from '../services/userAuth';
import { useAuth } from '../contexts/AuthContext';

const FILTER_ICON_SIZE = 20;

/** Renders school logo (image or initial letter). Handles image load error so the logo area always shows. */
function CompactSchoolLogo({
  school,
  style,
}: {
  school: { name?: string | null; image?: string | null } | null | undefined;
  style?: { width?: number; height?: number; borderRadius?: number };
}) {
  const [imageError, setImageError] = useState(false);
  const logoUrl = school?.image && !imageError ? imageSrc(school.image) : '';
  const letter = school?.name?.charAt(0)?.toUpperCase() ?? '?';
  const size = style?.width ?? 40;
  const borderRadius = style?.borderRadius ?? 8;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: 'rgba(26,31,46,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        },
      ]}
    >
      {logoUrl ? (
        <Image
          source={{ uri: logoUrl }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : null}
      {!logoUrl ? (
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a1f2e' }}>{letter}</Text>
      ) : null}
    </View>
  );
}

export default function SearchScreen() {
  const { user } = useAuth();
  const searchInputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<ApprovedEventPublic[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ApprovedEventPublic | null>(null);
  const [filterPopupOpen, setFilterPopupOpen] = useState(false);
  const [categoryLoginMessage, setCategoryLoginMessage] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const { width } = useWindowDimensions();

  const openFilterPopup = () => {
    setCategoryLoginMessage(false);
    setFilterPopupOpen(true);
  };

  const closeFilterPopup = () => {
    setFilterPopupOpen(false);
    setCategoryLoginMessage(false);
  };

  const handleSearchNews = () => {
    closeFilterPopup();
    setQuery('');
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleFilterBySchool = () => {
    closeFilterPopup();
    setFilterModalVisible(true);
  };

  const handleFilterViaCategories = () => {
    setCategoryLoginMessage(true);
  };

  const fetchEvents = useCallback(async () => {
    const list = await getApprovedEvents(selectedSchoolId ?? undefined, undefined);
    setEvents(list);
  }, [selectedSchoolId]);

  const fetchSchools = useCallback(async () => {
    setSchoolsLoading(true);
    try {
      const list = await getSchools();
      setSchools(list);
    } catch {
      setSchools([]);
    } finally {
      setSchoolsLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEvents().finally(() => setLoading(false));
  }, [fetchEvents]);

  useEffect(() => {
    if (filterModalVisible) fetchSchools();
  }, [filterModalVisible, fetchSchools]);

  useEffect(() => {
    if (!filterPopupOpen) setCategoryLoginMessage(false);
  }, [filterPopupOpen]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents().finally(() => setRefreshing(false));
  }, [fetchEvents]);

  const filtered = query.trim()
    ? events.filter(
        (e) =>
          e.title?.toLowerCase().includes(query.toLowerCase()) ||
          e.description?.toLowerCase().includes(query.toLowerCase()) ||
          e.school?.name?.toLowerCase().includes(query.toLowerCase()) ||
          e.subCategory?.name?.toLowerCase().includes(query.toLowerCase()),
      )
    : events;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const clearSchoolFilter = () => {
    setSelectedSchoolId(null);
    setFilterModalVisible(false);
  };

  const selectSchool = (id: string) => {
    setSelectedSchoolId(id);
    setFilterModalVisible(false);
  };

  // Compact list item (logo, title, subtitle) - same as web when no school selected
  const renderCompactItem = ({ item }: { item: ApprovedEventPublic }) => (
    <TouchableOpacity
      style={styles.compactRow}
      onPress={() => setSelectedEvent(item)}
      activeOpacity={0.7}
    >
      <CompactSchoolLogo school={item.school} style={styles.compactLogo} />
      <View style={styles.compactText}>
        <Text style={styles.compactTitle}>{item.title}</Text>
        <Text style={styles.compactSub}>{item.school?.name ?? 'School'}</Text>
      </View>
    </TouchableOpacity>
  );

  // Full card (same as EventsScreen) - when school selected or when viewing single event
  const renderFullCard = (item: ApprovedEventPublic) => {
    const images = item.imageUrls
      ? (() => {
          try {
            const parsed = JSON.parse(item.imageUrls);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];
    const firstImage = images[0];

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {item.school?.image ? (
            <Image source={{ uri: imageSrc(item.school.image) }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>{item.school?.name?.charAt(0) ?? '?'}</Text>
            </View>
          )}
          <View style={styles.cardHeaderText}>
            <Text style={styles.schoolName}>{item.school?.name ?? 'School'}</Text>
            <Text style={styles.subCategory}>{item.subCategory?.name ?? ''}</Text>
          </View>
        </View>
        {firstImage ? (
          <Image
            source={{ uri: imageSrc(firstImage) }}
            style={[styles.cardImage, { width: width - 32 }]}
            resizeMode="cover"
          />
        ) : null}
        <View style={styles.cardBody}>
          <Text style={styles.title}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.description} numberOfLines={10}>
              {item.description}
            </Text>
          ) : null}
          {item.externalLink ? (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => item.externalLink && Linking.openURL(item.externalLink)}
            >
              <Text style={styles.linkButtonText}>View link</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.date}>{formatDate(item.updatedAt)}</Text>
        </View>
      </View>
    );
  };

  const showCompactList = !selectedSchoolId && !selectedEvent;
  const showFullCards = selectedSchoolId && !selectedEvent;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search bar row: search input then filter button on the right (opens filter popup) */}
      <View style={styles.headerStrip}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search news..."
          placeholderTextColor="#8e8e8e"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.headerFilterBtn}
          onPress={openFilterPopup}
          accessibilityLabel="Filter options"
        >
          <FunnelIcon width={FILTER_ICON_SIZE} height={FILTER_ICON_SIZE} fill="#fff" />
        </TouchableOpacity>
      </View>

      {/* Selected school: Change school / Show all */}
      {selectedSchoolId && (
        <View style={styles.schoolActions}>
          <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
            <Text style={styles.schoolActionLink}>← Change school</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearSchoolFilter}>
            <Text style={styles.schoolActionMuted}>Show all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Browse category pill */}
      <View style={styles.section}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Browse category</Text>
        </View>
        {!user && (
          <Text style={styles.signInHint}>Sign in to avail this filter.</Text>
        )}
      </View>

      {/* Results pill */}
      <View style={styles.section}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Results</Text>
        </View>
      </View>

      {/* Back to results when viewing single event */}
      {selectedEvent && (
        <TouchableOpacity style={styles.backLink} onPress={() => setSelectedEvent(null)}>
          <Text style={styles.backLinkText}>← Back to results</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      {selectedEvent ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.cardContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderFullCard(selectedEvent)}
        </ScrollView>
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a1f2e" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {query.trim()
              ? 'No news match your search.'
              : selectedSchoolId
                ? 'No approved news for this school yet.'
                : 'No approved news yet.'}
          </Text>
        </View>
      ) : showFullCards ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderFullCard(item)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderCompactItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* Filter events popup - same as web: 3 options, category login message */}
      <Modal
        visible={filterPopupOpen}
        transparent
        animationType="fade"
        onRequestClose={closeFilterPopup}
      >
        <Pressable style={styles.filterPopupOverlay} onPress={closeFilterPopup}>
          <Pressable style={styles.filterPopupContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.filterPopupTitle}>Filter events</Text>
            <View style={styles.filterPopupButtons}>
              <TouchableOpacity
                style={styles.filterPopupBtn}
                onPress={handleSearchNews}
                activeOpacity={0.8}
              >
                <SearchIcon width={20} height={20} fill="#fff" />
                <Text style={styles.filterPopupBtnText}>Search news</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterPopupBtn}
                onPress={handleFilterBySchool}
                activeOpacity={0.8}
              >
                <BuildingIcon width={20} height={20} fill="#fff" />
                <Text style={styles.filterPopupBtnText}>Filter by school</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterPopupBtn}
                onPress={handleFilterViaCategories}
                activeOpacity={0.8}
              >
                <TagsIcon width={20} height={20} fill="#fff" />
                <Text style={styles.filterPopupBtnText}>Filter via categories</Text>
              </TouchableOpacity>
              {categoryLoginMessage && (
                <View style={styles.filterCategoryMessage}>
                  <Text style={styles.filterCategoryMessageText}>
                    This feature requires login. Sign in to filter by categories and subcategories.
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Filter modal: school selection */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a school</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            {selectedSchoolId && (
              <TouchableOpacity style={styles.showAllInModal} onPress={clearSchoolFilter}>
                <Text style={styles.schoolActionLink}>Show all</Text>
              </TouchableOpacity>
            )}
            {schoolsLoading ? (
              <ActivityIndicator size="small" color="#1a1f2e" style={{ marginVertical: 24 }} />
            ) : schools.length === 0 ? (
              <Text style={styles.noSchools}>No schools found.</Text>
            ) : (
              <ScrollView style={styles.schoolsList}>
                {schools.map((s) => {
                  const isSelected = selectedSchoolId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.schoolItem, isSelected && styles.schoolItemSelected]}
                      onPress={() => selectSchool(s.id)}
                    >
                      {s.image ? (
                        <Image source={{ uri: imageSrc(s.image) }} style={styles.schoolItemLogo} />
                      ) : (
                        <View style={styles.schoolItemLogoPlaceholder}>
                          <Text style={styles.schoolItemLogoLetter}>{s.name?.charAt(0) ?? '?'}</Text>
                        </View>
                      )}
                      <Text style={styles.schoolItemName}>{s.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    marginTop: 4,
  },
  headerFilterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  filterPopupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  filterPopupContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxWidth: 380,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  filterPopupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1f2e',
    marginBottom: 16,
  },
  filterPopupButtons: {
    gap: 10,
  },
  filterPopupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#212529',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  filterPopupBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  filterCategoryMessage: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  filterCategoryMessageText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1f2e',
  },
  schoolActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
  },
  schoolActionLink: {
    fontSize: 14,
    color: '#4d7cfe',
    fontWeight: '500',
  },
  schoolActionMuted: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 6,
    marginTop: 12,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1f2e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop:10
  },
  pillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  signInHint: {
    fontSize: 13,
    color: '#8e8e8e',
    marginTop: 8,
  },
  backLink: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  backLinkText: {
    fontSize: 14,
    color: '#4d7cfe',
  },
  scroll: {
    flex: 1,
  },
  cardContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#6c757d',
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 16,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  compactLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  compactLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(26,31,46,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactLogoLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  compactText: {
    marginLeft: 12,
    flex: 1,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  compactSub: {
    fontSize: 13,
    color: '#8e8e8e',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6c757d',
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  subCategory: {
    fontSize: 12,
    color: '#8e8e8e',
    marginTop: 2,
  },
  cardImage: {
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  cardBody: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1f2e',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 8,
  },
  linkButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#212529',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: '#8e8e8e',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1f2e',
  },
  modalClose: {
    fontSize: 15,
    color: '#6c757d',
  },
  showAllInModal: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noSchools: {
    textAlign: 'center',
    color: '#8e8e8e',
    paddingVertical: 24,
  },
  schoolsList: {
    padding: 16,
  },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  schoolItemSelected: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  schoolItemLogo: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  schoolItemLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(26,31,46,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolItemLogoLetter: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  schoolItemName: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1f2e',
    flex: 1,
  },
});
