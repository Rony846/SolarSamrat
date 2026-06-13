import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/AuthContext';
import { createInvoice, type InvoiceItem } from '@/src/api/biz';
import { apiError } from '@/src/api/client';
import { PrimaryButton, inr } from '@/src/ui';
import { spacing, radius, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

type DraftItem = { name: string; hsn: string; qty: string; unit_price: string; gst_pct: string };
const blank = (): DraftItem => ({ name: '', hsn: '', qty: '1', unit_price: '', gst_pct: '18' });

export default function NewInvoice() {
  const { colors, styles } = useThemed(makeStyles);
  const router = useRouter();
  const qc = useQueryClient();
  const { member } = useAuth();
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [pos, setPos] = useState(member?.state || '');
  const [items, setItems] = useState<DraftItem[]>([blank()]);
  const [discount, setDiscount] = useState('');
  const [busy, setBusy] = useState(false);

  const setItem = (i: number, k: keyof DraftItem, v: string) =>
    setItems((a) => a.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const addItem = () => setItems((a) => [...a, blank()]);
  const removeItem = (i: number) => setItems((a) => (a.length > 1 ? a.filter((_, idx) => idx !== i) : a));

  const intra = !pos.trim() || !member?.state || pos.trim().toLowerCase() === (member.state || '').toLowerCase();

  const totals = useMemo(() => {
    let sub = 0, gst = 0;
    for (const it of items) {
      const q = parseFloat(it.qty) || 0, up = parseFloat(it.unit_price) || 0, g = parseFloat(it.gst_pct) || 0;
      sub += q * up; gst += (q * up * g) / 100;
    }
    const disc = parseFloat(discount) || 0;
    return { sub, gst, disc, total: sub + gst - disc, cgst: gst / 2, igst: gst };
  }, [items, discount]);

  const submit = async () => {
    if (!customer.trim()) { Alert.alert('Customer required', "Enter the customer's name."); return; }
    const clean: InvoiceItem[] = items.filter((it) => it.name.trim()).map((it) => ({
      name: it.name.trim(), hsn: it.hsn.trim() || undefined, qty: parseFloat(it.qty) || 1,
      unit_price: parseFloat(it.unit_price) || 0, gst_pct: parseFloat(it.gst_pct) || 0,
    }));
    if (!clean.length) { Alert.alert('Add an item', 'Add at least one line item.'); return; }
    setBusy(true);
    try {
      const inv = await createInvoice({
        customer_name: customer.trim(), customer_phone: phone.trim() || undefined,
        customer_gstin: gstin.trim() || undefined, place_of_supply: pos.trim() || undefined,
        items: clean, discount: parseFloat(discount) || 0,
      });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['khata'] });
      qc.invalidateQueries({ queryKey: ['biz-summary'] });
      router.replace(`/invoices/${inv.id}`);
    } catch (e) {
      Alert.alert('Could not create', apiError(e));
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>New Invoice</Text>
        <View style={{ width: 26 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Bill to</Text>
          <TextInput value={customer} onChangeText={setCustomer} placeholder="Customer name" placeholderTextColor={colors.muted} style={styles.input} />
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={[styles.input, { flex: 1 }]} />
            <TextInput value={pos} onChangeText={setPos} placeholder="Place of supply (state)" placeholderTextColor={colors.muted} style={[styles.input, { flex: 1.2 }]} />
          </View>
          <TextInput value={gstin} onChangeText={(t) => setGstin(t.toUpperCase())} placeholder="Customer GSTIN (optional)" placeholderTextColor={colors.muted} autoCapitalize="characters" style={[styles.input, { marginTop: spacing.sm }]} />
          <View style={styles.taxNote}>
            <Ionicons name="information-circle-outline" size={14} color={colors.muted} />
            <Text style={styles.taxNoteText}>{intra ? 'Intra-state → CGST + SGST' : 'Inter-state → IGST'}</Text>
          </View>

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Items</Text>
          {items.map((it, i) => (
            <View key={i} style={styles.itemCard}>
              <View style={styles.itemTop}>
                <TextInput value={it.name} onChangeText={(v) => setItem(i, 'name', v)} placeholder={`Item ${i + 1}`} placeholderTextColor={colors.muted} style={[styles.input, { flex: 1 }]} />
                {items.length > 1 && <TouchableOpacity onPress={() => removeItem(i)} style={styles.rm}><Ionicons name="trash-outline" size={18} color={colors.danger} /></TouchableOpacity>}
              </View>
              <View style={styles.itemRow}>
                <Mini label="HSN" value={it.hsn} onChange={(v) => setItem(i, 'hsn', v)} numeric={false} />
                <Mini label="Qty" value={it.qty} onChange={(v) => setItem(i, 'qty', v)} />
                <Mini label="Rate ₹" value={it.unit_price} onChange={(v) => setItem(i, 'unit_price', v)} />
                <Mini label="GST %" value={it.gst_pct} onChange={(v) => setItem(i, 'gst_pct', v)} />
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addItem} onPress={addItem}>
            <Ionicons name="add" size={18} color={colors.primary} /><Text style={styles.addItemText}>Add item</Text>
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Discount ₹ (optional)</Text>
          <TextInput value={discount} onChangeText={(t) => setDiscount(t.replace(/[^0-9.]/g, ''))} placeholder="0" placeholderTextColor={colors.muted} keyboardType="numeric" style={styles.input} />

          <View style={styles.totals}>
            <Row label="Taxable value" value={inr(totals.sub)} />
            {intra ? (
              <>
                <Row label="CGST" value={inr(totals.cgst)} />
                <Row label="SGST" value={inr(totals.cgst)} />
              </>
            ) : <Row label="IGST" value={inr(totals.igst)} />}
            <Row label="Discount" value={`- ${inr(totals.disc)}`} />
            <Row label="Total" value={inr(totals.total)} big />
          </View>

          <View style={{ height: spacing.lg }} />
          <PrimaryButton label="Create invoice" icon="receipt" onPress={submit} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Mini({ label, value, onChange, numeric = true }: { label: string; value: string; onChange: (v: string) => void; numeric?: boolean }) {
  const { colors, styles } = useThemed(makeStyles);
  return (
    <View style={styles.mini}>
      <Text style={styles.miniLabel}>{label}</Text>
      <TextInput value={value} onChangeText={(v) => onChange(numeric ? v.replace(/[^0-9.]/g, '') : v)} keyboardType={numeric ? 'numeric' : 'default'} style={styles.miniInput} placeholderTextColor={colors.muted} />
    </View>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  const { colors, styles } = useThemed(makeStyles);
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, big && { color: colors.text, fontWeight: font.weight.black }]}>{label}</Text>
      <Text style={[styles.totalValue, big && styles.totalBig]}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  label: { fontSize: font.size.sm, color: colors.textDim, fontWeight: font.weight.heavy, marginBottom: spacing.sm },
  input: { backgroundColor: colors.bgAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, color: colors.text, fontSize: font.size.md },
  taxNote: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  taxNoteText: { fontSize: font.size.xs, color: colors.muted },
  itemCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rm: { padding: spacing.sm },
  itemRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  mini: { flex: 1 },
  miniLabel: { fontSize: 10, color: colors.muted, marginBottom: 2, textAlign: 'center' },
  miniInput: { backgroundColor: colors.bgAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: spacing.sm, color: colors.text, fontSize: font.size.sm, textAlign: 'center' },
  addItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary },
  addItemText: { color: colors.primary, fontWeight: font.weight.heavy, fontSize: font.size.sm },
  totals: { marginTop: spacing.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { color: colors.muted, fontSize: font.size.sm },
  totalValue: { color: colors.text, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  totalBig: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.primary },
});
