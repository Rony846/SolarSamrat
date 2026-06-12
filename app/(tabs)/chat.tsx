import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listChannels, type ChatChannel } from '@/src/api/chat';
import { useChatSocket } from '@/src/useChatSocket';
import { Avatar, Loading, Empty, timeAgo, splitLeadEmoji } from '@/src/ui';
import { spacing, radius, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

export default function Chat() {
  const { colors, styles } = useThemed(makeStyles);
  const router = useRouter();
  const qc = useQueryClient();
  const chQ = useQuery({ queryKey: ['chat-channels'], queryFn: listChannels });

  // Live-refresh the channel list whenever a message arrives anywhere.
  const onEvent = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['chat-channels'] });
  }, [qc]);
  useChatSocket(onEvent);

  const channels = chQ.data?.channels || [];
  const groups = channels.filter((c) => c.type === 'group');
  const dms = channels.filter((c) => c.type === 'dm');
  const ordered = [...channels].sort((a, b) => (b.last_at || '').localeCompare(a.last_at || ''));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Chat</Text>
          <Text style={styles.sub}>{groups.length} groups · {dms.length} DMs</Text>
        </View>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/directory')}>
            <Ionicons name="person-add-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/new-group')}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={ordered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingVertical: spacing.sm }}
        refreshControl={<RefreshControl refreshing={chQ.isFetching && !chQ.isLoading} onRefresh={() => chQ.refetch()} tintColor={colors.primary} />}
        renderItem={({ item }) => <ChannelRow channel={item} onPress={() => router.push(`/chat/${item.id}`)} />}
        ListEmptyComponent={chQ.isLoading ? <Loading /> : <Empty icon="chatbubbles-outline" text="No chats yet. Join a group to start talking." />}
      />
    </SafeAreaView>
  );
}

function ChannelRow({ channel, onPress }: { channel: ChatChannel; onPress: () => void }) {
  const { colors, styles } = useThemed(makeStyles);
  const isGroup = channel.type === 'group';
  const { emoji, text: cleanName } = isGroup ? splitLeadEmoji(channel.name) : { emoji: '#', text: channel.name };
  const last = channel.last_message;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {isGroup ? (
        <View style={styles.groupIcon}><Text style={styles.groupEmoji}>{emoji}</Text></View>
      ) : (
        <Avatar name={channel.name} size={50} />
      )}
      <View style={styles.rowMid}>
        <Text style={styles.rowName} numberOfLines={1}>{cleanName}</Text>
        <Text style={styles.rowLast} numberOfLines={1}>
          {last ? (last.sender ? `${last.sender}: ${last.body}` : last.body) : (channel.topic || 'No messages yet')}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {!!last?.at && <Text style={styles.rowTime}>{timeAgo(last.at)}</Text>}
        {channel.unread > 0 && (
          <View style={styles.unread}><Text style={styles.unreadText}>{channel.unread > 99 ? '99+' : channel.unread}</Text></View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text },
  sub: { fontSize: font.size.xs, color: colors.primary, fontWeight: font.weight.semibold },
  headerBtns: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  iconBtn: { padding: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  groupIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  groupEmoji: { fontSize: 22 },
  rowMid: { flex: 1, marginLeft: spacing.md },
  rowName: { fontSize: font.size.md, fontWeight: font.weight.heavy, color: colors.text },
  rowLast: { fontSize: font.size.sm, color: colors.muted, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', marginLeft: spacing.sm, gap: 4 },
  rowTime: { fontSize: font.size.xs, color: colors.muted },
  unread: { backgroundColor: colors.primary, borderRadius: 11, minWidth: 22, height: 22, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: colors.onPrimary, fontSize: font.size.xs, fontWeight: font.weight.black },
});
