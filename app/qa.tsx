import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getQuestions } from '@/src/api/samrat';
import { Card, RankChip, Loading, Empty, timeAgo } from '@/src/ui';
import { spacing, radius, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

export default function QA() {
  const { colors, styles } = useThemed(makeStyles);
  const router = useRouter();
  const qQ = useQuery({ queryKey: ['questions'], queryFn: getQuestions });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Q&A</Text>
        <View style={{ width: 26 }} />
      </View>
      <FlatList
        data={qQ.data?.questions || []}
        keyExtractor={(q) => q.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={qQ.isFetching && !qQ.isLoading} onRefresh={() => qQ.refetch()} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(`/question/${item.id}`)}>
            <Card style={{ marginBottom: spacing.md }}>
              <Text style={styles.qTitle}>{item.title}</Text>
              <View style={styles.meta}>
                <RankChip rank={item.author?.rank} />
                <Text style={styles.metaText}>{item.author?.business_name || 'Member'} · {timeAgo(item.created_at)}</Text>
                <View style={{ flex: 1 }} />
                <View style={styles.answers}>
                  <Ionicons name="chatbubbles-outline" size={14} color={item.best_answer_id ? colors.success : colors.muted} />
                  <Text style={[styles.answersText, item.best_answer_id && { color: colors.success }]}>{item.answer_count || 0}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={qQ.isLoading ? <Loading /> : <Empty icon="help-circle-outline" text="No questions yet. Ask the community." />}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/ask')} activeOpacity={0.9}>
        <Ionicons name="add" size={22} color={colors.onPrimary} />
        <Text style={styles.fabText}>Ask</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  qTitle: { fontSize: font.size.md, fontWeight: font.weight.heavy, color: colors.text, lineHeight: 22 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  metaText: { fontSize: font.size.xs, color: colors.muted },
  answers: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  answersText: { fontSize: font.size.sm, color: colors.muted, fontWeight: font.weight.heavy },
  fab: {
    position: 'absolute', right: spacing.xl, bottom: 40,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill,
    shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { color: colors.onPrimary, fontWeight: font.weight.black, fontSize: font.size.md },
});
