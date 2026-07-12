import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import {
  listJoinableClubGroupChats,
  requestJoinClubGroup,
} from '../services/clubGroupChat';
import { getDirectChatUnreadCount } from '../services/directChat';
import { DirectChatPanel } from './DirectChatPanel';
import { imageSrc, isImageIconValue } from '../utils/image';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

type Joinable = Awaited<ReturnType<typeof listJoinableClubGroupChats>>[number];
type GroupStep = 'list' | 'detail';

interface Props {
  isAuthenticated: boolean;
  currentUserId?: string | null;
  onRequireLogin: () => void;
}

export function ClubMessagingBadges({ isAuthenticated, currentUserId, onRequireLogin }: Props) {
  const [groupOpen, setGroupOpen] = useState(false);
  const [yourChatOpen, setYourChatOpen] = useState(false);
  const [step, setStep] = useState<GroupStep>('list');
  const [joinable, setJoinable] = useState<Joinable[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [yourChatBadgeCount, setYourChatBadgeCount] = useState(0);

  const loadDirectUnread = useCallback(async () => {
    if (!isAuthenticated) {
      setYourChatBadgeCount(0);
      return;
    }
    try {
      const counts = await getDirectChatUnreadCount();
      setYourChatBadgeCount((counts.unreadCount ?? 0) + (counts.pendingIncomingCount ?? 0));
    } catch {
      setYourChatBadgeCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadDirectUnread();
    if (!isAuthenticated) return;
    const timer = setInterval(() => {
      void loadDirectUnread();
    }, 8000);
    return () => clearInterval(timer);
  }, [isAuthenticated, loadDirectUnread]);

  const loadJoinable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listJoinableClubGroupChats();
      setJoinable(list);
    } catch {
      setJoinable([]);
      setError('Could not load club groups.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (groupOpen && isAuthenticated) {
      setStep('list');
      setSelectedId(null);
      setMessage(null);
      setError(null);
      void loadJoinable();
    }
  }, [groupOpen, isAuthenticated, loadJoinable]);

  const openGroup = () => {
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    setGroupOpen(true);
  };

  const selected = joinable.find((c) => c.id === selectedId) ?? null;

  const selectGroup = (chat: Joinable) => {
    setSelectedId(chat.id);
    setStep('detail');
    setMessage(null);
    setError(null);
  };

  const backToList = () => {
    setStep('list');
    setSelectedId(null);
    setMessage(null);
    setError(null);
  };

  const submitJoin = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestJoinClubGroup(selected.id);
      setMessage('Join request sent. A category admin will review your request.');
      await loadJoinable();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(typeof msg === 'string' ? msg : 'Could not send join request.');
    } finally {
      setSubmitting(false);
    }
  };

  const joinDisabled =
    !selected ||
    selected.membershipStatus === 'pending' ||
    selected.membershipStatus === 'approved' ||
    selected.membershipStatus === 'banned' ||
    submitting;

  return (
    <>
      <View style={styles.badgeRow}>
        <TouchableOpacity style={styles.badge} onPress={openGroup} activeOpacity={0.85}>
          <Text style={styles.badgeText}>Group chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.badgeOutline}
          onPress={() => (isAuthenticated ? setYourChatOpen(true) : onRequireLogin())}
          activeOpacity={0.85}
        >
          <Text style={styles.badgeOutlineText}>Your chat</Text>
          {yourChatBadgeCount > 0 ? (
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>
                {yourChatBadgeCount > 99 ? '99+' : yourChatBadgeCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <Modal visible={groupOpen} transparent animationType="fade" onRequestClose={() => setGroupOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setGroupOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>
              {step === 'list' ? 'Group chats' : selected?.pageName || 'Group chat'}
            </Text>

            {step === 'list' ? (
              <>
                <Text style={styles.body}>
                  Select a club group chat to request access. Your category admin must approve before
                  you can message in the group.
                </Text>
                {loading ? (
                  <ActivityIndicator color={TEXT_DARK} style={{ marginVertical: 16 }} />
                ) : joinable.length === 0 ? (
                  <Text style={styles.body}>No club group chats available yet.</Text>
                ) : (
                  <ScrollView style={{ maxHeight: 320 }}>
                    {joinable.map((chat) => (
                      <TouchableOpacity
                        key={chat.id}
                        style={styles.clubRow}
                        onPress={() => selectGroup(chat)}
                      >
                        <ClubIcon icon={chat.icon} name={chat.pageName} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.clubName}>{chat.pageName || 'Club'}</Text>
                          <MembershipStatus status={chat.membershipStatus} />
                        </View>
                        <Text style={styles.chevron}>›</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            ) : selected ? (
              <>
                <TouchableOpacity onPress={backToList} style={styles.backLink}>
                  <Text style={styles.backLinkText}>← Back to group chats</Text>
                </TouchableOpacity>

                <View style={styles.detailCard}>
                  <ClubIcon icon={selected.icon} name={selected.pageName} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clubName}>{selected.pageName || 'Club'}</Text>
                    <MembershipStatus status={selected.membershipStatus} />
                  </View>
                </View>

                <Text style={styles.body}>
                  {selected.membershipStatus === 'approved'
                    ? 'You are already approved for this group. Open the chat icon on this screen to message.'
                    : selected.membershipStatus === 'pending'
                      ? 'Your join request is waiting for category admin approval.'
                      : selected.membershipStatus === 'banned'
                        ? 'You are not allowed to join this group. Contact your category admin.'
                        : 'Send a join request. Once approved, you can read and send messages in this group.'}
                </Text>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {message ? <Text style={styles.successText}>{message}</Text> : null}

                <TouchableOpacity
                  style={[styles.primaryBtn, joinDisabled && styles.primaryBtnDisabled]}
                  disabled={joinDisabled}
                  onPress={submitJoin}
                >
                  <Text style={styles.primaryBtnText}>
                    {submitting
                      ? 'Sending…'
                      : selected.membershipStatus === 'pending'
                        ? 'Request pending'
                        : selected.membershipStatus === 'approved'
                          ? 'Already joined'
                          : selected.membershipStatus === 'banned'
                            ? 'Not allowed'
                            : 'Request to join'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={yourChatOpen} transparent animationType="fade" onRequestClose={() => setYourChatOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setYourChatOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Messages</Text>
            <DirectChatPanel
              currentUserId={currentUserId}
              onMessagingActivity={() => void loadDirectUnread()}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function MembershipStatus({ status }: { status: Joinable['membershipStatus'] }) {
  if (!status) return null;
  const label =
    status === 'pending'
      ? 'Pending approval'
      : status === 'approved'
        ? 'Approved'
        : status === 'banned'
          ? 'Banned'
          : null;
  if (!label) return null;
  return <Text style={styles.clubStatus}>{label}</Text>;
}

function ClubIcon({ icon, name }: { icon: string; name: string }) {
  return (
    <View style={styles.clubIcon}>
      {isImageIconValue(icon) ? (
        <Image source={{ uri: imageSrc(icon) }} style={{ width: 28, height: 28 }} resizeMode="contain" />
      ) : (
        <Text style={{ fontWeight: '700', color: TEXT_DARK }}>{name.charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    width: '100%',
  },
  badge: {
    backgroundColor: TEXT_DARK,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  badgeOutline: {
    borderWidth: 1,
    borderColor: TEXT_DARK,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    position: 'relative',
  },
  badgeOutlineText: { color: TEXT_DARK, fontWeight: '600', fontSize: 14 },
  chatBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: '#dc3545',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  chatBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#fff',
    padding: 20,
    maxHeight: '80%',
  },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: TEXT_DARK, marginBottom: 12 },
  body: { fontSize: 14, color: TEXT_MUTED, lineHeight: 20, marginBottom: 16 },
  primaryBtn: {
    backgroundColor: TEXT_DARK,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  backLink: { marginBottom: 8 },
  backLinkText: { color: TEXT_MUTED, fontSize: 13 },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 8,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 12,
  },
  clubIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(26,31,46,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubName: { fontWeight: '600', color: TEXT_DARK },
  clubStatus: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  chevron: { fontSize: 22, color: TEXT_MUTED, lineHeight: 22 },
  errorText: { color: '#dc3545', fontSize: 13, marginTop: 8 },
  successText: { color: '#198754', fontSize: 13, marginTop: 8 },
});
