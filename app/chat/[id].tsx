import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/AuthContext';
import {
  getMessages, sendMessage, markRead, type ChatMessage, type ChatChannel,
} from '@/src/api/chat';
import { useChatSocket } from '@/src/useChatSocket';
import { Loading, RankChip, timeAgo, splitLeadEmoji } from '@/src/ui';
import { spacing, radius, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

export default function ChatRoom() {
  const { colors, styles } = useThemed(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channel, setChannel] = useState<ChatChannel | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const addMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  // Initial history + mark read.
  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        const res = await getMessages(id);
        if (!alive) return;
        setMessages(res.messages);
        setChannel(res.channel);
      } finally {
        if (alive) setLoading(false);
      }
      markRead(id).catch(() => {});
    })();
    return () => { alive = false; };
  }, [id]);

  // Live messages for THIS channel.
  const onEvent = useCallback((e: { type: string; channel_id?: string; message?: unknown }) => {
    if (e.type === 'message' && e.channel_id === id && e.message) {
      addMessage(e.message as ChatMessage);
      markRead(id!).catch(() => {});
    }
  }, [id, addMessage]);
  useChatSocket(onEvent);

  useEffect(() => {
    if (messages.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || !id) return;
    setText('');
    setSending(true);
    try {
      const msg = await sendMessage(id, body);
      addMessage(msg);
    } catch {
      setText(body); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const title = channel ? (channel.type === 'group' ? splitLeadEmoji(channel.name).text : channel.name) : 'Chat';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          {channel?.type === 'group' && <Text style={styles.headerSub}>{channel.is_public ? 'Public group' : 'Private group'}</Text>}
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={88}>
        {loading ? (
          <Loading />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.lg }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item, index }) => {
              const mine = item.user_id_sender === user?.id;
              const prev = messages[index - 1];
              const showSender = !mine && channel?.type === 'group' && prev?.user_id_sender !== item.user_id_sender;
              return <Bubble msg={item} mine={mine} showSender={showSender} />;
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubbles-outline" size={40} color={colors.border} />
                <Text style={styles.emptyText}>No messages yet. Say hello 👋</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
          />
          <TouchableOpacity style={[styles.sendBtn, { opacity: text.trim() && !sending ? 1 : 0.4 }]} onPress={send} disabled={!text.trim() || sending}>
            <Ionicons name="send" size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ msg, mine, showSender }: { msg: ChatMessage; mine: boolean; showSender: boolean }) {
  const { colors, styles } = useThemed(makeStyles);
  return (
    <View style={[styles.bubbleWrap, mine ? styles.wrapMine : styles.wrapOther]}>
      {showSender && (
        <View style={styles.senderRow}>
          <Text style={styles.sender}>{msg.sender_name}</Text>
          <RankChip rank={msg.sender_rank} />
        </View>
      )}
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, mine && { color: colors.onPrimary }]}>{msg.body}</Text>
        <Text style={[styles.bubbleTime, mine && { color: 'rgba(10,14,26,0.55)' }]}>{timeAgo(msg.created_at)}</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  headerSub: { fontSize: font.size.xs, color: colors.muted },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: colors.muted, marginTop: spacing.md },
  bubbleWrap: { marginBottom: spacing.sm, maxWidth: '82%' },
  wrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 3, marginLeft: spacing.sm },
  sender: { fontSize: font.size.xs, color: colors.primary, fontWeight: font.weight.heavy },
  bubble: { borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: font.size.md, color: colors.text, lineHeight: 21 },
  bubbleTime: { fontSize: 10, color: colors.muted, alignSelf: 'flex-end', marginTop: 2 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgAlt, gap: spacing.sm },
  input: { flex: 1, color: colors.text, fontSize: font.size.md, maxHeight: 110, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sendBtn: { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
