import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/AuthContext';
import { sendOtp, verifyOtp } from '@/src/api/auth';
import { apiError } from '@/src/api/client';
import { Field, PrimaryButton } from '@/src/ui';
import { colors, spacing, radius, font, serif } from '@/src/theme';

export default function Login() {
  const { signIn } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);

  const onSend = async () => {
    if (phone.trim().length < 10) {
      Alert.alert('Invalid number', 'Enter a valid 10-digit mobile number.');
      return;
    }
    setBusy(true);
    try {
      await sendOtp(phone.trim(), name.trim() || undefined);
      setStep('otp');
    } catch (e) {
      Alert.alert('Could not send OTP', apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    if (otp.trim().length < 4) {
      Alert.alert('Enter OTP', 'Please enter the OTP sent to your phone.');
      return;
    }
    setBusy(true);
    try {
      const res = await verifyOtp(phone.trim(), otp.trim());
      await signIn(res.access_token, res.user, res.member);
    } catch (e) {
      Alert.alert('Verification failed', apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.crownWrap}>
            <View style={styles.crownCircle}>
              <Ionicons name="diamond" size={36} color={colors.primary} />
            </View>
            <Text style={styles.brand}>Solar Samrat</Text>
            <Text style={styles.tagline}>Where every dealer rules 👑</Text>
          </View>

          <View style={styles.card}>
            {step === 'phone' ? (
              <>
                <Text style={styles.heading}>Join the solar trade</Text>
                <Text style={styles.sub}>
                  India's open community for solar dealers, distributors & installers.
                </Text>
                <Field
                  label="Your name"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Ravi Sharma"
                  autoCapitalize="words"
                />
                <Field
                  label="Mobile number"
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                  keyboardType="number-pad"
                  maxLength={10}
                />
                <PrimaryButton label="Send OTP" icon="arrow-forward" onPress={onSend} loading={busy} />
              </>
            ) : (
              <>
                <Text style={styles.heading}>Enter OTP</Text>
                <Text style={styles.sub}>
                  Sent to ******{phone.slice(-4)}.{' '}
                  <Text style={styles.link} onPress={() => setStep('phone')}>Change</Text>
                </Text>
                <Field
                  label="OTP"
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <PrimaryButton label="Verify & Continue" icon="checkmark" onPress={onVerify} loading={busy} />
              </>
            )}
          </View>

          <Text style={styles.legal}>
            By continuing you agree to our Terms & Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  crownWrap: { alignItems: 'center', marginBottom: spacing.xxl },
  crownCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: colors.primarySoft, borderWidth: 1.5, borderColor: colors.primaryDark,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  brand: { fontSize: font.size.hero + 4, fontFamily: serif, color: colors.text, letterSpacing: 0.5 },
  tagline: { fontSize: font.size.md, color: colors.primary, marginTop: spacing.xs, fontWeight: font.weight.semibold },
  card: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl,
  },
  heading: { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text },
  sub: { fontSize: font.size.sm, color: colors.textDim, marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 19 },
  link: { color: colors.primary, fontWeight: font.weight.heavy },
  legal: { fontSize: font.size.xs, color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
});
