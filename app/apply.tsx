import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/src/AuthContext';
import { applyMembership, getMeta, getMyMembership, type ApplyInput } from '@/src/api/samrat';
import { apiError } from '@/src/api/client';
import { Field, PrimaryButton, ROLE_LABEL } from '@/src/ui';
import { spacing, radius, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

export default function Apply() {
  const { user, member, setMember, signOut } = useAuth();
  const { data: meta } = useQuery({ queryKey: ['meta'], queryFn: getMeta });

  // Pending / rejected status view.
  if (member && (member.verification === 'pending' || member.verification === 'rejected')) {
    return <StatusScreen />;
  }
  return <ApplyForm meta={meta} user={user} setMember={setMember} signOut={signOut} />;
}

function StatusScreen() {
  const { colors, styles } = useThemed(makeStyles);
  const { member, setMember, signOut } = useAuth();
  const [checking, setChecking] = useState(false);
  const rejected = member?.verification === 'rejected';

  const refresh = async () => {
    setChecking(true);
    try {
      const r = await getMyMembership();
      setMember(r.member);
    } catch { /* ignore */ } finally { setChecking(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.statusWrap}>
        <View style={[styles.statusIcon, rejected && { borderColor: colors.danger, backgroundColor: '#2A1414' }]}>
          <Ionicons
            name={rejected ? 'alert-circle' : 'hourglass'}
            size={44}
            color={rejected ? colors.danger : colors.primary}
          />
        </View>
        <Text style={styles.statusTitle}>
          {rejected ? 'Application needs attention' : 'Application under review'}
        </Text>
        <Text style={styles.statusSub}>
          {rejected
            ? (member?.verification_note || 'Please re-check your GST / business details and resubmit.')
            : `Thanks, ${member?.business_name}. Our team is verifying your business. You'll get a notification once you're approved as a Solar Samrat.`}
        </Text>
        <View style={{ height: spacing.xl }} />
        <PrimaryButton label="Check status" icon="refresh" onPress={refresh} loading={checking} />
        {rejected && (
          <TouchableOpacity onPress={() => setMember(null)} style={{ marginTop: spacing.lg }}>
            <Text style={styles.editLink}>Edit my application</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={signOut} style={{ marginTop: spacing.xxl }}>
          <Text style={styles.signout}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ApplyForm({
  meta, user, setMember, signOut,
}: {
  meta?: { roles: string[]; categories: string[] };
  user: ReturnType<typeof useAuth>['user'];
  setMember: ReturnType<typeof useAuth>['setMember'];
  signOut: () => void;
}) {
  const { colors, styles } = useThemed(makeStyles);
  const [form, setForm] = useState<ApplyInput>({
    business_name: '', owner_name: user?.name || '', phone: user?.phone || '',
    role: 'dealer', gstin: '', city: '', state: '', categories: [],
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof ApplyInput, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));

  const toggleCat = (c: string) => {
    const cur = form.categories || [];
    set('categories', cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]);
  };

  const submit = async () => {
    if (!form.business_name.trim() || !form.owner_name.trim() || !form.phone.trim()) {
      Alert.alert('Missing details', 'Business name, owner name and phone are required.');
      return;
    }
    setBusy(true);
    try {
      await applyMembership(form);
      const r = await getMyMembership();
      setMember(r.member);
    } catch (e) {
      Alert.alert('Could not submit', apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const roles = meta?.roles || ['dealer', 'distributor', 'epc', 'brand', 'customer'];
  const cats = meta?.categories || [];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl }} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>Claim your throne 👑</Text>
          <Text style={styles.sub}>
            Tell us about your business. Verified members get the Samrat badge, lead access and ranks.
          </Text>

          <Text style={styles.section}>I am a…</Text>
          <View style={styles.chipRow}>
            {roles.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, form.role === r && styles.chipActive]}
                onPress={() => set('role', r)}
              >
                <Text style={[styles.chipText, form.role === r && styles.chipTextActive]}>
                  {ROLE_LABEL[r] || r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: spacing.lg }} />
          <Field label="Business name *" value={form.business_name} onChangeText={(t) => set('business_name', t)} placeholder="e.g. Sharma Solar Traders" />
          <Field label="Owner name *" value={form.owner_name} onChangeText={(t) => set('owner_name', t)} placeholder="Your full name" autoCapitalize="words" />
          <Field label="Phone *" value={form.phone} onChangeText={(t) => set('phone', t)} keyboardType="number-pad" maxLength={10} />
          <Field label="GSTIN" value={form.gstin} onChangeText={(t) => set('gstin', t.toUpperCase())} placeholder="15-digit GSTIN (for verification)" autoCapitalize="characters" />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Field label="City" value={form.city} onChangeText={(t) => set('city', t)} placeholder="City" />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Field label="State" value={form.state} onChangeText={(t) => set('state', t)} placeholder="State" />
            </View>
          </View>

          {cats.length > 0 && (
            <>
              <Text style={styles.section}>What do you deal in?</Text>
              <View style={styles.chipRow}>
                {cats.map((c) => {
                  const on = (form.categories || []).includes(c);
                  return (
                    <TouchableOpacity key={c} style={[styles.chip, on && styles.chipActive]} onPress={() => toggleCat(c)}>
                      <Text style={[styles.chipText, on && styles.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ height: spacing.lg }} />
            </>
          )}

          <PrimaryButton label="Submit for verification" icon="shield-checkmark" onPress={submit} loading={busy} />
          <TouchableOpacity onPress={signOut} style={{ marginTop: spacing.xl, alignItems: 'center' }}>
            <Text style={styles.signout}>Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  h1: { fontSize: font.size.xxl, fontWeight: font.weight.black, color: colors.text },
  sub: { fontSize: font.size.sm, color: colors.textDim, marginTop: spacing.xs, marginBottom: spacing.xl, lineHeight: 19 },
  section: { fontSize: font.size.sm, color: colors.textDim, fontWeight: font.weight.heavy, marginBottom: spacing.sm, marginTop: spacing.sm },
  row: { flexDirection: 'row' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { color: colors.textDim, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  chipTextActive: { color: colors.primary },
  statusWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  statusIcon: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: colors.primarySoft,
    borderWidth: 1.5, borderColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl,
  },
  statusTitle: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text, textAlign: 'center' },
  statusSub: { fontSize: font.size.md, color: colors.textDim, textAlign: 'center', marginTop: spacing.md, lineHeight: 21 },
  editLink: { color: colors.primary, fontWeight: font.weight.heavy, fontSize: font.size.md },
  signout: { color: colors.muted, fontSize: font.size.sm, fontWeight: font.weight.semibold },
});
