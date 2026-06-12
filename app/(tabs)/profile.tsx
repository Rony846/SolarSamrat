import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/AuthContext';
import { Card, Avatar, RankChip, ROLE_LABEL } from '@/src/ui';
import { PRIVACY_POLICY_URL, TERMS_URL } from '@/src/config';
import { colors, spacing, radius, font } from '@/src/theme';

export default function Profile() {
  const { member, user, signOut } = useAuth();
  const router = useRouter();

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Card>
          <View style={styles.top}>
            <Avatar name={member?.business_name} size={64} />
            <View style={{ flex: 1, marginLeft: spacing.lg }}>
              <Text style={styles.name}>{member?.business_name}</Text>
              <Text style={styles.owner}>{member?.owner_name}</Text>
              <View style={styles.badges}>
                <RankChip rank={member?.rank} crowns={member?.crowns} />
                {member?.verification === 'verified' && (
                  <View style={styles.verified}>
                    <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.details}>
            <Detail icon="briefcase-outline" label="Role" value={member?.role ? ROLE_LABEL[member.role] : '—'} />
            <Detail icon="call-outline" label="Phone" value={member?.phone || user?.phone} />
            <Detail icon="location-outline" label="Location" value={[member?.city, member?.state].filter(Boolean).join(', ') || '—'} />
            {!!member?.gstin && <Detail icon="document-text-outline" label="GSTIN" value={member.gstin} />}
            {!!member?.categories?.length && <Detail icon="pricetags-outline" label="Deals in" value={member.categories.join(', ')} />}
          </View>
        </Card>

        <View style={styles.menu}>
          <MenuItem icon="trophy-outline" label="Rank & Leaderboard" onPress={() => router.push('/rank')} />
          <MenuItem icon="people-outline" label="Member directory" onPress={() => router.push('/directory')} />
          <MenuItem icon="help-circle-outline" label="Questions & Answers" onPress={() => router.push('/qa')} />
          <MenuItem icon="sparkles-outline" label="AI Solar Quote" onPress={() => router.push('/quote')} />
          <MenuItem icon="document-text-outline" label="Privacy Policy" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
          <MenuItem icon="reader-outline" label="Terms of Service" onPress={() => Linking.openURL(TERMS_URL)} />
        </View>

        <TouchableOpacity style={styles.signout} onPress={confirmSignOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.signoutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Solar Samrat v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string | null }) {
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text },
  owner: { fontSize: font.size.sm, color: colors.textDim, marginTop: 2 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#0E2A1E', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  verifiedText: { fontSize: font.size.xs, color: colors.success, fontWeight: font.weight.heavy },
  details: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, gap: spacing.md },
  detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailLabel: { fontSize: font.size.sm, color: colors.muted, width: 76 },
  detailValue: { fontSize: font.size.sm, color: colors.text, flex: 1, fontWeight: font.weight.medium },
  menu: { marginTop: spacing.xl, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLabel: { flex: 1, fontSize: font.size.md, color: colors.text, fontWeight: font.weight.medium },
  signout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl, paddingVertical: spacing.md },
  signoutText: { color: colors.danger, fontSize: font.size.md, fontWeight: font.weight.heavy },
  version: { textAlign: 'center', color: colors.muted, fontSize: font.size.xs, marginTop: spacing.lg },
});
