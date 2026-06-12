import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getLeads } from '@/src/api/samrat';
import { Card, RankChip, Loading, Empty, timeAgo } from '@/src/ui';
import { spacing, radius, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

export default function Leads() {
  const { colors, styles } = useThemed(makeStyles);
  const router = useRouter();
  const leadsQ = useQuery({ queryKey: ['leads', 'open'], queryFn: () => getLeads('open') });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Leads & RFQs</Text>
          <Text style={styles.sub}>Post requirements · win business</Text>
        </View>
      </View>

      <FlatList
        data={leadsQ.data?.leads || []}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={leadsQ.isFetching && !leadsQ.isLoading} onRefresh={() => leadsQ.refetch()} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(`/lead/${item.id}`)}>
            <Card style={{ marginBottom: spacing.md }}>
              <View style={styles.topRow}>
                <View style={[styles.badge, item.type === 'project' ? styles.badgeProject : styles.badgeRfq]}>
                  <Text style={styles.badgeText}>{item.type === 'project' ? 'PROJECT' : 'RFQ'}</Text>
                </View>
                <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
              </View>
              <Text style={styles.leadTitle}>{item.title}</Text>
              {!!item.description && <Text style={styles.leadDesc} numberOfLines={2}>{item.description}</Text>}
              <View style={styles.tags}>
                {!!item.category && <Tag icon="pricetag-outline" text={item.category} />}
                {!!item.location && <Tag icon="location-outline" text={item.location} />}
                {!!item.quantity && <Tag icon="cube-outline" text={item.quantity} />}
              </View>
              <View style={styles.footer}>
                <Text style={styles.by}>{item.author?.business_name || 'Member'}</Text>
                <RankChip rank={item.author?.rank} />
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          leadsQ.isLoading ? <Loading /> : <Empty icon="briefcase-outline" text="No open leads. Post the first requirement." />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/new-lead')} activeOpacity={0.9}>
        <Ionicons name="add" size={22} color={colors.onPrimary} />
        <Text style={styles.fabText}>Post a lead</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function Tag({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { colors, styles } = useThemed(makeStyles);
  return (
    <View style={styles.tag}>
      <Ionicons name={icon} size={12} color={colors.textDim} />
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text },
  sub: { fontSize: font.size.xs, color: colors.primary, fontWeight: font.weight.semibold },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  badgeRfq: { backgroundColor: colors.accentSoft },
  badgeProject: { backgroundColor: colors.primarySoft },
  badgeText: { fontSize: font.size.xs, fontWeight: font.weight.black, color: colors.textDim, letterSpacing: 0.5 },
  time: { fontSize: font.size.xs, color: colors.muted },
  leadTitle: { fontSize: font.size.lg, fontWeight: font.weight.heavy, color: colors.text, marginTop: spacing.sm },
  leadDesc: { fontSize: font.size.sm, color: colors.textDim, marginTop: spacing.xs, lineHeight: 19 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.bgAlt, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  tagText: { fontSize: font.size.xs, color: colors.textDim },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  by: { fontSize: font.size.sm, color: colors.text, fontWeight: font.weight.semibold },
  fab: {
    position: 'absolute', right: spacing.xl, bottom: 100,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill,
    shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { color: colors.onPrimary, fontWeight: font.weight.black, fontSize: font.size.md },
});
