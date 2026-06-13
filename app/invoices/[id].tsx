import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Share,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as WebBrowser from 'expo-web-browser';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/AuthContext';
import { getInvoice, recordPayment, setUpi } from '@/src/api/biz';
import { getMyMembership } from '@/src/api/samrat';
import { apiError } from '@/src/api/client';
import { Card, Loading, inr } from '@/src/ui';
import { spacing, radius, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

const STATUS_C = (c: ThemePalette): Record<string, string> => ({ unpaid: c.warning, partial: c.accent, paid: c.success });
const MODES = ['cash', 'upi', 'bank'];

export default function InvoiceDetail() {
  const { colors, styles } = useThemed(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { setMember } = useAuth();
  const invQ = useQuery({ queryKey: ['invoice', id], queryFn: () => getInvoice(id!), enabled: !!id });
  const inv = invQ.data;
  const STATUS_COLOR = STATUS_C(colors);

  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('upi');
  const [busy, setBusy] = useState(false);
  const [upi, setUpiVal] = useState('');
  const [showCollect, setShowCollect] = useState(false);

  const due = inv ? Math.max(0, inv.total - inv.amount_paid) : 0;

  const refresh = () => {
    invQ.refetch();
    qc.invalidateQueries({ queryKey: ['invoices'] });
    qc.invalidateQueries({ queryKey: ['khata'] });
  };

  const saveUpi = async () => {
    if (!upi.trim()) return;
    try {
      await setUpi(upi.trim());
      const me = await getMyMembership();
      setMember(me.member);
      invQ.refetch();
    } catch (e) { Alert.alert('Error', apiError(e)); }
  };

  const collect = async () => {
    if (!inv?.public_url) return;
    try {
      await Share.share({ message: `${inv.customer_name}, your invoice ${inv.number} — balance ${inr(due)}.\nView & pay: ${inv.public_url}` });
    } catch { /* cancelled */ }
  };

  const pay = async () => {
    const a = parseFloat(amount) || 0;
    if (!id || a <= 0) { Alert.alert('Enter amount', 'Enter the amount received.'); return; }
    setBusy(true);
    try {
      await recordPayment(id, { amount: a, mode });
      setAmount('');
      refresh();
    } catch (e) { Alert.alert('Error', apiError(e)); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
        <View style={{ width: 26 }} />
      </View>
      {invQ.isLoading || !inv ? (
        <Loading />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={80}>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <Card>
              <View style={styles.top}>
                <View>
                  <Text style={styles.number}>{inv.number}</Text>
                  <Text style={styles.customer}>{inv.customer_name}</Text>
                </View>
                <View style={[styles.chip, { backgroundColor: STATUS_COLOR[inv.status] + '22' }]}>
                  <Text style={[styles.chipText, { color: STATUS_COLOR[inv.status] }]}>{inv.status}</Text>
                </View>
              </View>
              <View style={styles.totals}>
                <Row label="Taxable" value={inr(inv.subtotal)} />
                {inv.intra_state ? (<><Row label="CGST" value={inr(inv.cgst)} /><Row label="SGST" value={inr(inv.sgst)} /></>) : <Row label="IGST" value={inr(inv.igst)} />}
                {inv.discount_amount > 0 && <Row label="Discount" value={`- ${inr(inv.discount_amount)}`} />}
                <Row label="Total" value={inr(inv.total)} big />
                <Row label="Paid" value={inr(inv.amount_paid)} />
                <Row label="Balance due" value={inr(due)} due />
              </View>
            </Card>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.shareBtn} onPress={collect}>
                <Ionicons name="share-social" size={18} color={colors.onPrimary} />
                <Text style={styles.shareText}>Send invoice</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pdfBtn} onPress={() => inv.pdf_url && WebBrowser.openBrowserAsync(inv.pdf_url)}>
                <Ionicons name="document" size={18} color={colors.primary} />
                <Text style={styles.pdfText}>PDF</Text>
              </TouchableOpacity>
            </View>

            {/* UPI collect */}
            {due > 0 && (
              <Card style={{ marginTop: spacing.lg }}>
                <Text style={styles.section}>Collect {inr(due)} via UPI</Text>
                {inv.upi_link ? (
                  <>
                    {showCollect ? (
                      <View style={styles.qrWrap}>
                        <View style={styles.qrBox}><QRCode value={inv.upi_link} size={196} backgroundColor="#ffffff" color="#000000" /></View>
                        <Text style={styles.qrHint}>Customer scans with any UPI app</Text>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.qrBtn} onPress={() => setShowCollect(true)}>
                        <Ionicons name="qr-code" size={20} color={colors.onPrimary} />
                        <Text style={styles.qrBtnText}>Show UPI QR</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <View>
                    <Text style={styles.upiNote}>Add your UPI ID to collect payments directly to your bank.</Text>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                      <TextInput value={upi} onChangeText={setUpiVal} placeholder="yourname@okhdfcbank" placeholderTextColor={colors.muted} autoCapitalize="none" style={[styles.input, { flex: 1 }]} />
                      <TouchableOpacity style={styles.saveUpi} onPress={saveUpi}><Text style={styles.saveUpiText}>Save</Text></TouchableOpacity>
                    </View>
                  </View>
                )}
              </Card>
            )}

            {/* Record payment */}
            {due > 0 && (
              <Card style={{ marginTop: spacing.lg }}>
                <Text style={styles.section}>Record a payment</Text>
                <View style={styles.modeRow}>
                  {MODES.map((md) => (
                    <TouchableOpacity key={md} style={[styles.modeChip, mode === md && styles.modeChipOn]} onPress={() => setMode(md)}>
                      <Text style={[styles.modeText, mode === md && { color: colors.primary }]}>{md.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                  <TextInput value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))} placeholder={`Amount (due ${inr(due)})`} placeholderTextColor={colors.muted} keyboardType="numeric" style={[styles.input, { flex: 1 }]} />
                  <TouchableOpacity style={[styles.recBtn, busy && { opacity: 0.5 }]} onPress={pay} disabled={busy}>
                    <Text style={styles.recText}>Record</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => setAmount(String(due))}><Text style={styles.full}>Mark full payment ({inr(due)})</Text></TouchableOpacity>
              </Card>
            )}

            {!!inv.payments?.length && (
              <View style={{ marginTop: spacing.lg }}>
                <Text style={styles.section}>Payments</Text>
                {inv.payments.map((p) => (
                  <View key={p.id} style={styles.payRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.payAmt}>{inr(p.amount)}</Text>
                    <Text style={styles.payMode}>{(p.mode || '').toUpperCase()}{p.ref ? ` · ${p.ref}` : ''}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value, big, due }: { label: string; value: string; big?: boolean; due?: boolean }) {
  const { colors, styles } = useThemed(makeStyles);
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, big && { color: colors.text, fontWeight: font.weight.black }, due && { color: colors.warning, fontWeight: font.weight.black }]}>{label}</Text>
      <Text style={[styles.totalValue, big && styles.totalBig, due && { color: colors.warning, fontWeight: font.weight.black }]}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  number: { fontSize: font.size.xs, color: colors.muted, fontWeight: font.weight.heavy },
  customer: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text, marginTop: 2 },
  chip: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 3 },
  chipText: { fontSize: font.size.xs, fontWeight: font.weight.black, textTransform: 'capitalize' },
  totals: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { color: colors.muted, fontSize: font.size.sm },
  totalValue: { color: colors.text, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  totalBig: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.primary },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md },
  shareText: { color: colors.onPrimary, fontWeight: font.weight.black, fontSize: font.size.md },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg },
  pdfText: { color: colors.primary, fontWeight: font.weight.heavy },
  section: { fontSize: font.size.md, fontWeight: font.weight.black, color: colors.text, marginBottom: spacing.sm },
  qrWrap: { alignItems: 'center', paddingVertical: spacing.sm },
  qrBox: { backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.md },
  qrHint: { color: colors.muted, fontSize: font.size.xs, marginTop: spacing.sm },
  qrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md },
  qrBtnText: { color: colors.onPrimary, fontWeight: font.weight.black },
  upiNote: { color: colors.textDim, fontSize: font.size.sm },
  input: { backgroundColor: colors.bgAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, color: colors.text, fontSize: font.size.md },
  saveUpi: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  saveUpiText: { color: colors.onPrimary, fontWeight: font.weight.black },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeChip: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgAlt },
  modeChipOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  modeText: { color: colors.textDim, fontWeight: font.weight.heavy, fontSize: font.size.xs },
  recBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  recText: { color: colors.onPrimary, fontWeight: font.weight.black },
  full: { color: colors.primary, fontWeight: font.weight.heavy, fontSize: font.size.sm, marginTop: spacing.sm, textAlign: 'center' },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  payAmt: { color: colors.text, fontWeight: font.weight.heavy, fontSize: font.size.md },
  payMode: { color: colors.muted, fontSize: font.size.xs, flex: 1 },
});
