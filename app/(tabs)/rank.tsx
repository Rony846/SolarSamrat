import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/src/AuthContext';
import { getLeaderboard } from '@/src/api/samrat';
import { Card, Avatar, RankChip, Loading, Empty, ROLE_LABEL } from '@/src/ui';
import { colors, spacing, radius, font, RANK_COLOR } from '@/src/theme';

const LADDER = ['Sipahi', 'Sardar', 'Raja', 'Maharaja', 'Samrat'];

export default function Rank() {
  const { member } = useAuth();
  const boardQ = useQuery({ queryKey: ['leaderboard'], queryFn: () => getLeaderboard() });

  const crowns = member?.crowns ?? 0;
  const toNext = member?.crowns_to_next ?? 0;
  const nextRank = member?.next_rank;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={boardQ.data?.leaderboard || []}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={boardQ.isFetching && !boardQ.isLoading} onRefresh={() => boardQ.refetch()} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Your throne</Text>
            <Card style={styles.myCard}>
              <View style={styles.myTop}>
                <Avatar name={member?.business_name} size={52} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.myName}>{member?.business_name}</Text>
                  <RankChip rank={member?.rank} crowns={crowns} />
                </View>
                <View style={styles.crownBig}>
                  <Text style={styles.crownNum}>{crowns}</Text>
                  <Text style={styles.crownLbl}>👑 Crowns</Text>
                </View>
              </View>

              {nextRank ? (
                <>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progressPct(crowns, toNext)}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {toNext} more Crowns to reach <Text style={{ color: RANK_COLOR[nextRank] }}>{nextRank}</Text>
                  </Text>
                </>
              ) : (
                <Text style={styles.maxRank}>👑 You've reached Samrat — the highest rank!</Text>
              )}

              <View style={styles.ladder}>
                {LADDER.map((r) => {
                  const reached = LADDER.indexOf(r) <= LADDER.indexOf(member?.rank || 'Sipahi');
                  return (
                    <View key={r} style={styles.ladderItem}>
                      <Ionicons name="diamond" size={14} color={reached ? RANK_COLOR[r] : colors.border} />
                      <Text style={[styles.ladderText, { color: reached ? colors.text : colors.muted }]}>{r}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>

            <View style={styles.boardHeader}>
              <Ionicons name="trophy" size={18} color={colors.primary} />
              <Text style={styles.boardTitle}>Leaderboard</Text>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <Card style={[styles.rowCard, item.id === member?.id && { borderColor: colors.primary }]}>
            <Text style={[styles.rankNum, index < 3 && { color: colors.primary }]}>{index + 1}</Text>
            <Avatar name={item.business_name} size={38} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.rowName}>{item.business_name}</Text>
              <Text style={styles.rowMeta}>
                {ROLE_LABEL[item.role] || item.role}{item.city ? ` · ${item.city}` : ''}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <RankChip rank={item.rank} />
              <Text style={styles.rowCrowns}>{item.crowns} 👑</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          boardQ.isLoading ? <Loading /> : <Empty icon="trophy-outline" text="No ranked members yet. Earn Crowns to top the board." />
        }
      />
    </SafeAreaView>
  );
}

function progressPct(crowns: number, toNext: number): number {
  const total = crowns + toNext;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((crowns / total) * 100));
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text, marginBottom: spacing.md },
  myCard: { marginBottom: spacing.xl },
  myTop: { flexDirection: 'row', alignItems: 'center' },
  myName: { fontSize: font.size.lg, fontWeight: font.weight.heavy, color: colors.text, marginBottom: 3 },
  crownBig: { alignItems: 'center' },
  crownNum: { fontSize: font.size.xxl, fontWeight: font.weight.black, color: colors.primary },
  crownLbl: { fontSize: font.size.xs, color: colors.muted },
  progressTrack: { height: 8, backgroundColor: colors.track, borderRadius: 4, marginTop: spacing.lg, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: colors.primary, borderRadius: 4 },
  progressText: { fontSize: font.size.sm, color: colors.textDim, marginTop: spacing.sm },
  maxRank: { fontSize: font.size.md, color: colors.primary, fontWeight: font.weight.heavy, marginTop: spacing.lg, textAlign: 'center' },
  ladder: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  ladderItem: { alignItems: 'center', gap: 3 },
  ladderText: { fontSize: font.size.xs, fontWeight: font.weight.semibold },
  boardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  boardTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  rowCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, paddingVertical: spacing.md },
  rankNum: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.muted, width: 28, textAlign: 'center' },
  rowName: { fontSize: font.size.md, fontWeight: font.weight.heavy, color: colors.text },
  rowMeta: { fontSize: font.size.xs, color: colors.muted, marginTop: 2 },
  rowCrowns: { fontSize: font.size.sm, color: colors.primary, fontWeight: font.weight.heavy, marginTop: 3 },
});
