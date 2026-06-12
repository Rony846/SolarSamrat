import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getDirectory } from '@/src/api/samrat';
import { Card, Avatar, RankChip, Loading, Empty, ROLE_LABEL } from '@/src/ui';
import { colors, spacing, radius, font } from '@/src/theme';

const ROLES = ['', 'dealer', 'distributor', 'epc', 'brand'];

export default function Directory() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const dirQ = useQuery({
    queryKey: ['directory', role, search],
    queryFn: () => getDirectory({ role: role || undefined, q: search || undefined }),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Members</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => setSearch(q)}
          placeholder="Search business, city, category…"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      <View style={styles.roleRow}>
        {ROLES.map((r) => (
          <TouchableOpacity key={r || 'all'} style={[styles.rChip, role === r && styles.rChipActive]} onPress={() => setRole(r)}>
            <Text style={[styles.rChipText, role === r && styles.rChipTextActive]}>{r ? ROLE_LABEL[r] : 'All'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={dirQ.data?.members || []}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={dirQ.isFetching && !dirQ.isLoading} onRefresh={() => dirQ.refetch()} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Avatar name={item.business_name} size={44} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.name}>{item.business_name}</Text>
              <Text style={styles.sub}>{ROLE_LABEL[item.role] || item.role}{item.city ? ` · ${item.city}` : ''}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <RankChip rank={item.rank} />
              <Text style={styles.crowns}>{item.crowns} 👑</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={dirQ.isLoading ? <Loading /> : <Empty icon="people-outline" text="No members found." />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, margin: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchInput: { flex: 1, color: colors.text, fontSize: font.size.md },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  rChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  rChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  rChipText: { color: colors.textDim, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  rChipTextActive: { color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  name: { fontSize: font.size.md, fontWeight: font.weight.heavy, color: colors.text },
  sub: { fontSize: font.size.xs, color: colors.muted, marginTop: 2 },
  crowns: { fontSize: font.size.sm, color: colors.primary, fontWeight: font.weight.heavy, marginTop: 3 },
});
