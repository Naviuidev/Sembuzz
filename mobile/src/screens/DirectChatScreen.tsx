import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DirectChatPanel } from '../components/DirectChatPanel';
import { useAuth } from '../contexts/AuthContext';
import type { RootStackParamList } from '../navigation/types';

type DirectChatRoute = RouteProp<RootStackParamList, 'DirectChat'>;

export default function DirectChatScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<DirectChatRoute>();
  const { user } = useAuth();

  const initialConversation = route.params
    ? {
        conversationId: route.params.conversationId,
        peer: {
          id: route.params.peerId,
          name: route.params.peerName,
          email: route.params.peerEmail,
          profilePicUrl: route.params.peerProfilePicUrl ?? null,
        },
      }
    : undefined;

  useEffect(() => {
    if (!user) {
      navigation.goBack();
    }
  }, [user, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#1a1f2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {route.params?.peerName ?? 'Direct chat'}
        </Text>
        <View style={styles.backBtn} />
      </View>
      <DirectChatPanel
        currentUserId={user?.id}
        initialConversation={initialConversation}
        startInChat={!!initialConversation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf1',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1f2e',
  },
});
