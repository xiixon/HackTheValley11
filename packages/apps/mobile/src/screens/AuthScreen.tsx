import { useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { RegistrationProfile, Sex } from '../../../../shared/src/types/User';
import { isValidBirthDate } from '../../../../shared/src/validation/profile';
import { PageBackdrop } from '../components/navigation/PageBackdrop';

const emptyForm = { firstName: '', lastName: '', email: '', password: '' };
const fields = [
  ['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Email'], ['password', 'Password'],
] as const;
const profileFields = [
  ['birthDate', 'Date of birth', 'YYYY-MM-DD'],
  ['weightKg', 'Weight (kg)', 'e.g. 70'],
  ['heightCm', 'Height (cm)', 'e.g. 170'],
  ['allergies', 'Allergies (optional)', 'e.g. Penicillin, peanuts'],
  ['conditions', 'Health conditions (optional)', 'e.g. Asthma, diabetes'],
] as const;
const splitList = (value: string) => [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];

export function AuthScreen() {
  const { authenticate } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'account' | 'profile'>('account');
  const [sex, setSex] = useState<Sex | null>(null);
  const [profile, setProfile] = useState({ birthDate: '', weightKg: '', heightCm: '', allergies: '', conditions: '' });
  const submitting = useRef(false);
  const passwordInput = useRef<TextInput>(null);
  const scrollView = useRef<ScrollView>(null);
  const registering = mode === 'register';
  const aboutYou = registering && step === 'profile';

  function changeStep(next: 'account' | 'profile') {
    setStep(next);
    setError('');
    scrollView.current?.scrollTo({ y: 0, animated: false });
  }

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
    let registrationProfile: RegistrationProfile | undefined;
    if (registering) {
      if (!aboutYou) {
        changeStep('profile');
        return;
      }
      if (!sex || !isValidBirthDate(profile.birthDate.trim())) {
        setError('Choose your sex and enter a real date of birth as YYYY-MM-DD.');
        return;
      }
      const weightKg = Number(profile.weightKg.trim().replace(',', '.'));
      const heightCm = Number(profile.heightCm.trim().replace(',', '.'));
      if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 500 ||
          !Number.isFinite(heightCm) || heightCm <= 0 || heightCm > 300) {
        setError('Enter your weight in kg (up to 500) and height in cm (up to 300).');
        return;
      }
      const allergies = splitList(profile.allergies);
      const conditions = splitList(profile.conditions);
      if ([allergies, conditions].some((items) => items.length > 20 || items.some((item) => item.length > 100))) {
        setError('Use up to 20 allergies or conditions, with each name under 100 characters.');
        return;
      }
      registrationProfile = { sex, birthDate: profile.birthDate.trim(), weightKg, heightCm, allergies,
        healthConditions: conditions.map((name) => ({ name })) };
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await authenticate(mode, { ...details, ...(registrationProfile ? { profile: registrationProfile } : {}) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Please try again.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <PageBackdrop variant="neutral">
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView ref={scrollView} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
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
                {aboutYou ? 'A little about you.' : registering ? 'Start your routine.' : 'Welcome back.'}
              </Text>
              <Text style={styles.subtitle}>
                {aboutYou ? 'Add the details for your health profile.' : registering ? 'Create an account to get started.' : 'Sign in to keep your medication routine on track.'}
              </Text>
            </View>
            <View style={styles.card}>
              <View style={styles.switcher}>
                {(['login', 'register'] as const).map((option) => (
                  <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: mode === option, disabled: busy }}
                    disabled={busy} onPress={() => { if (mode === option) return; setMode(option); changeStep('account'); setForm((current) => ({ ...current, password: '' })); setShowPassword(false); }}
                    style={[styles.modeButton, mode === option && styles.modeSelected]}>
                    <Text style={[styles.modeText, mode === option && styles.modeTextSelected]}>
                      {option === 'login' ? 'Sign in' : 'Create account'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {registering && <Text style={styles.stepLabel}>STEP {aboutYou ? '2' : '1'} OF 2 · {aboutYou ? 'ABOUT YOU' : 'YOUR ACCOUNT'}</Text>}
              {!aboutYou && fields.filter(([field]) => registering || field === 'email' || field === 'password').map(([field, label]) => (
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
              {registering && !aboutYou && <Text style={styles.hint}>Use at least 8 characters for your password.</Text>}
              {aboutYou && <>
                <View style={styles.field}>
                  <Text style={styles.label}>Sex</Text>
                  <View style={styles.sexOptions}>
                    {(['male', 'female', 'other'] as const).map((option) => (
                      <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: sex === option, disabled: busy }}
                        disabled={busy} onPress={() => { setSex(option); setError(''); }}
                        style={[styles.sexOption, sex === option && styles.sexSelected]}>
                        <Text style={[styles.modeText, sex === option && styles.sexSelectedText]}>{option[0].toUpperCase() + option.slice(1)}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                {profileFields.map(([field, label, placeholder]) => (
                  <View key={field} style={styles.field}>
                    <Text style={styles.label}>{label}</Text>
                    <View style={styles.inputRow}>
                      <TextInput accessibilityLabel={label} value={profile[field]} editable={!busy}
                        onChangeText={(value) => { setProfile((current) => ({ ...current, [field]: value })); setError(''); }}
                        keyboardType={field === 'weightKg' || field === 'heightCm' ? 'decimal-pad' : 'default'}
                        autoCapitalize={field === 'birthDate' ? 'none' : 'sentences'} autoCorrect={false}
                        placeholder={placeholder} placeholderTextColor={colors.textMuted} style={styles.input} />
                    </View>
                    {field === 'birthDate' && <Text style={styles.fieldHint}>Year-month-day, for example 2000-05-21.</Text>}
                  </View>
                ))}
                <Text style={styles.hint}>Separate multiple allergies or conditions with commas. Leave blank if none.</Text>
              </>}
              {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }}
                disabled={busy} onPress={() => void submit()}
                style={({ pressed }) => [styles.submit, (pressed || busy) && styles.submitPressed]}>
                {busy && <ActivityIndicator color={colors.surface} />}
                <Text style={styles.submitText}>{busy ? 'Please wait…' : aboutYou ? 'Create account' : registering ? 'Continue' : 'Sign in'}</Text>
              </Pressable>
              {aboutYou && <Pressable accessibilityRole="button" disabled={busy}
                onPress={() => changeStep('account')} style={styles.backButton}>
                <Text style={styles.showText}>Back to account details</Text>
              </Pressable>}
            </View>
            <Text style={styles.footer}>Your routine starts with you.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PageBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  container: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 28 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandIcon: { backgroundColor: colors.primary, width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pill: { height: 28, width: 13, borderRadius: 9, borderWidth: 2, borderColor: colors.background, transform: [{ rotate: '40deg' }], overflow: 'hidden' },
  pillHalf: { height: '50%', backgroundColor: colors.accent },
  brandName: { ...typography.heading, color: colors.primary, fontSize: 18, flexShrink: 1 },
  heading: { gap: 10 },
  title: { ...typography.heading, color: colors.text, fontSize: 36 },
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
  fieldHint: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  stepLabel: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  sexOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sexOption: { flexGrow: 1, minHeight: 48, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#DFE3ED', alignItems: 'center', justifyContent: 'center' },
  sexSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  sexSelectedText: { color: colors.surface },
  backButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#A12D3C', fontSize: 14, lineHeight: 21 },
  submit: { backgroundColor: colors.primary, minHeight: 54, padding: 14, borderRadius: 14, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  submitPressed: { opacity: 0.7 },
  submitText: { color: colors.surface, fontSize: 17, fontWeight: '600' },
  footer: { textAlign: 'center', color: colors.textMuted, fontSize: 14 },
});
