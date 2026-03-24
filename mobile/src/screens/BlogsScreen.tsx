import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  imageSrc,
  listPublicBlogs,
  parseImageUrls,
  PublishedBlogListItem,
} from '../services/publicBlogs';
import { getFrontendBaseUrl } from '../config/env';

function excerpt(text: string, max = 130): string {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export default function BlogsScreen() {
  const webBase = getFrontendBaseUrl();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blogs, setBlogs] = useState<PublishedBlogListItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [sortMode, setSortMode] = useState<'recent' | 'oldest'>('recent');
  const [filterOpen, setFilterOpen] = useState(false);
  const [failedImageKeys, setFailedImageKeys] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const rows = await listPublicBlogs({ q: search || undefined });
      setBlogs(rows);
      setError(null);
    } catch {
      setError('Unable to load blogs right now.');
      setBlogs([]);
    }
  }, [search]);

  React.useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  /** Full post content opens in the website (same routes as web: /blogs/:id). */
  const openBlogInBrowser = useCallback((id: string) => {
    const url = `${webBase}/blogs/${id}`;
    Linking.openURL(url).catch(() => {
      setError('Could not open the blog in your browser.');
    });
  }, [webBase]);

  const openBlogsIndexInBrowser = useCallback(() => {
    Linking.openURL(`${webBase}/blogs`).catch(() => {
      setError('Could not open blogs in your browser.');
    });
  }, [webBase]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    blogs.forEach((b) => {
      if (b.subCategory?.id && b.subCategory?.name && !map.has(b.subCategory.id)) {
        map.set(b.subCategory.id, b.subCategory.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [blogs]);

  const schools = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    blogs.forEach((b) => {
      if (b.school?.id && b.school?.name && !map.has(b.school.id)) {
        map.set(b.school.id, { id: b.school.id, name: b.school.name });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [blogs]);

  const rows = useMemo(() => {
    let list = blogs;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.content.toLowerCase().includes(q) ||
          b.school?.name?.toLowerCase().includes(q),
      );
    }
    if (selectedCategoryId !== 'all') {
      list = list.filter((b) => b.subCategory?.id === selectedCategoryId);
    }
    if (selectedSchoolId !== 'all') {
      list = list.filter((b) => b.school?.id === selectedSchoolId);
    }
    const sorted = [...list].sort((a, b) => {
      const da = new Date(a.publishedAt || a.createdAt).getTime();
      const db = new Date(b.publishedAt || b.createdAt).getTime();
      return sortMode === 'recent' ? db - da : da - db;
    });
    return sorted;
  }, [blogs, search, selectedCategoryId, selectedSchoolId, sortMode]);

  const resolveBlogImage = useCallback(
    (blog: PublishedBlogListItem, keyPrefix: string): string => {
      const candidates = [blog.coverImageUrl, ...parseImageUrls((blog as { imageUrls?: string | null }).imageUrls ?? null)]
        .filter((u): u is string => !!u)
        .map((u) => imageSrc(u));
      return candidates.find((uri, idx) => !failedImageKeys[`${keyPrefix}-${idx}`]) || '';
    },
    [failedImageKeys],
  );

  const markImageFailed = useCallback((key: string) => {
    setFailedImageKeys((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Blogs</Text>
          <TouchableOpacity onPress={openBlogsIndexInBrowser} style={styles.openWebBtn} activeOpacity={0.85}>
            <Text style={styles.openWebBtnText}>Open on website</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerHint}>Tap a post to read it in your browser.</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search blogs..."
          placeholderTextColor="#8e8e8e"
          style={styles.searchInput}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterOpen(true)}>
          <Text style={styles.filterBtnText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a1f2e" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No blogs found.</Text>
        </View>
      ) : (
        <FlatList
          data={rows.slice(1)}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            rows[0] ? (
              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => openBlogInBrowser(rows[0].id)}
                activeOpacity={0.85}
              >
                {resolveBlogImage(rows[0], `featured-${rows[0].id}`) ? (
                  <Image
                    source={{ uri: resolveBlogImage(rows[0], `featured-${rows[0].id}`) }}
                    style={styles.featuredImage}
                    onError={() => markImageFailed(`featured-${rows[0].id}-0`)}
                  />
                ) : null}
                <View style={styles.featuredBody}>
                  <Text style={styles.featuredLabel}>Featured</Text>
                  <Text style={styles.featuredTitle}>{rows[0].title}</Text>
                  <Text style={styles.featuredMeta}>
                    {rows[0].school?.name} · {rows[0].subCategory?.name}
                  </Text>
                  <Text style={styles.featuredExcerpt}>{excerpt(rows[0].content, 170)}</Text>
                </View>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openBlogInBrowser(item.id)} activeOpacity={0.8}>
              {resolveBlogImage(item, `card-${item.id}`) ? (
                <Image
                  source={{ uri: resolveBlogImage(item, `card-${item.id}`) }}
                  style={styles.cardImage}
                  onError={() => markImageFailed(`card-${item.id}-0`)}
                />
              ) : null}
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  {item.school?.name} · {item.subCategory?.name}
                </Text>
                <Text style={styles.cardExcerpt}>{excerpt(item.content)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setFilterOpen(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Filter blogs</Text>
            <Text style={styles.modalLabel}>Sort</Text>
            <View style={styles.rowWrap}>
              <TouchableOpacity
                style={[styles.chip, sortMode === 'recent' && styles.chipActive]}
                onPress={() => setSortMode('recent')}
              >
                <Text style={[styles.chipText, sortMode === 'recent' && styles.chipTextActive]}>Most recent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, sortMode === 'oldest' && styles.chipActive]}
                onPress={() => setSortMode('oldest')}
              >
                <Text style={[styles.chipText, sortMode === 'oldest' && styles.chipTextActive]}>Oldest</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowWrap}>
              <TouchableOpacity
                style={[styles.chip, selectedCategoryId === 'all' && styles.chipActive]}
                onPress={() => setSelectedCategoryId('all')}
              >
                <Text style={[styles.chipText, selectedCategoryId === 'all' && styles.chipTextActive]}>All</Text>
              </TouchableOpacity>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, selectedCategoryId === c.id && styles.chipActive]}
                  onPress={() => setSelectedCategoryId(c.id)}
                >
                  <Text style={[styles.chipText, selectedCategoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>School</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowWrap}>
              <TouchableOpacity
                style={[styles.chip, selectedSchoolId === 'all' && styles.chipActive]}
                onPress={() => setSelectedSchoolId('all')}
              >
                <Text style={[styles.chipText, selectedSchoolId === 'all' && styles.chipTextActive]}>All</Text>
              </TouchableOpacity>
              {schools.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, selectedSchoolId === s.id && styles.chipActive]}
                  onPress={() => setSelectedSchoolId(s.id)}
                >
                  <Text style={[styles.chipText, selectedSchoolId === s.id && styles.chipTextActive]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.applyBtn} onPress={() => setFilterOpen(false)}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 8 },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1a1f2e', flex: 1 },
  headerHint: { fontSize: 13, color: '#6c757d', lineHeight: 18 },
  openWebBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1a1f2e',
    backgroundColor: '#fff',
  },
  openWebBtnText: { fontSize: 13, fontWeight: '600', color: '#1a1f2e' },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1a1f2e',
  },
  filterBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1f2e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  filterBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  errorText: { color: '#842029', textAlign: 'center' },
  emptyText: { color: '#6c757d', textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 100, gap: 12 },
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 12,
  },
  featuredImage: { width: '100%', height: 210, backgroundColor: '#f0f0f0' },
  featuredBody: { padding: 14 },
  featuredLabel: { fontSize: 12, color: '#4d7cfe', fontWeight: '700', marginBottom: 6 },
  featuredTitle: { fontSize: 18, fontWeight: '700', color: '#1a1f2e', marginBottom: 4 },
  featuredMeta: { fontSize: 12, color: '#8e8e8e', marginBottom: 8 },
  featuredExcerpt: { fontSize: 14, color: '#495057', lineHeight: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardImage: { width: '100%', height: 180, backgroundColor: '#f0f0f0' },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1a1f2e', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#8e8e8e', marginBottom: 8 },
  cardExcerpt: { fontSize: 14, color: '#495057', lineHeight: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1f2e', marginBottom: 10 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#6c757d', marginTop: 8, marginBottom: 6 },
  rowWrap: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#1a1f2e',
    borderColor: '#1a1f2e',
  },
  chipText: { fontSize: 13, color: '#495057' },
  chipTextActive: { color: '#fff' },
  applyBtn: {
    marginTop: 14,
    backgroundColor: '#1a1f2e',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
