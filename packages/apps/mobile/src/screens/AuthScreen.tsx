import { useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme/colors';

const emptyForm = { firstName: '', lastName: '', email: '', password: '' };
const fields = [
  ['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Email'], ['password', 'Password'],
] as const;

export function AuthScreen() {
  const { authenticate } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const submitting = useRef(false);
  const passwordInput = useRef<TextInput>(null);
  const registering = mode === 'register';

  async function submit() {
    if (submitting.current) return;
    const details = {
      email: form.email.trim().toLowerCase(), password: form.password,
      ...(registering ? { firstName: form.firstName.trim(), lastName: form.lastName.trim() } : {}),
    };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email) || !details.password) {
      setError('Enter a valid email address and your password.');
      return;
    }
    if (registering && (!details.firstName || !details.lastName || details.password.length < 8)) {
      setError('Enter your name and use a password with at least 8 characters.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await authenticate(mode, details);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Please try again.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.container}>
          <View style={styles.brand}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.brandIcon}>
              <View style={styles.pill}><View style={styles.pillHalf} /></View>
            </View>
            <Text style={styles.brandName}>A little care, every day.</Text>
          </View>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              {registering ? 'Start your routine.' : 'Welcome back.'}
            </Text>
            <Text style={styles.subtitle}>
              {registering ? 'Create an account to get started.' : 'Sign in to keep your medication routine on track.'}
            </Text>
          </View>
          <View style={styles.card}>
            <View style={styles.switcher}>
              {(['login', 'register'] as const).map((option) => (
                <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: mode === option, disabled: busy }}
                  disabled={busy} onPress={() => { setMode(option); setError(''); setForm((current) => ({ ...current, password: '' })); setShowPassword(false); }}
                  style={[styles.modeButton, mode === option && styles.modeSelected]}>
                  <Text style={[styles.modeText, mode === option && styles.modeTextSelected]}>
                    {option === 'login' ? 'Sign in' : 'Create account'}
                  </Text>
                </Pressable>
              ))}
            </View>
            {fields.filter(([field]) => registering || field === 'email' || field === 'password').map(([field, label]) => (
              <View key={field} style={styles.field}>
                <Text style={styles.label}>{label}</Text>
                <View style={styles.inputRow}>
                  <TextInput ref={field === 'password' ? passwordInput : undefined}
                    accessibilityLabel={label} value={form[field]} editable={!busy}
                    onChangeText={(value) => { setForm((current) => ({ ...current, [field]: value })); setError(''); }}
                    secureTextEntry={field === 'password' && !showPassword}
                    keyboardType={field === 'email' ? 'email-address' : 'default'}
                    autoCapitalize={field === 'email' || field === 'password' ? 'none' : 'words'}
                    autoCorrect={false}
                    autoComplete={field === 'password' ? (registering ? 'new-password' : 'current-password') :
                      field === 'email' ? 'email' : field === 'firstName' ? 'given-name' : 'family-name'}
                    placeholder={field === 'email' ? 'you@example.com' : field === 'password' ? 'Enter your password' : label}
                    placeholderTextColor={colors.textMuted}
                    returnKeyType={field === 'password' ? 'go' : 'next'}
                    onSubmitEditing={field === 'password' ? () => void submit() :
                      field === 'email' ? () => passwordInput.current?.focus() : undefined}
                    style={styles.input} />
                  {field === 'password' && (
                    <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      disabled={busy} onPress={() => setShowPassword((current) => !current)} style={styles.showButton}>
                      <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
            {registering && <Text style={styles.hint}>Use at least 8 characters for your password.</Text>}
            {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }}
              disabled={busy} onPress={() => void submit()}
              style={({ pressed }) => [styles.submit, (pressed || busy) && styles.submitPressed]}>
              {busy && <ActivityIndicator color={colors.surface} />}
              <Text style={styles.submitText}>{busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}</Text>
            </Pressable>
          </View>
          <Text style={styles.footer}>Your routine starts with you.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  container: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 28 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandIcon: { backgroundColor: colors.primary, width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pill: { height: 28, width: 13, borderRadius: 9, borderWidth: 2, borderColor: colors.background, transform: [{ rotate: '40deg' }], overflow: 'hidden' },
  pillHalf: { height: '50%', backgroundColor: colors.accent },
  brandName: { color: colors.primary, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  heading: { gap: 10 },
  title: { color: colors.text, fontSize: 36, fontWeight: '700', letterSpacing: -1 },
  subtitle: { color: colors.textMuted, fontSize: 17, lineHeight: 25 },
  card: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 22, gap: 20 },
  switcher: { flexDirection: 'row', padding: 4, backgroundColor: '#F0F2F7', borderRadius: 13, marginBottom: 4 },
  modeButton: { flex: 1, minHeight: 44, padding: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modeSelected: { backgroundColor: colors.surface },
  modeText: { color: colors.textMuted, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  modeTextSelected: { color: colors.primary },
  field: { gap: 8 },
  label: { color: colors.text, fontSize: 15, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FC', borderWidth: 1, borderColor: '#DFE3ED', borderRadius: 12 },
  input: { flex: 1, minWidth: 0, minHeight: 54, padding: 14, fontSize: 16, color: colors.text },
  showButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12 },
  showText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: -8 },
  error: { color: '#A12D3C', fontSize: 14, lineHeight: 21 },
  submit: { backgroundColor: colors.primary, minHeight: 54, padding: 14, borderRadius: 14, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  submitPressed: { opacity: 0.7 },
  submitText: { color: colors.surface, fontSize: 17, fontWeight: '600' },
  footer: { textAlign: 'center', color: colors.textMuted, fontSize: 14 },
});
