import { Redirect } from 'expo-router';
import { useAuth } from '@/src/AuthContext';

// Entry router. Must point at a Stack.Protected group whose guard is currently
// ENABLED — redirecting into a guarded-off group bounces back here (the stack's
// anchor) and loops, leaving a blank screen. So mirror the _layout guards:
//   not signed in        → (auth)/login
//   signed in, inactive  → apply  (verification/approval gate)
//   signed in, active     → (tabs)/chat
// By the time this mounts the root navigator has already finished loading the
// token + membership (it shows a spinner until then), so `member` is settled.
export default function Index() {
  const { token, member } = useAuth();
  if (!token) return <Redirect href="/(auth)/login" />;
  const active = !!member && member.verification === 'verified' && member.status === 'active';
  return <Redirect href={active ? '/(tabs)/chat' : '/apply'} />;
}
