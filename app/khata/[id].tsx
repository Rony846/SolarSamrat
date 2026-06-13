import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLedger, recordOnAccount } from '@/src/api/biz';
import { apiError } from '@/src/api/client';
import { Loading, inr, timeAgo } from '@/src/ui';
import { spacing, radius, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

const MODES = ['cash', 'upi', 'bank'];

export default function Ledger() {
  const { colors, styles } = useThemed(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const lQ = useQuery({ queryKey: ['ledger', id], queryFn: () => getLedger(id!), enabled: !!id });
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('cash');
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    const a = parseFloat(amount) || 0;
    if (!id || a <= 0) { Alert.alert('Enter amount', 'Enter the amount received.'); return; }
    setBusy(true);
    try {
      await recordOnAccount({ customer_id: id, amount: a, mode });
      setAmount('');
      lQ.refetch();
      qc.invalidateQueries({ queryKey: ['khata'] });
    } catch (e) { Alert.alert('Error', apiError(e)); }
    finally { setBusy(false); }
  };

  const cust = lQ.data?.customer;
  const outstanding = lQ.data?.outstanding || 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{cust?.name || 'Ledger'}</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={[styles.outCard, outstanding > 0 ? { borderColor: colors.warning } : { borderColor: colors.success }]}>
        <Text style={styles.outLabel}>{outstanding > 0 ? 'Outstanding' : 'Settled up'}</Text>
        <Text style={[styles.outVal, { color: outstanding > 0 ? colors.warning : colors.success }]}>{inr(Math.abs(outstanding))}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={80}>
        <FlatList
          data={lQ.data?.entries || []}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: spacing.lg }}
          renderItem={({ item }) => {
            const isInvoice = item.type === 'invoice';
            return (
              <View style={styles.entry}>
                <View style={[styles.dot, { backgroundColor: isInvoice ? colors.warning : colors.success }]}>
                  <Ionicons name={isInvoice ? 'receipt-outline' : 'cash-outline'} size={16} color={colors.bg} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.entryTitle}>{isInvoice ? `Invoice ${item.ref || ''}` : `Payment${item.mode ? ` · ${item.mode.toUpperCase()}` : ''}`}</Text>
                  <Text style={styles.entryTime}>{timeAgo(item.created_at)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.entryAmt, { color: isInvoice ? colors.text : colors.success }]}>
                    {isInvoice ? '' : '− '}{inr(item.amount)}
                  </Text>
                  <Text style={styles.entryBal}>bal {inr(item.balance)}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={lQ.isLoading ? <Loading /> : <Text style={styles.empty}>No entries.</Text>}
        />

        <View style={styles.collectBar}>
          <View style={styles.modeRow}>
            {MODES.map((md) => (
              <TouchableOpacity key={md} style={[styles.modeChip, mode === md && styles.modeChipOn]} onPress={() => setMode(md)}>
                <Text style={[styles.modeText, mode === md && { color: colors.primary }]}>{md.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <TextInput value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))} placeholder="Payment received ₹" placeholderTextColor={colors.muted} keyboardType="numeric" style={styles.input} />
            <TouchableOpacity style={[styles.recBtn, busy && { opacity: 0.5 }]} onPress={pay} disabled={busy}>
              <Text style={styles.recText}>Record</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  outCard: { margin: spacing.lg, marginBottom: 0, borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', backgroundColor: colors.card },
  outLabel: { color: colors.textDim, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  outVal: { fontSize: font.size.hero, fontWeight: font.weight.black, marginTop: 2 },
  entry: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  entryTitle: { color: colors.text, fontSize: font.size.md, fontWeight: font.weight.heavy },
  entryTime: { color: colors.muted, fontSize: font.size.xs, marginTop: 2 },
  entryAmt: { fontSize: font.size.md, fontWeight: font.weight.heavy },
  entryBal: { color: colors.muted, fontSize: font.size.xs, marginTop: 2 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: spacing.xxl },
  collectBar: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgAlt },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeChip: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  modeChipOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  modeText: { color: colors.textDim, fontWeight: font.weight.heavy, fontSize: font.size.xs },
  input: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, color: colors.text, fontSize: font.size.md },
  recBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  recText: { color: colors.onPrimary, fontWeight: font.weight.black },
});
