import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getBizSummary, listQuotes, type Quote } from '@/src/api/biz';
import { Card, Loading, inr } from '@/src/ui';
import { spacing, radius, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

const statusColors = (c: ThemePalette): Record<string, string> => ({
  draft: c.muted, sent: c.accent, accepted: c.success, rejected: c.danger,
});

export default function Business() {
  const { colors, styles } = useThemed(makeStyles);
  const STATUS_COLOR = statusColors(colors);
  const router = useRouter();
  const sumQ = useQuery({ queryKey: ['biz-summary'], queryFn: getBizSummary });
  const quotesQ = useQuery({ queryKey: ['quotes'], queryFn: () => listQuotes() });
  const s = sumQ.data;

  const refetch = () => { sumQ.refetch(); quotesQ.refetch(); };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Business</Text>
          <Text style={styles.sub}>Quotes · customers · profit</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={(sumQ.isFetching || quotesQ.isFetching) && !sumQ.isLoading} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {sumQ.isLoading || !s ? (
          <Loading />
        ) : (
          <>
            <View style={styles.statRow}>
              <Stat label="Revenue" value={inr(s.revenue)} icon="trending-up" />
              <Stat label="Profit" value={inr(s.profit)} icon="cash" accent />
            </View>
            <View style={styles.statRow}>
              <Stat label="Customers" value={String(s.customers_count)} icon="people" small />
              <Stat label="Sales" value={String(s.sales_count)} icon="checkmark-done" small />
              <Stat label="Pending" value={String(s.pending_quotes)} icon="hourglass" small />
            </View>

            <View style={styles.actions}>
              <Action icon="document-text" label="New Quote" primary onPress={() => router.push('/quotes/new')} />
              <Action icon="person-add" label="Customers" onPress={() => router.push('/customers')} />
              <Action icon="add-circle" label="Add Sale" onPress={() => router.push('/sales/new')} />
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.section}>Recent quotes</Text>
              <TouchableOpacity onPress={() => router.push('/quotes/new')}>
                <Text style={styles.link}>+ New</Text>
              </TouchableOpacity>
            </View>

            {(quotesQ.data?.quotes || []).length === 0 ? (
              <Card><Text style={styles.empty}>No quotes yet. Create a professional quote for a customer in seconds.</Text></Card>
            ) : (
              (quotesQ.data?.quotes || []).slice(0, 12).map((q: Quote) => (
                <TouchableOpacity key={q.id} activeOpacity={0.85} onPress={() => router.push(`/quotes/${q.id}`)}>
                  <Card style={styles.quoteRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.qCustomer}>{q.customer_name}</Text>
                      <Text style={styles.qMeta}>{q.number} · profit {inr(q.profit)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.qTotal}>{inr(q.total)}</Text>
                      <View style={[styles.statusChip, { backgroundColor: (STATUS_COLOR[q.status] || colors.muted) + '22' }]}>
                        <Text style={[styles.statusText, { color: STATUS_COLOR[q.status] || colors.muted }]}>{q.status}</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, icon, accent, small }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; accent?: boolean; small?: boolean }) {
  const { colors, styles } = useThemed(makeStyles);
  return (
    <Card style={[styles.stat, small && { padding: spacing.md }]}>
      <Ionicons name={icon} size={small ? 18 : 22} color={accent ? colors.success : colors.primary} />
      <Text style={[styles.statValue, small && { fontSize: font.size.lg }, accent && { color: colors.success }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function Action({ icon, label, onPress, primary }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; primary?: boolean }) {
  const { colors, styles } = useThemed(makeStyles);
  return (
    <TouchableOpacity style={[styles.action, primary && styles.actionPrimary]} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={22} color={primary ? colors.onPrimary : colors.primary} />
      <Text style={[styles.actionLabel, primary && { color: colors.onPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text },
  sub: { fontSize: font.size.xs, color: colors.primary, fontWeight: font.weight.semibold },
  statRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  stat: { flex: 1, alignItems: 'flex-start' },
  statValue: { fontSize: font.size.xxl, fontWeight: font.weight.black, color: colors.text, marginTop: spacing.sm },
  statLabel: { fontSize: font.size.xs, color: colors.muted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.lg },
  action: { flex: 1, alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionLabel: { fontSize: font.size.xs, color: colors.text, fontWeight: font.weight.heavy },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  section: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  link: { color: colors.primary, fontWeight: font.weight.heavy, fontSize: font.size.sm },
  empty: { color: colors.muted, fontSize: font.size.sm, lineHeight: 19 },
  quoteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  qCustomer: { fontSize: font.size.md, fontWeight: font.weight.heavy, color: colors.text },
  qMeta: { fontSize: font.size.xs, color: colors.muted, marginTop: 2 },
  qTotal: { fontSize: font.size.md, fontWeight: font.weight.black, color: colors.text },
  statusChip: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 1, marginTop: 3 },
  statusText: { fontSize: font.size.xs, fontWeight: font.weight.heavy, textTransform: 'capitalize' },
});
