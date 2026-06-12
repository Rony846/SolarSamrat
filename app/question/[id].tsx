import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/src/AuthContext';
import { getQuestion, answerQuestion, upvoteAnswer, markBestAnswer } from '@/src/api/samrat';
import { apiError } from '@/src/api/client';
import { Card, RankChip, Loading, timeAgo } from '@/src/ui';
import { colors, spacing, radius, font } from '@/src/theme';

export default function QuestionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const qQ = useQuery({ queryKey: ['question', id], queryFn: () => getQuestion(id!), enabled: !!id });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const q = qQ.data;
  const isAsker = !!user && q?.user_id === user.id;

  const send = async () => {
    if (!text.trim() || !id) return;
    setBusy(true);
    try { await answerQuestion(id, text.trim()); setText(''); qQ.refetch(); }
    catch (e) { Alert.alert('Could not answer', apiError(e)); }
    finally { setBusy(false); }
  };

  const upvote = async (aid: string) => {
    try { await upvoteAnswer(aid); qQ.refetch(); } catch { /* ignore */ }
  };

  const markBest = async (aid: string) => {
    if (!id) return;
    try { await markBestAnswer(id, aid); qQ.refetch(); } catch (e) { Alert.alert('Error', apiError(e)); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Question</Text>
        <View style={{ width: 26 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        {qQ.isLoading || !q ? (
          <Loading />
        ) : (
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            <Card>
              <Text style={styles.qTitle}>{q.title}</Text>
              {!!q.body && <Text style={styles.qBody}>{q.body}</Text>}
              <View style={styles.qMeta}>
                <Text style={styles.qAuthor}>{q.author?.business_name || 'Member'}</Text>
                <RankChip rank={q.author?.rank} />
                <Text style={styles.qTime}>· {timeAgo(q.created_at)}</Text>
              </View>
            </Card>

            <Text style={styles.aTitle}>{q.answer_count || 0} Answers</Text>
            {(q.answers || []).map((a) => {
              const isBest = q.best_answer_id === a.id;
              return (
                <Card key={a.id} style={[{ marginBottom: spacing.sm }, isBest && styles.bestCard]}>
                  {isBest && (
                    <View style={styles.bestTag}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={styles.bestText}>Best answer</Text>
                    </View>
                  )}
                  <Text style={styles.aBody}>{a.body}</Text>
                  <View style={styles.aFooter}>
                    <Text style={styles.aAuthor}>{a.author_name || 'Member'}</Text>
                    <RankChip rank={a.author_rank} />
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={styles.upBtn} onPress={() => upvote(a.id)}>
                      <Ionicons name={a.upvoted ? 'arrow-up-circle' : 'arrow-up-circle-outline'} size={20} color={a.upvoted ? colors.primary : colors.muted} />
                      <Text style={styles.upText}>{a.upvote_count || 0}</Text>
                    </TouchableOpacity>
                  </View>
                  {isAsker && !isBest && (
                    <TouchableOpacity style={styles.markBest} onPress={() => markBest(a.id)}>
                      <Text style={styles.markBestText}>✓ Mark as best</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              );
            })}
            {!q.answers?.length && <Text style={styles.noAns}>No answers yet. Share your expertise.</Text>}
          </ScrollView>
        )}
        <View style={styles.inputBar}>
          <TextInput value={text} onChangeText={setText} placeholder="Write an answer…" placeholderTextColor={colors.muted} style={styles.input} multiline />
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
  qTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text, lineHeight: 24 },
  qBody: { fontSize: font.size.md, color: colors.textDim, marginTop: spacing.sm, lineHeight: 21 },
  qMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  qAuthor: { fontSize: font.size.sm, color: colors.text, fontWeight: font.weight.heavy },
  qTime: { fontSize: font.size.xs, color: colors.muted },
  aTitle: { fontSize: font.size.md, fontWeight: font.weight.black, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  bestCard: { borderColor: colors.success },
  bestTag: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: spacing.sm },
  bestText: { fontSize: font.size.xs, color: colors.success, fontWeight: font.weight.black },
  aBody: { fontSize: font.size.md, color: colors.text, lineHeight: 22 },
  aFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  aAuthor: { fontSize: font.size.sm, color: colors.textDim, fontWeight: font.weight.semibold },
  upBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  upText: { color: colors.muted, fontWeight: font.weight.heavy, fontSize: font.size.sm },
  markBest: { marginTop: spacing.md, alignSelf: 'flex-start', backgroundColor: '#0E2A1E', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  markBestText: { color: colors.success, fontSize: font.size.xs, fontWeight: font.weight.heavy },
  noAns: { color: colors.muted, fontSize: font.size.sm, textAlign: 'center', paddingVertical: spacing.lg },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgAlt },
  input: { flex: 1, color: colors.text, fontSize: font.size.md, maxHeight: 100, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sendBtn: { padding: spacing.sm },
});
