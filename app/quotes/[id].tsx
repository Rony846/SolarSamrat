import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getQuote, setQuoteStatus } from '@/src/api/biz';
import { apiError } from '@/src/api/client';
import { Card, Loading, PrimaryButton, inr } from '@/src/ui';
import { spacing, radius, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

const statusColors = (c: ThemePalette): Record<string, string> => ({
  draft: c.muted, sent: c.accent, accepted: c.success, rejected: c.danger,
});

export default function QuoteDetail() {
  const { colors, styles } = useThemed(makeStyles);
  const STATUS_COLOR = statusColors(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const quoteQ = useQuery({ queryKey: ['quote', id], queryFn: () => getQuote(id!), enabled: !!id });
  const [busy, setBusy] = useState(false);
  const q = quoteQ.data;

  const share = async () => {
    if (!q?.public_url) return;
    try {
      await setStatus('sent', true);
      await Share.share({
        message: `Hi ${q.customer_name}, here's your quotation from us:\n${q.public_url}\n\nTotal: ${inr(q.total)} (valid ${q.validity_days} days).`,
      });
    } catch { /* user cancelled */ }
  };

  const openPdf = () => { if (q?.pdf_url) WebBrowser.openBrowserAsync(q.pdf_url); };

  const setStatus = async (status: string, silent = false) => {
    if (!id) return;
    if (!silent) setBusy(true);
    try {
      await setQuoteStatus(id, status);
      qc.invalidateQueries({ queryKey: ['quotes'] });
      qc.invalidateQueries({ queryKey: ['biz-summary'] });
      await quoteQ.refetch();
      if (!silent && status === 'accepted') Alert.alert('Booked 🎉', 'Quote accepted — sale & profit recorded in your dashboard.');
    } catch (e) {
      if (!silent) Alert.alert('Error', apiError(e));
    } finally {
      if (!silent) setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Quote</Text>
        <View style={{ width: 26 }} />
      </View>
      {quoteQ.isLoading || !q ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
          <Card>
            <View style={styles.top}>
              <View>
                <Text style={styles.number}>{q.number}</Text>
                <Text style={styles.customer}>{q.customer_name}</Text>
                {!!q.customer_phone && <Text style={styles.phone}>{q.customer_phone}</Text>}
              </View>
              <View style={[styles.statusChip, { backgroundColor: (STATUS_COLOR[q.status] || colors.muted) + '22' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[q.status] || colors.muted }]}>{q.status}</Text>
              </View>
            </View>

            <View style={styles.items}>
              {(q.items || []).map((it, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                  <Text style={styles.itemQty}>{it.qty} × {inr(it.unit_price)}</Text>
                  <Text style={styles.itemAmt}>{inr(it.qty * it.unit_price)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.totals}>
              <Row label="Subtotal" value={inr(q.subtotal)} />
              <Row label="GST" value={inr(q.gst_amount)} />
              {q.discount_amount > 0 && <Row label="Discount" value={`- ${inr(q.discount_amount)}`} />}
              <Row label="Total" value={inr(q.total)} big />
              <Row label="Your profit" value={inr(q.profit)} profit />
            </View>
            {!!q.notes && <Text style={styles.notes}>{q.notes}</Text>}
          </Card>

          <View style={styles.shareRow}>
            <TouchableOpacity style={styles.shareBtn} onPress={share}>
              <Ionicons name="share-social" size={20} color={colors.onPrimary} />
              <Text style={styles.shareText}>Send to customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pdfBtn} onPress={openPdf}>
              <Ionicons name="document" size={20} color={colors.primary} />
              <Text style={styles.pdfText}>PDF</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.section}>Update status</Text>
          <View style={styles.statusBtns}>
            <StatusBtn label="Sent" active={q.status === 'sent'} color={colors.accent} onPress={() => setStatus('sent')} disabled={busy} />
            <StatusBtn label="Accepted" active={q.status === 'accepted'} color={colors.success} onPress={() => setStatus('accepted')} disabled={busy} />
            <StatusBtn label="Rejected" active={q.status === 'rejected'} color={colors.danger} onPress={() => setStatus('rejected')} disabled={busy} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value, big, profit }: { label: string; value: string; big?: boolean; profit?: boolean }) {
  const { colors, styles } = useThemed(makeStyles);
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, big && { color: colors.text, fontWeight: font.weight.black }]}>{label}</Text>
      <Text style={[styles.totalValue, big && styles.totalBig, profit && { color: colors.success, fontWeight: font.weight.black }]}>{value}</Text>
    </View>
  );
}

function StatusBtn({ label, active, color, onPress, disabled }: { label: string; active: boolean; color: string; onPress: () => void; disabled?: boolean }) {
  const { colors, styles } = useThemed(makeStyles);
  return (
    <TouchableOpacity style={[styles.sBtn, active && { backgroundColor: color + '22', borderColor: color }]} onPress={onPress} disabled={disabled}>
      <Text style={[styles.sBtnText, active && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  number: { fontSize: font.size.xs, color: colors.muted, fontWeight: font.weight.heavy },
  customer: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text, marginTop: 2 },
  phone: { fontSize: font.size.sm, color: colors.textDim },
  statusChip: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 3 },
  statusText: { fontSize: font.size.xs, fontWeight: font.weight.black, textTransform: 'capitalize' },
  items: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, gap: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemName: { flex: 1, color: colors.text, fontSize: font.size.sm },
  itemQty: { color: colors.muted, fontSize: font.size.xs, marginHorizontal: spacing.sm },
  itemAmt: { color: colors.text, fontSize: font.size.sm, fontWeight: font.weight.semibold, minWidth: 70, textAlign: 'right' },
  totals: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { color: colors.muted, fontSize: font.size.sm },
  totalValue: { color: colors.text, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  totalBig: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.primary },
  notes: { marginTop: spacing.md, fontSize: font.size.sm, color: colors.textDim, backgroundColor: colors.bgAlt, padding: spacing.md, borderRadius: radius.md, lineHeight: 19 },
  shareRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md },
  shareText: { color: colors.onPrimary, fontWeight: font.weight.black, fontSize: font.size.md },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg },
  pdfText: { color: colors.primary, fontWeight: font.weight.heavy },
  section: { fontSize: font.size.md, fontWeight: font.weight.black, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  statusBtns: { flexDirection: 'row', gap: spacing.sm },
  sBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  sBtnText: { color: colors.textDim, fontWeight: font.weight.heavy, fontSize: font.size.sm },
});
