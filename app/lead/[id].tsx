import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getLead, quoteLead } from '@/src/api/samrat';
import { apiError } from '@/src/api/client';
import { Card, Avatar, RankChip, Loading, timeAgo } from '@/src/ui';
import { spacing, radius, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

export default function LeadDetail() {
  const { colors, styles } = useThemed(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const leadQ = useQuery({ queryKey: ['lead', id], queryFn: () => getLead(id!), enabled: !!id });
  const [msg, setMsg] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const lead = leadQ.data;

  const submit = async () => {
    if (!msg.trim() || !id) {
      Alert.alert('Add a message', 'Write your quote / offer.');
      return;
    }
    setBusy(true);
    try {
      await quoteLead(id, msg.trim(), price.trim() || undefined);
      setMsg(''); setPrice('');
      leadQ.refetch();
      Alert.alert('Quote sent', 'Your quote was sent. You earned 10 Crowns 👑');
    } catch (e) {
      Alert.alert('Could not send', apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Lead</Text>
        <View style={{ width: 26 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        {leadQ.isLoading || !lead ? (
          <Loading />
        ) : (
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            <Card>
              <View style={[styles.badge, lead.type === 'project' ? styles.badgeProject : styles.badgeRfq]}>
                <Text style={styles.badgeText}>{lead.type === 'project' ? 'PROJECT' : 'RFQ'} · {lead.number}</Text>
              </View>
              <Text style={styles.title}>{lead.title}</Text>
              {!!lead.description && <Text style={styles.desc}>{lead.description}</Text>}
              <View style={styles.specs}>
                {!!lead.category && <Spec label="Category" value={lead.category} />}
                {!!lead.quantity && <Spec label="Quantity" value={lead.quantity} />}
                {!!lead.location && <Spec label="Location" value={lead.location} />}
                {!!lead.budget && <Spec label="Budget" value={lead.budget} />}
                {!!lead.timeline && <Spec label="Timeline" value={lead.timeline} />}
              </View>
              <View style={styles.by}>
                <Avatar name={lead.author?.business_name} size={32} />
                <Text style={styles.byName}>{lead.author?.business_name || 'Member'}</Text>
                <RankChip rank={lead.author?.rank} />
                <Text style={styles.byTime}>· {timeAgo(lead.created_at)}</Text>
              </View>
            </Card>

            <Text style={styles.qTitle}>Quotes ({lead.quotes?.length || 0})</Text>
            {(lead.quotes || []).map((q) => (
              <Card key={q.id} style={{ marginBottom: spacing.sm }}>
                <View style={styles.quoteHead}>
                  <Text style={styles.quoteName}>{q.business_name || 'Member'}</Text>
                  <RankChip rank={q.rank} />
                </View>
                <Text style={styles.quoteMsg}>{q.message}</Text>
                {!!q.price && <Text style={styles.quotePrice}>Quoted: {q.price}</Text>}
                <Text style={styles.quoteTime}>{timeAgo(q.created_at)}</Text>
              </Card>
            ))}
            {!lead.quotes?.length && <Text style={styles.noQuotes}>No quotes yet. Be the first to respond.</Text>}
          </ScrollView>
        )}

        <View style={styles.quoteBar}>
          <View style={styles.quoteInputs}>
            <TextInput value={msg} onChangeText={setMsg} placeholder="Your quote / offer…" placeholderTextColor={colors.muted} style={styles.input} multiline />
            <TextInput value={price} onChangeText={setPrice} placeholder="Price (optional)" placeholderTextColor={colors.muted} style={styles.priceInput} />
          </View>
          <TouchableOpacity style={styles.sendBtn} onPress={submit} disabled={busy || !msg.trim()}>
            <Ionicons name="send" size={20} color={msg.trim() ? colors.onPrimary : colors.muted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  const { colors, styles } = useThemed(makeStyles);
  return (
    <View style={styles.spec}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  badgeRfq: { backgroundColor: colors.accentSoft },
  badgeProject: { backgroundColor: colors.primarySoft },
  badgeText: { fontSize: font.size.xs, fontWeight: font.weight.black, color: colors.textDim, letterSpacing: 0.5 },
  title: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text, marginTop: spacing.sm },
  desc: { fontSize: font.size.md, color: colors.textDim, marginTop: spacing.sm, lineHeight: 21 },
  specs: { marginTop: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  spec: { flexDirection: 'row', justifyContent: 'space-between' },
  specLabel: { color: colors.muted, fontSize: font.size.sm },
  specValue: { color: colors.text, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  by: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  byName: { fontSize: font.size.sm, color: colors.text, fontWeight: font.weight.heavy },
  byTime: { fontSize: font.size.xs, color: colors.muted },
  qTitle: { fontSize: font.size.md, fontWeight: font.weight.black, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  quoteHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quoteName: { fontSize: font.size.md, fontWeight: font.weight.heavy, color: colors.text },
  quoteMsg: { fontSize: font.size.sm, color: colors.textDim, marginTop: spacing.xs, lineHeight: 20 },
  quotePrice: { fontSize: font.size.sm, color: colors.success, fontWeight: font.weight.heavy, marginTop: spacing.xs },
  quoteTime: { fontSize: font.size.xs, color: colors.muted, marginTop: spacing.xs },
  noQuotes: { color: colors.muted, fontSize: font.size.sm, textAlign: 'center', paddingVertical: spacing.lg },
  quoteBar: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgAlt, gap: spacing.sm },
  quoteInputs: { flex: 1, gap: spacing.xs },
  input: { color: colors.text, fontSize: font.size.md, maxHeight: 80, backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  priceInput: { color: colors.text, fontSize: font.size.sm, backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sendBtn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', justifyContent: 'center' },
});
