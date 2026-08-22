import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { PublishedBlogDetail } from '../services/publicBlogs';
import { imageSrc } from '../utils/image';

type ContentBlock = NonNullable<PublishedBlogDetail['contentBlocks']>[number];

const TEXT_DARK = '#1a1f2e';
const TEXT_BODY = '#2c3338';

export function BlogBlockRenderer({
  block,
}: {
  block: ContentBlock;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (block.type === 'heading') {
    return (
      <Text style={styles.heading}>{block.value}</Text>
    );
  }

  if (block.type === 'paragraph') {
    return (
      <Text style={styles.paragraph}>{block.value}</Text>
    );
  }

  if (block.type === 'heading_para') {
    return (
      <View style={styles.blockGap}>
        <Text style={styles.subheading}>{block.heading}</Text>
        <Text style={styles.paragraph}>{block.paragraph}</Text>
      </View>
    );
  }

  if (block.type === 'image' && block.imageUrl && !imageFailed) {
    return (
      <Image
        source={{ uri: imageSrc(block.imageUrl) }}
        style={styles.blockImage}
        accessibilityLabel={block.alt || 'Blog image'}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  blockGap: { marginBottom: 16 },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: TEXT_BODY,
    marginBottom: 16,
  },
  blockImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#eef1f6',
  },
});
