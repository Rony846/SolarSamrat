import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPost, getGroups } from '@/src/api/samrat';
import { apiError } from '@/src/api/client';
import { PrimaryButton } from '@/src/ui';
import { spacing, radius, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

export default function NewPost() {
  const { colors, styles } = useThemed(makeStyles);
  const router = useRouter();
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [group, setGroup] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const groupsQ = useQuery({ queryKey: ['groups'], queryFn: getGroups });

  const submit = async () => {
    if (!body.trim()) {
      Alert.alert('Empty post', 'Write something to share.');
      return;
    }
    setBusy(true);
    try {
      await createPost(body.trim(), group);
      qc.invalidateQueries({ queryKey: ['feed'] });
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
          <Text style={styles.headerTitle}>New post</Text>
          <View style={{ width: 26 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Share an install, a tip, a win, a question…"
            placeholderTextColor={colors.muted}
            multiline
            autoFocus
            style={styles.input}
          />
          <Text style={styles.label}>Post to a group (optional)</Text>
          <View style={styles.chipRow}>
            {(groupsQ.data?.groups || []).map((g) => {
              const on = group === g.key;
              return (
                <TouchableOpacity key={g.key} style={[styles.chip, on && styles.chipActive]} onPress={() => setGroup(on ? undefined : g.key)}>
                  <Text style={[styles.chipText, on && styles.chipTextActive]}>{g.icon} {g.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: spacing.xl }} />
          <PrimaryButton label="Share with the community" icon="send" onPress={submit} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  input: { fontSize: font.size.lg, color: colors.text, minHeight: 140, textAlignVertical: 'top', lineHeight: 24 },
  label: { fontSize: font.size.sm, color: colors.textDim, fontWeight: font.weight.heavy, marginTop: spacing.lg, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { color: colors.textDim, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  chipTextActive: { color: colors.primary },
});
