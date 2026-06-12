import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput,
  type TextInputProps, type ViewStyle, type StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, font, cardShadow, RANK_COLOR } from './theme';

export const ROLE_LABEL: Record<string, string> = {
  dealer: 'Dealer',
  distributor: 'Distributor',
  epc: 'EPC / Installer',
  brand: 'Brand',
  customer: 'Customer',
};

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function RankChip({ rank, crowns }: { rank?: string; crowns?: number }) {
  const c = RANK_COLOR[rank || 'Sipahi'] || colors.muted;
  return (
    <View style={[styles.rankChip, { borderColor: c }]}>
      <Ionicons name="diamond" size={10} color={c} />
      <Text style={[styles.rankChipText, { color: c }]}>{rank || 'Sipahi'}</Text>
      {typeof crowns === 'number' && <Text style={styles.rankChipCrowns}>· {crowns}👑</Text>}
    </View>
  );
}

export function PrimaryButton({
  label, onPress, loading, disabled, icon, variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'outline';
}) {
  const isOutline = variant === 'outline';
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        isOutline ? styles.btnOutline : styles.btnPrimary,
        (disabled || loading) && { opacity: 0.5 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.onPrimary} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={isOutline ? colors.primary : colors.onPrimary}
              style={{ marginRight: spacing.sm }}
            />
          )}
          <Text style={[styles.btnText, { color: isOutline ? colors.primary : colors.onPrimary }]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function Field({
  label, ...props
}: { label: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function Empty({ icon = 'sparkles-outline', text }: { icon?: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={42} color={colors.border} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function ScreenTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.titleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.screenTitle}>{title}</Text>
        {subtitle && <Text style={styles.screenSub}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export function Avatar({ name, size = 40 }: { name?: string; size?: number }) {
  const letter = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{letter}</Text>
    </View>
  );
}

export const timeAgo = (iso?: string): string => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const inr = (n?: number): string =>
  n == null ? '—' : '₹' + Number(n).toLocaleString('en-IN');

/** Split a "🛒 Buy & Sell"-style name into its leading emoji + the rest.
 * Avoids \p{Emoji} (unreliable on some Hermes builds) — treats a non-ASCII
 * first token before a space as the emoji. */
export function splitLeadEmoji(name: string): { emoji: string; text: string } {
  const sp = (name || '').indexOf(' ');
  if (sp > 0) {
    const head = name.slice(0, sp);
    if (/[^\x00-\x7F]/.test(head)) return { emoji: head, text: name.slice(sp + 1) };
  }
  return { emoji: '#', text: name || '' };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...cardShadow,
  },
  rankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  rankChipText: { fontSize: font.size.xs, fontWeight: font.weight.heavy, marginLeft: 3 },
  rankChipCrowns: { fontSize: font.size.xs, color: colors.muted, marginLeft: 3 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnOutline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: 'transparent' },
  btnText: { fontSize: font.size.md, fontWeight: font.weight.heavy },
  fieldLabel: {
    fontSize: font.size.sm,
    color: colors.textDim,
    fontWeight: font.weight.semibold,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: font.size.md,
  },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl },
  emptyText: { color: colors.muted, fontSize: font.size.md, marginTop: spacing.md, textAlign: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  screenTitle: { fontSize: font.size.xxl, fontWeight: font.weight.black, color: colors.text },
  screenSub: { fontSize: font.size.sm, color: colors.textDim, marginTop: 2 },
  avatar: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: font.weight.black },
});
