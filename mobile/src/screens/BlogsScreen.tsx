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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getPublicBlogById,
  imageSrc,
  listPublicBlogs,
  parseImageUrls,
  PublishedBlogDetail,
  PublishedBlogListItem,
} from '../services/publicBlogs';

function excerpt(text: string, max = 130): string {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function BlogsScreen() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blogs, setBlogs] = useState<PublishedBlogListItem[]>([]);
  const [selected, setSelected] = useState<PublishedBlogDetail | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
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

  const openBlog = useCallback(async (id: string) => {
    setSelectedLoading(true);
    try {
      const detail = await getPublicBlogById(id);
      setSelected(detail);
    } catch {
      setError('Unable to open this blog.');
    } finally {
      setSelectedLoading(false);
    }
  }, []);

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
      list = list.filter((b) =>
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
    (blog: PublishedBlogListItem | PublishedBlogDetail, keyPrefix: string): string => {
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

  const renderContentBlock = useCallback(
    (block: NonNullable<PublishedBlogDetail['contentBlocks']>[number], idx: number) => {
      if (!block || typeof block !== 'object') return null;
      if (block.type === 'heading' && 'value' in block) {
        return (
          <Text key={`block-${idx}`} style={styles.blockHeading}>
            {block.value}
          </Text>
        );
      }
      if (block.type === 'paragraph' && 'value' in block) {
        return (
          <Text key={`block-${idx}`} style={styles.blockParagraph}>
            {block.value}
          </Text>
        );
      }
      if (block.type === 'heading_para' && 'heading' in block) {
        return (
          <View key={`block-${idx}`} style={styles.blockWrap}>
            <Text style={styles.blockHeading}>{block.heading}</Text>
            <Text style={styles.blockParagraph}>{block.paragraph}</Text>
          </View>
        );
      }
      if (block.type === 'image' && 'imageUrl' in block) {
        return (
          <Image
            key={`block-${idx}`}
            source={{ uri: imageSrc(block.imageUrl) }}
            style={styles.blockImage}
            resizeMode="cover"
          />
        );
      }
      return null;
    },
    [],
  );

  if (selectedLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a1f2e" />
        </View>
      </SafeAreaView>
    );
  }

  if (selected) {
    const gallery = parseImageUrls(selected.imageUrls);
    const hasBlocks = Array.isArray(selected.contentBlocks) && selected.contentBlocks.length > 0;
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)}>
          <Text style={styles.backText}>← Back to blogs</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.detailWrap}>
          {resolveBlogImage(selected, `detail-${selected.id}`) ? (
            <Image
              source={{ uri: resolveBlogImage(selected, `detail-${selected.id}`) }}
              style={styles.heroImage}
              onError={() => markImageFailed(`detail-${selected.id}-0`)}
            />
          ) : null}
          <Text style={styles.detailTitle}>{selected.title}</Text>
          <Text style={styles.metaText}>
            {selected.school?.name} · {selected.subCategory?.name} · {formatDate(selected.publishedAt || selected.createdAt)}
          </Text>
          {hasBlocks ? (
            <View style={styles.blocksContainer}>
              {selected.contentBlocks!.map((block, idx) => renderContentBlock(block, idx))}
            </View>
          ) : (
            <Text style={styles.detailContent}>{selected.content}</Text>
          )}
          {gallery.length > 0 ? (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.galleryTitle}>Gallery</Text>
              {gallery.map((url, idx) => (
                <Image key={`${url}-${idx}`} source={{ uri: imageSrc(url) }} style={styles.galleryImage} />
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Blogs</Text>
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
              <TouchableOpacity style={styles.featuredCard} onPress={() => openBlog(rows[0].id)} activeOpacity={0.85}>
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
            <TouchableOpacity style={styles.card} onPress={() => openBlog(item.id)} activeOpacity={0.8}>
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
              <TouchableOpacity style={[styles.chip, sortMode === 'recent' && styles.chipActive]} onPress={() => setSortMode('recent')}>
                <Text style={[styles.chipText, sortMode === 'recent' && styles.chipTextActive]}>Most recent</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chip, sortMode === 'oldest' && styles.chipActive]} onPress={() => setSortMode('oldest')}>
                <Text style={[styles.chipText, sortMode === 'oldest' && styles.chipTextActive]}>Oldest</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowWrap}>
              <TouchableOpacity style={[styles.chip, selectedCategoryId === 'all' && styles.chipActive]} onPress={() => setSelectedCategoryId('all')}>
                <Text style={[styles.chipText, selectedCategoryId === 'all' && styles.chipTextActive]}>All</Text>
              </TouchableOpacity>
              {categories.map((c) => (
                <TouchableOpacity key={c.id} style={[styles.chip, selectedCategoryId === c.id && styles.chipActive]} onPress={() => setSelectedCategoryId(c.id)}>
                  <Text style={[styles.chipText, selectedCategoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>School</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowWrap}>
              <TouchableOpacity style={[styles.chip, selectedSchoolId === 'all' && styles.chipActive]} onPress={() => setSelectedSchoolId('all')}>
                <Text style={[styles.chipText, selectedSchoolId === 'all' && styles.chipTextActive]}>All</Text>
              </TouchableOpacity>
              {schools.map((s) => (
                <TouchableOpacity key={s.id} style={[styles.chip, selectedSchoolId === s.id && styles.chipActive]} onPress={() => setSelectedSchoolId(s.id)}>
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
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1a1f2e' },
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
  backBtn: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  backText: { color: '#4d7cfe', fontSize: 14, fontWeight: '500' },
  detailWrap: { padding: 16, paddingBottom: 100 },
  heroImage: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#f0f0f0', marginBottom: 12 },
  detailTitle: { fontSize: 22, fontWeight: '700', color: '#1a1f2e', marginBottom: 6 },
  metaText: { fontSize: 12, color: '#8e8e8e', marginBottom: 12 },
  detailContent: { fontSize: 15, color: '#2c3338', lineHeight: 24 },
  blocksContainer: { gap: 10 },
  blockWrap: { marginBottom: 4 },
  blockHeading: { fontSize: 20, fontWeight: '700', color: '#1a1f2e', lineHeight: 28, marginTop: 4 },
  blockParagraph: { fontSize: 15, color: '#2c3338', lineHeight: 24 },
  blockImage: { width: '100%', height: 220, borderRadius: 10, marginTop: 6, backgroundColor: '#f0f0f0' },
  galleryTitle: { fontSize: 14, fontWeight: '600', color: '#1a1f2e', marginBottom: 8 },
  galleryImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 10, backgroundColor: '#f0f0f0' },
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

