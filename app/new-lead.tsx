import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createLead, getMeta, type LeadInput } from '@/src/api/samrat';
import { apiError } from '@/src/api/client';
import { Field, PrimaryButton } from '@/src/ui';
import { colors, spacing, radius, font } from '@/src/theme';

export default function NewLead() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: getMeta });
  const [form, setForm] = useState<LeadInput>({ title: '', type: 'rfq' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof LeadInput, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) {
      Alert.alert('Add a title', 'Describe what you need in the title.');
      return;
    }
    setBusy(true);
    try {
      await createLead(form);
      qc.invalidateQueries({ queryKey: ['leads'] });
      router.back();
    } catch (e) {
      Alert.alert('Could not post', apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={26} color={colors.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Post a lead</Text>
          <View style={{ width: 26 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <View style={styles.toggleRow}>
            {(['rfq', 'project'] as const).map((t) => (
              <TouchableOpacity key={t} style={[styles.toggle, form.type === t && styles.toggleActive]} onPress={() => set('type', t)}>
                <Text style={[styles.toggleText, form.type === t && styles.toggleTextActive]}>
                  {t === 'rfq' ? 'Product RFQ' : 'Project lead'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: spacing.lg }} />
          <Field label="Title *" value={form.title} onChangeText={(t) => set('title', t)} placeholder="e.g. Need 100× 540W mono panels" />
          <Field label="Details" value={form.description} onChangeText={(t) => set('description', t)} placeholder="Specs, quality, delivery expectations…" multiline numberOfLines={4} style={{ minHeight: 90, textAlignVertical: 'top' }} />
          <Field label="Category" value={form.category} onChangeText={(t) => set('category', t)} placeholder="e.g. Solar Panels" />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Field label="Quantity" value={form.quantity} onChangeText={(t) => set('quantity', t)} placeholder="e.g. 100 pcs" />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Field label="Location" value={form.location} onChangeText={(t) => set('location', t)} placeholder="City" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Field label="Budget" value={form.budget} onChangeText={(t) => set('budget', t)} placeholder="e.g. ₹15L" />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Field label="Timeline" value={form.timeline} onChangeText={(t) => set('timeline', t)} placeholder="e.g. 2 weeks" />
            </View>
          </View>
          {!!meta?.categories?.length && (
            <View style={styles.suggest}>
              {meta.categories.slice(0, 6).map((c) => (
                <TouchableOpacity key={c} style={styles.sChip} onPress={() => set('category', c)}>
                  <Text style={styles.sChipText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={{ height: spacing.lg }} />
          <PrimaryButton label="Post to the network" icon="megaphone" onPress={submit} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggle: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  toggleText: { color: colors.textDim, fontWeight: font.weight.semibold, fontSize: font.size.sm },
  toggleTextActive: { color: colors.primary },
  row: { flexDirection: 'row' },
  suggest: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: -spacing.sm },
  sChip: { backgroundColor: colors.bgAlt, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.border },
  sChipText: { color: colors.textDim, fontSize: font.size.xs },
});
