import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { createQuote, type QuoteItem } from '@/src/api/biz';
import { apiError } from '@/src/api/client';
import { PrimaryButton, inr } from '@/src/ui';
import { spacing, radius, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

type DraftItem = { name: string; qty: string; unit_price: string; cost_price: string; gst_pct: string };
const blank = (): DraftItem => ({ name: '', qty: '1', unit_price: '', cost_price: '', gst_pct: '18' });

export default function NewQuote() {
  const { colors, styles } = useThemed(makeStyles);
  const router = useRouter();
  const qc = useQueryClient();
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [items, setItems] = useState<DraftItem[]>([blank()]);
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const setItem = (idx: number, k: keyof DraftItem, v: string) =>
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, [k]: v } : it)));
  const addItem = () => setItems((arr) => [...arr, blank()]);
  const removeItem = (idx: number) => setItems((arr) => (arr.length > 1 ? arr.filter((_, i) => i !== idx) : arr));

  const totals = useMemo(() => {
    let subtotal = 0, gst = 0, cost = 0;
    for (const it of items) {
      const qty = parseFloat(it.qty) || 0;
      const up = parseFloat(it.unit_price) || 0;
      const cp = parseFloat(it.cost_price) || 0;
      const g = parseFloat(it.gst_pct) || 0;
      subtotal += qty * up;
      gst += (qty * up * g) / 100;
      cost += qty * cp;
    }
    const disc = parseFloat(discount) || 0;
    return { subtotal, gst, cost, disc, total: subtotal + gst - disc, profit: subtotal - disc - cost };
  }, [items, discount]);

  const submit = async () => {
    if (!customer.trim()) { Alert.alert('Customer required', "Enter the customer's name."); return; }
    const cleanItems: QuoteItem[] = items
      .filter((it) => it.name.trim())
      .map((it) => ({
        name: it.name.trim(), qty: parseFloat(it.qty) || 1, unit_price: parseFloat(it.unit_price) || 0,
        cost_price: parseFloat(it.cost_price) || 0, gst_pct: parseFloat(it.gst_pct) || 0,
      }));
    if (!cleanItems.length) { Alert.alert('Add an item', 'Add at least one line item with a name.'); return; }
    setBusy(true);
    try {
      const q = await createQuote({
        customer_name: customer.trim(), customer_phone: phone.trim() || undefined,
        items: cleanItems, discount: parseFloat(discount) || 0, notes: notes.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ['quotes'] });
      qc.invalidateQueries({ queryKey: ['biz-summary'] });
      router.replace(`/quotes/${q.id}`);
    } catch (e) {
      Alert.alert('Could not create', apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>New Quote</Text>
        <View style={{ width: 26 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Customer</Text>
          <TextInput value={customer} onChangeText={setCustomer} placeholder="Customer name" placeholderTextColor={colors.muted} style={styles.input} />
          <TextInput value={phone} onChangeText={setPhone} placeholder="Phone (optional)" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={[styles.input, { marginTop: spacing.sm }]} />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Items</Text>
          {items.map((it, idx) => (
            <View key={idx} style={styles.itemCard}>
              <View style={styles.itemTop}>
                <TextInput value={it.name} onChangeText={(v) => setItem(idx, 'name', v)} placeholder={`Item ${idx + 1} name`} placeholderTextColor={colors.muted} style={[styles.input, { flex: 1 }]} />
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(idx)} style={styles.removeBtn}><Ionicons name="trash-outline" size={18} color={colors.danger} /></TouchableOpacity>
                )}
              </View>
              <View style={styles.itemRow}>
                <Mini label="Qty" value={it.qty} onChange={(v) => setItem(idx, 'qty', v)} />
                <Mini label="Rate ₹" value={it.unit_price} onChange={(v) => setItem(idx, 'unit_price', v)} />
                <Mini label="Cost ₹" value={it.cost_price} onChange={(v) => setItem(idx, 'cost_price', v)} />
                <Mini label="GST %" value={it.gst_pct} onChange={(v) => setItem(idx, 'gst_pct', v)} />
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addItem} onPress={addItem}>
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={styles.addItemText}>Add item</Text>
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Discount ₹ (optional)</Text>
          <TextInput value={discount} onChangeText={setDiscount} placeholder="0" placeholderTextColor={colors.muted} keyboardType="numeric" style={styles.input} />
          <Text style={[styles.label, { marginTop: spacing.lg }]}>Notes (optional)</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="Terms, installation, warranty…" placeholderTextColor={colors.muted} multiline style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]} />

          <View style={styles.totals}>
            <Row label="Subtotal" value={inr(totals.subtotal)} />
            <Row label="GST" value={inr(totals.gst)} />
            <Row label="Discount" value={`- ${inr(totals.disc)}`} />
            <Row label="Total" value={inr(totals.total)} big />
            <Row label="Your profit" value={inr(totals.profit)} profit />
          </View>

          <View style={{ height: spacing.lg }} />
          <PrimaryButton label="Create quote" icon="document-text" onPress={submit} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Mini({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { colors, styles } = useThemed(makeStyles);
  return (
    <View style={styles.mini}>
      <Text style={styles.miniLabel}>{label}</Text>
      <TextInput value={value} onChangeText={(v) => onChange(v.replace(/[^0-9.]/g, ''))} keyboardType="numeric" style={styles.miniInput} placeholderTextColor={colors.muted} />
    </View>
  );
}

function Row({ label, value, big, profit }: { label: string; value: string; big?: boolean; profit?: boolean }) {
  const { colors, styles } = useThemed(makeStyles);
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, big && { color: colors.text, fontWeight: font.weight.black }]}>{label}</Text>
      <Text style={[styles.totalValue, big && styles.totalBig, profit && { color: colors.success }]}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  label: { fontSize: font.size.sm, color: colors.textDim, fontWeight: font.weight.heavy, marginBottom: spacing.sm },
  input: { backgroundColor: colors.bgAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, color: colors.text, fontSize: font.size.md },
  itemCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  removeBtn: { padding: spacing.sm },
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
