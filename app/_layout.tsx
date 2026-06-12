import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/src/AuthContext';
import { queryClient } from '@/src/queryClient';
import { getMyMembership } from '@/src/api/samrat';
import { colors, spacing, radius, font } from '@/src/theme';

/** Routes a tapped notification to its chat channel (or generic `link`). */
function useNotificationRouting(authed: boolean) {
  const router = useRouter();
  const coldStartHandled = useRef(false);

  useEffect(() => {
    if (!authed) return;
    const go = (resp: Notifications.NotificationResponse | null) => {
      const data = resp?.notification?.request?.content?.data as
        | { chat_channel?: string; link?: string }
        | undefined;
      if (data?.chat_channel) router.push(`/chat/${data.chat_channel}` as never);
      else if (typeof data?.link === 'string' && data.link.startsWith('/')) router.push(data.link as never);
    };
    if (!coldStartHandled.current) {
      coldStartHandled.current = true;
      void Notifications.getLastNotificationResponseAsync().then(go);
    }
    const sub = Notifications.addNotificationResponseReceivedListener(go);
    return () => sub.remove();
  }, [authed, router]);
}

function isActiveMember(m: ReturnType<typeof useAuth>['member']): boolean {
  return !!m && m.verification === 'verified' && m.status === 'active';
}

function RootNavigator() {
  const { token, member, loading, setMember } = useAuth();
  const [resolved, setResolved] = useState(false);
  const [resolving, setResolving] = useState(false);
  useNotificationRouting(!!token);

  // On cold start we only restore token+user; fetch the membership once so the
  // router can decide between the apply gate and the main tabs.
  useEffect(() => {
    if (!token) {
      setResolved(false);
      return;
    }
    if (member || resolved || resolving) return;
    setResolving(true);
    getMyMembership()
      .then((r) => setMember(r.member))
      .catch(() => {})
      .finally(() => {
        setResolving(false);
        setResolved(true);
      });
  }, [token, member, resolved, resolving, setMember]);

  if (loading || (token && !member && !resolved)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const authed = !!token;
  const active = isActiveMember(member);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={!authed}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={authed && !active}>
        <Stack.Screen name="apply" />
      </Stack.Protected>
      <Stack.Protected guard={authed && active}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="new-post" options={{ presentation: 'modal' }} />
        <Stack.Screen name="new-lead" options={{ presentation: 'modal' }} />
        <Stack.Screen name="ask" options={{ presentation: 'modal' }} />
        <Stack.Screen name="new-group" options={{ presentation: 'modal' }} />
        <Stack.Screen name="quote" />
        <Stack.Screen name="qa" />
        <Stack.Screen name="directory" />
        <Stack.Screen name="post" />
        <Stack.Screen name="lead" />
        <Stack.Screen name="question" />
        <Stack.Screen name="chat" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.error}>
      <Ionicons name="warning-outline" size={48} color={colors.danger} />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error.message || 'An unexpected error occurred.'}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={() => void retry()} activeOpacity={0.85}>
        <Ionicons name="refresh" size={18} color={colors.onPrimary} />
        <Text style={styles.retryText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  error: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  errorTitle: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text, marginTop: spacing.lg },
  errorMessage: { fontSize: font.size.sm, color: colors.textDim, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary,
    borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
  },
  retryText: { fontSize: font.size.md, fontWeight: font.weight.heavy, color: colors.onPrimary, marginLeft: spacing.sm },
});
