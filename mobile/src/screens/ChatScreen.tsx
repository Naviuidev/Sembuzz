import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { ChatGroupsView, type ChatGroupListItem } from '../components/ChatGroupsView';
import { getDirectChatAvailability } from '../services/directChat';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

export default function ChatScreen() {
  const { user } = useAuth();
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [directAvailable, setDirectAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setDirectAvailable(null);
      return;
    }
    void getDirectChatAvailability()
      .then((result) => setDirectAvailable(result.available))
      .catch(() => setDirectAvailable(false));
  }, [user]);

  const openLogin = useCallback(() => {
    tabNavigation.navigate('Settings', {
      screen: 'SettingsMain',
      params: { openLogin: true },
    });
  }, [tabNavigation]);

  const openGroup = useCallback(
    (item: ChatGroupListItem) => {
      if (item.kind === 'club' && item.clubGroup) {
        rootNavigation.navigate('ClubGroupChat', {
          groupChatId: item.clubGroup.id,
          pageName: item.clubGroup.pageName,
          icon: item.clubGroup.icon,
          messageMode: item.clubGroup.messageMode ?? 'members',
        });
        return;
      }

      const group = item.studentGroup;
      if (!group) return;

      rootNavigation.navigate('StudentGroupChat', {
        groupId: group.id,
        groupName: group.name,
        visibility: group.visibility,
      });
    },
    [rootNavigation],
  );

  const openDirectChat = useCallback(
    (conversation: { conversationId: string; peer: { id: string; name: string; email: string; profilePicUrl: string | null } }) => {
      rootNavigation.navigate('DirectChat', {
        conversationId: conversation.conversationId,
        peerId: conversation.peer.id,
        peerName: conversation.peer.name,
        peerEmail: conversation.peer.email,
        peerProfilePicUrl: conversation.peer.profilePicUrl,
      });
    },
    [rootNavigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat Groups</Text>
        <Text style={styles.headerSubtitle}>
          {directAvailable === true
            ? 'Groups, club chats, and direct messages'
            : 'Groups and club chats'}
        </Text>
      </View>
      <ChatGroupsView
        isLoggedIn={!!user}
        onSignIn={openLogin}
        onOpenGroup={openGroup}
        onOpenDirectChat={openDirectChat}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: TEXT_DARK,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: TEXT_MUTED,
  },
});
