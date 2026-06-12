import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPost, commentPost, likePost } from '@/src/api/samrat';
import { apiError } from '@/src/api/client';
import { Avatar, RankChip, Loading, timeAgo, ROLE_LABEL } from '@/src/ui';
import { colors, spacing, font } from '@/src/theme';

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const postQ = useQuery({ queryKey: ['post', id], queryFn: () => getPost(id!), enabled: !!id });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const post = postQ.data;

  const send = async () => {
    if (!text.trim() || !id) return;
    setBusy(true);
    try {
      await commentPost(id, text.trim());
      setText('');
      postQ.refetch();
      qc.invalidateQueries({ queryKey: ['feed'] });
    } catch (e) {
      Alert.alert('Could not comment', apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleLike = async () => {
    if (!id) return;
    try { await likePost(id); postQ.refetch(); qc.invalidateQueries({ queryKey: ['feed'] }); } catch { /* ignore */ }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 26 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        {postQ.isLoading || !post ? (
          <Loading />
        ) : (
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            <View style={styles.row}>
              <Avatar name={post.author?.business_name} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.author}>{post.author?.business_name || 'Member'}</Text>
                <View style={styles.metaRow}>
                  <RankChip rank={post.author?.rank} />
                  <Text style={styles.meta}> {post.author?.role ? ROLE_LABEL[post.author.role] : ''} · {timeAgo(post.created_at)}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.body}>{post.body}</Text>
            <View style={styles.likeRow}>
              <TouchableOpacity style={styles.likeBtn} onPress={toggleLike}>
                <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={20} color={post.liked ? colors.danger : colors.muted} />
                <Text style={styles.likeText}>{post.like_count || 0} likes</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.commentsTitle}>Comments ({post.comments?.length || 0})</Text>
            {(post.comments || []).map((c) => (
              <View key={c.id} style={styles.comment}>
                <Avatar name={c.author_name} size={32} />
                <View style={styles.commentBubble}>
                  <Text style={styles.commentAuthor}>{c.author_name || 'Member'}</Text>
                  <Text style={styles.commentBody}>{c.body}</Text>
                  <Text style={styles.commentTime}>{timeAgo(c.created_at)}</Text>
                </View>
              </View>
            ))}
            {!post.comments?.length && <Text style={styles.noComments}>No comments yet. Start the conversation.</Text>}
          </ScrollView>
        )}
        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Add a comment…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={busy || !text.trim()}>
            <Ionicons name="send" size={20} color={text.trim() ? colors.primary : colors.muted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center' },
  author: { fontSize: font.size.md, fontWeight: font.weight.heavy, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  meta: { fontSize: font.size.xs, color: colors.muted },
  body: { fontSize: font.size.lg, color: colors.text, lineHeight: 25, marginTop: spacing.lg },
  likeRow: { flexDirection: 'row', marginTop: spacing.lg, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  likeText: { color: colors.muted, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  commentsTitle: { fontSize: font.size.md, fontWeight: font.weight.black, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  comment: { flexDirection: 'row', marginBottom: spacing.lg },
  commentBubble: { flex: 1, marginLeft: spacing.md, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  commentAuthor: { fontSize: font.size.sm, fontWeight: font.weight.heavy, color: colors.text },
  commentBody: { fontSize: font.size.sm, color: colors.textDim, marginTop: 3, lineHeight: 20 },
  commentTime: { fontSize: font.size.xs, color: colors.muted, marginTop: 4 },
  noComments: { color: colors.muted, fontSize: font.size.sm, textAlign: 'center', paddingVertical: spacing.xl },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgAlt },
  input: { flex: 1, color: colors.text, fontSize: font.size.md, maxHeight: 100, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sendBtn: { padding: spacing.sm },
});
