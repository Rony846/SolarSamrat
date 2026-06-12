import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { askQuestion } from '@/src/api/samrat';
import { apiError } from '@/src/api/client';
import { Field, PrimaryButton } from '@/src/ui';
import { spacing, font } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

export default function Ask() {
  const { colors, styles } = useThemed(makeStyles);
  const router = useRouter();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('Add a question', 'Type your question title.');
      return;
    }
    setBusy(true);
    try {
      const q = await askQuestion(title.trim(), body.trim() || undefined);
      qc.invalidateQueries({ queryKey: ['questions'] });
      router.replace(`/question/${q.id}`);
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
          <Text style={styles.headerTitle}>Ask the community</Text>
          <View style={{ width: 26 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Field label="Your question *" value={title} onChangeText={setTitle} placeholder="e.g. Best Li battery for a 48V off-grid setup?" autoFocus />
          <Text style={styles.label}>Add detail (optional)</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Context, what you've tried, constraints…"
            placeholderTextColor={colors.muted}
            multiline
            style={styles.input}
          />
          <View style={{ height: spacing.xl }} />
          <PrimaryButton label="Post question" icon="help-circle" onPress={submit} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  label: { fontSize: font.size.sm, color: colors.textDim, fontWeight: font.weight.heavy, marginBottom: spacing.sm },
  input: { fontSize: font.size.md, color: colors.text, minHeight: 120, textAlignVertical: 'top', lineHeight: 22, backgroundColor: colors.bgAlt, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
});
