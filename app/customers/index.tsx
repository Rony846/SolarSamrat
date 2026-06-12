import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listCustomers, createCustomer } from '@/src/api/biz';
import { apiError } from '@/src/api/client';
import { Card, Avatar, Loading, Empty } from '@/src/ui';
import { colors, spacing, radius, font } from '@/src/theme';

export default function Customers() {
  const router = useRouter();
  const qc = useQueryClient();
  const custQ = useQuery({ queryKey: ['customers'], queryFn: () => listCustomers() });
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) { Alert.alert('Name required', "Enter the customer's name."); return; }
    setBusy(true);
    try {
      await createCustomer({ name: name.trim(), phone: phone.trim() || undefined, city: city.trim() || undefined });
      setName(''); setPhone(''); setCity(''); setAdding(false);
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['biz-summary'] });
    } catch (e) {
      Alert.alert('Could not add', apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Customers</Text>
        <TouchableOpacity onPress={() => setAdding((a) => !a)}>
          <Ionicons name={adding ? 'close' : 'add-circle'} size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {adding && (
          <View style={styles.addForm}>
            <TextInput value={name} onChangeText={setName} placeholder="Customer name *" placeholderTextColor={colors.muted} style={styles.input} autoFocus />
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={[styles.input, { flex: 1 }]} />
              <TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={colors.muted} style={[styles.input, { flex: 1 }]} />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={busy}>
              <Text style={styles.saveText}>{busy ? 'Saving…' : 'Save customer'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={custQ.data?.customers || []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: spacing.lg }}
          renderItem={({ item }) => (
            <Card style={styles.row}>
              <Avatar name={item.name} size={42} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>{[item.phone, item.city].filter(Boolean).join(' · ') || 'No details'}</Text>
              </View>
              {!!item.phone && (
                <TouchableOpacity
                  style={styles.quoteBtn}
                  onPress={() => router.push('/quotes/new')}
                >
                  <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
            </Card>
          )}
          ListEmptyComponent={custQ.isLoading ? <Loading /> : <Empty icon="people-outline" text="No customers yet. Tap + to add your first." />}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  addForm: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgAlt },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, color: colors.text, fontSize: font.size.md },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  saveText: { color: colors.onPrimary, fontWeight: font.weight.black, fontSize: font.size.md },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  name: { fontSize: font.size.md, fontWeight: font.weight.heavy, color: colors.text },
  sub: { fontSize: font.size.xs, color: colors.muted, marginTop: 2 },
  quoteBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
});
