import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getKhata } from '@/src/api/biz';
import { Card, Avatar, Loading, Empty, inr } from '@/src/ui';
import { spacing, radius, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

export default function Khata() {
  const { colors, styles } = useThemed(makeStyles);
  const router = useRouter();
  const kQ = useQuery({ queryKey: ['khata'], queryFn: getKhata });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Khata</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total outstanding</Text>
        <Text style={styles.totalValue}>{inr(kQ.data?.total_outstanding || 0)}</Text>
      </View>

      <FlatList
        data={kQ.data?.khata || []}
        keyExtractor={(r) => r.customer_id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={kQ.isFetching && !kQ.isLoading} onRefresh={() => kQ.refetch()} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(`/khata/${item.customer_id}`)}>
            <Card style={styles.row}>
              <Avatar name={item.customer_name} size={40} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.name}>{item.customer_name}</Text>
                <Text style={styles.sub}>Billed {inr(item.billed)} · Paid {inr(item.collected)}</Text>
              </View>
              <Text style={[styles.out, item.outstanding > 0 ? { color: colors.warning } : { color: colors.success }]}>
                {item.outstanding > 0 ? inr(item.outstanding) : 'Settled'}
              </Text>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={kQ.isLoading ? <Loading /> : <Empty icon="book-outline" text="No ledger entries yet. Create an invoice to start tracking dues." />}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  totalCard: { margin: spacing.lg, marginBottom: spacing.md, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryDark, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  totalLabel: { color: colors.textDim, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  totalValue: { color: colors.primary, fontSize: font.size.hero, fontWeight: font.weight.black, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  name: { fontSize: font.size.md, fontWeight: font.weight.heavy, color: colors.text },
  sub: { fontSize: font.size.xs, color: colors.muted, marginTop: 2 },
  out: { fontSize: font.size.md, fontWeight: font.weight.black },
});
