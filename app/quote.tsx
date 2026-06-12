import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { aiQuote, type AiQuoteInput } from '@/src/api/samrat';
import type { AiQuoteResult } from '@/src/api/types';
import { apiError } from '@/src/api/client';
import { Card, Field, PrimaryButton, inr } from '@/src/ui';
import { colors, spacing, radius, font } from '@/src/theme';

export default function Quote() {
  const router = useRouter();
  const [units, setUnits] = useState('');
  const [bill, setBill] = useState('');
  const [state, setState] = useState('');
  const [backup, setBackup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AiQuoteResult | null>(null);

  const run = async () => {
    if (!units && !bill) {
      Alert.alert('Add details', 'Enter your monthly units (kWh) or monthly bill (₹).');
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const input: AiQuoteInput = {
        monthly_units: units ? Number(units) : undefined,
        monthly_bill: bill ? Number(bill) : undefined,
        state: state || undefined,
        backup_required: backup,
      };
      setResult(await aiQuote(input));
    } catch (e) {
      Alert.alert('AI sizing failed', apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.backHeader}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={styles.backTitle}>AI Solar Quote</Text>
        <View style={{ width: 26 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Ionicons name="sparkles" size={22} color={colors.primary} />
            <Text style={styles.heroTitle}>AI Solar Quote</Text>
          </View>
          <Text style={styles.heroSub}>
            Size a rooftop system in seconds — BOM, PM Surya Ghar subsidy & payback. Close customers on the spot.
          </Text>

          <Card style={{ marginTop: spacing.lg }}>
            <Field label="Monthly consumption (kWh / units)" value={units} onChangeText={(t) => setUnits(t.replace(/[^0-9.]/g, ''))} keyboardType="numeric" placeholder="e.g. 450" />
            <Text style={styles.or}>— or —</Text>
            <Field label="Monthly electricity bill (₹)" value={bill} onChangeText={(t) => setBill(t.replace(/[^0-9.]/g, ''))} keyboardType="numeric" placeholder="e.g. 4500" />
            <Field label="State" value={state} onChangeText={setState} placeholder="e.g. Rajasthan" />
            <TouchableOpacity style={styles.toggle} onPress={() => setBackup((b) => !b)} activeOpacity={0.8}>
              <Ionicons name={backup ? 'checkbox' : 'square-outline'} size={22} color={backup ? colors.primary : colors.muted} />
              <Text style={styles.toggleText}>Customer needs battery backup</Text>
            </TouchableOpacity>
            <View style={{ height: spacing.md }} />
            <PrimaryButton label="Generate quote" icon="flash" onPress={run} loading={busy} />
          </Card>

          {result && <ResultCard r={result} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ResultCard({ r }: { r: AiQuoteResult }) {
  return (
    <Card style={{ marginTop: spacing.lg, borderColor: colors.primary }}>
      <View style={styles.sizeRow}>
        <Text style={styles.sizeNum}>{r.system_size_kw ?? '—'}</Text>
        <Text style={styles.sizeUnit}>kW system</Text>
      </View>
      {!!r.summary && <Text style={styles.summary}>{r.summary}</Text>}

      <View style={styles.grid}>
        <Metric label="Est. cost" value={inr(r.estimated_cost_inr)} />
        <Metric label="Subsidy" value={inr(r.subsidy_inr)} accent />
        <Metric label="Net cost" value={inr(r.net_cost_inr)} />
        <Metric label="Monthly savings" value={inr(r.monthly_savings_inr)} accent />
        <Metric label="Payback" value={r.payback_years != null ? `${r.payback_years} yrs` : '—'} />
        <Metric label="Units offset" value={r.monthly_units_offset != null ? `${r.monthly_units_offset}/mo` : '—'} />
      </View>

      <View style={styles.bom}>
        <BomRow icon="grid-outline" label="Panels" value={r.panel_recommendation} />
        <BomRow icon="hardware-chip-outline" label="Inverter" value={r.inverter_recommendation} />
        <BomRow icon="battery-charging-outline" label="Battery" value={r.battery_recommendation} />
        <BomRow icon="construct-outline" label="Structure" value={r.structure} />
      </View>

      {!!r.assumptions?.length && (
        <View style={styles.assume}>
          <Text style={styles.assumeTitle}>Assumptions</Text>
          {r.assumptions.map((a, i) => (
            <Text key={i} style={styles.assumeText}>• {a}</Text>
          ))}
        </View>
      )}
    </Card>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, accent && { color: colors.success }]}>{value}</Text>
    </View>
  );
}

function BomRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.bomRow}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.bomLabel}>{label}</Text>
      <Text style={styles.bomValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  backHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroTitle: { fontSize: font.size.xxl, fontWeight: font.weight.black, color: colors.text },
  heroSub: { fontSize: font.size.sm, color: colors.textDim, marginTop: spacing.xs, lineHeight: 19 },
  or: { textAlign: 'center', color: colors.muted, fontSize: font.size.xs, marginBottom: spacing.md, marginTop: -spacing.sm },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleText: { color: colors.text, fontSize: font.size.md },
  sizeRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  sizeNum: { fontSize: 48, fontWeight: font.weight.black, color: colors.primary },
  sizeUnit: { fontSize: font.size.lg, color: colors.textDim, fontWeight: font.weight.semibold },
  summary: { fontSize: font.size.sm, color: colors.textDim, lineHeight: 20, marginTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  metric: { width: '33.33%', paddingVertical: spacing.sm },
  metricLabel: { fontSize: font.size.xs, color: colors.muted },
  metricValue: { fontSize: font.size.md, fontWeight: font.weight.heavy, color: colors.text, marginTop: 2 },
  bom: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, gap: spacing.sm },
  bomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bomLabel: { fontSize: font.size.sm, color: colors.muted, width: 70 },
  bomValue: { fontSize: font.size.sm, color: colors.text, flex: 1, fontWeight: font.weight.medium },
  assume: { marginTop: spacing.md, backgroundColor: colors.bgAlt, borderRadius: radius.md, padding: spacing.md },
  assumeTitle: { fontSize: font.size.xs, color: colors.textDim, fontWeight: font.weight.heavy, marginBottom: spacing.xs },
  assumeText: { fontSize: font.size.xs, color: colors.muted, lineHeight: 18 },
});
