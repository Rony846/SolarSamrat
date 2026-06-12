import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { createGroup } from '@/src/api/chat';
import { apiError } from '@/src/api/client';
import { Field, PrimaryButton } from '@/src/ui';
import { colors, spacing, font } from '@/src/theme';

export default function NewGroup() {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give your group a name.');
      return;
    }
    setBusy(true);
    try {
      const ch = await createGroup(name.trim(), topic.trim() || undefined, isPublic);
      qc.invalidateQueries({ queryKey: ['chat-channels'] });
      router.replace(`/chat/${ch.id}`);
    } catch (e) {
      Alert.alert('Could not create', apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={26} color={colors.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>New group</Text>
          <View style={{ width: 26 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Field label="Group name *" value={name} onChangeText={setName} placeholder="e.g. Maharashtra Dealers" autoFocus />
          <Field label="Topic / description" value={topic} onChangeText={setTopic} placeholder="What's this group about?" />

          <Text style={styles.label}>Visibility</Text>
          <TouchableOpacity style={[styles.opt, isPublic && styles.optActive]} onPress={() => setIsPublic(true)} activeOpacity={0.8}>
            <Ionicons name={isPublic ? 'radio-button-on' : 'radio-button-off'} size={20} color={isPublic ? colors.primary : colors.muted} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.optTitle}>Public</Text>
              <Text style={styles.optSub}>Any verified member can find & join</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.opt, !isPublic && styles.optActive]} onPress={() => setIsPublic(false)} activeOpacity={0.8}>
            <Ionicons name={!isPublic ? 'radio-button-on' : 'radio-button-off'} size={20} color={!isPublic ? colors.primary : colors.muted} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.optTitle}>Private</Text>
              <Text style={styles.optSub}>Invite-only (members you add)</Text>
            </View>
          </TouchableOpacity>

          <View style={{ height: spacing.xl }} />
          <PrimaryButton label="Create group" icon="people" onPress={submit} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  label: { fontSize: font.size.sm, color: colors.textDim, fontWeight: font.weight.heavy, marginTop: spacing.md, marginBottom: spacing.sm },
  opt: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginBottom: spacing.sm },
  optActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optTitle: { fontSize: font.size.md, fontWeight: font.weight.heavy, color: colors.text },
  optSub: { fontSize: font.size.xs, color: colors.muted, marginTop: 2 },
});
