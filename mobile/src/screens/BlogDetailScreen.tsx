import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { getPublicBlogById, parseImageUrls, type PublishedBlogDetail } from '../services/publicBlogs';
import { BlogBlockRenderer } from '../components/BlogBlockRenderer';
import { imageSrc } from '../utils/image';
import { getFrontendBaseUrl } from '../config/env';
import type { RootStackParamList } from '../navigation/types';

type BlogDetailRoute = RouteProp<RootStackParamList, 'BlogDetail'>;

function plainExcerpt(text: string, max = 400): string {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export default function BlogDetailScreen() {
  const route = useRoute<BlogDetailRoute>();
  const { blogId } = route.params;
  const webBase = getFrontendBaseUrl();

  const [blog, setBlog] = useState<PublishedBlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverFailed, setCoverFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicBlogById(blogId);
      setBlog(data);
    } catch {
      setError('Could not load this blog post.');
      setBlog(null);
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openOnWeb = () => {
    Linking.openURL(`${webBase}/blogs/${blogId}`).catch(() => {});
  };

  const coverUrl =
    blog?.coverImageUrl ||
    parseImageUrls(blog?.imageUrls ?? null)[0] ||
    null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a1f2e" />
        </View>
      ) : error || !blog ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Blog not found.'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {coverUrl && !coverFailed ? (
            <Image
              source={{ uri: imageSrc(coverUrl) }}
              style={styles.cover}
              onError={() => setCoverFailed(true)}
            />
          ) : null}

          <Text style={styles.title}>{blog.title}</Text>
          <Text style={styles.meta}>
            {blog.school?.name}
            {blog.subCategory?.name ? ` · ${blog.subCategory.name}` : ''}
            {blog.publishedAt || blog.createdAt
              ? ` · ${new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}`
              : ''}
          </Text>

          {blog.contentBlocks && blog.contentBlocks.length > 0 ? (
            blog.contentBlocks.map((block, index) => (
              <BlogBlockRenderer key={`${block.type}-${index}`} block={block} />
            ))
          ) : (
            <Text style={styles.body}>{plainExcerpt(blog.content, 10000)}</Text>
          )}

          <TouchableOpacity style={styles.webBtn} onPress={openOnWeb} activeOpacity={0.85}>
            <Text style={styles.webBtnText}>Open on website</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#b42318', textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  cover: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: '#eef1f6',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1f2e',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: '#2c3338',
  },
  webBtn: {
    marginTop: 24,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  webBtnText: {
    color: '#1a1f2e',
    fontWeight: '600',
    fontSize: 14,
  },
});
