import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { createSale } from '@/src/api/biz';
import { apiError } from '@/src/api/client';
import { PrimaryButton, inr } from '@/src/ui';
import { colors, spacing, radius, font } from '@/src/theme';

export default function NewSale() {
  const router = useRouter();
  const qc = useQueryClient();
  const [customer, setCustomer] = useState('');
  const [title, setTitle] = useState('');
  const [revenue, setRevenue] = useState('');
  const [cost, setCost] = useState('');
  const [busy, setBusy] = useState(false);

  const profit = useMemo(() => (parseFloat(revenue) || 0) - (parseFloat(cost) || 0), [revenue, cost]);

  const save = async () => {
    if (!customer.trim()) { Alert.alert('Customer required', 'Enter the customer name.'); return; }
    if (!revenue) { Alert.alert('Revenue required', 'Enter the sale amount.'); return; }
    setBusy(true);
    try {
      await createSale({ customer_name: customer.trim(), title: title.trim() || undefined, revenue: parseFloat(revenue) || 0, cost: parseFloat(cost) || 0 });
      qc.invalidateQueries({ queryKey: ['biz-summary'] });
      router.back();
    } catch (e) {
      Alert.alert('Could not save', apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Record Sale</Text>
        <View style={{ width: 26 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Customer</Text>
          <TextInput value={customer} onChangeText={setCustomer} placeholder="Customer name" placeholderTextColor={colors.muted} style={styles.input} />
          <Text style={[styles.label, { marginTop: spacing.lg }]}>What did you sell? (optional)</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="e.g. 5kW rooftop system" placeholderTextColor={colors.muted} style={styles.input} />
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Sale amount ₹</Text>
              <TextInput value={revenue} onChangeText={(v) => setRevenue(v.replace(/[^0-9.]/g, ''))} placeholder="0" placeholderTextColor={colors.muted} keyboardType="numeric" style={styles.input} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Your cost ₹</Text>
              <TextInput value={cost} onChangeText={(v) => setCost(v.replace(/[^0-9.]/g, ''))} placeholder="0" placeholderTextColor={colors.muted} keyboardType="numeric" style={styles.input} />
            </View>
          </View>

          <View style={styles.profitCard}>
            <Text style={styles.profitLabel}>Profit on this sale</Text>
            <Text style={[styles.profitValue, { color: profit >= 0 ? colors.success : colors.danger }]}>{inr(profit)}</Text>
          </View>

          <View style={{ height: spacing.lg }} />
          <PrimaryButton label="Save sale" icon="checkmark-circle" onPress={save} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  label: { fontSize: font.size.sm, color: colors.textDim, fontWeight: font.weight.heavy, marginBottom: spacing.sm },
  input: { backgroundColor: colors.bgAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, color: colors.text, fontSize: font.size.md },
  profitCard: { marginTop: spacing.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profitLabel: { color: colors.textDim, fontSize: font.size.md, fontWeight: font.weight.semibold },
  profitValue: { fontSize: font.size.xxl, fontWeight: font.weight.black },
});
