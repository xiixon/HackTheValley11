import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useMedications } from '../../context/MedicationContext';
import { colors } from '../../theme/colors';
import { Clickable } from '../ui/Clickable';

export function MedicationSyncNotice() {
  const { loading, error, retry } = useMedications();
  if (!loading && !error) return null;
  return <View style={styles.notice}>
    {loading ? <><ActivityIndicator color={colors.primary} /><Text style={styles.text}>Loading your schedule…</Text></> : <>
      <Text accessibilityRole="alert" style={styles.text}>{error}</Text>
      <Clickable accessibilityRole="button" onPress={() => void retry()} style={styles.retry}><Text style={styles.link}>Try again</Text></Clickable>
    </>}
  </View>;
}
const styles = StyleSheet.create({
  notice: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16, gap: 8 },
  text: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  retry: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  link: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
