import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GreetingHeader } from '../components/dashboard/GreetingHeader';
import { MedicationList } from '../components/dashboard/MedicationList';
import { useMedications } from '../context/MedicationContext';
import { getMedicationDisplayStatus } from '../types/medication';
import { colors } from '../theme/colors';

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { medicationsByDate, cycleMedicationStatus } = useMedications();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const medications = medicationsByDate[todayKey] ?? [];
  const takenCount = medications.filter((medication) => getMedicationDisplayStatus(medication) === 'taken').length;
  const missedCount = medications.filter((medication) => getMedicationDisplayStatus(medication) === 'missed').length;
  const completionPercentage = medications.length === 0 ? 0 : Math.round((takenCount / medications.length) * 100);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        Platform.OS === 'android' && { paddingTop: styles.content.paddingTop + insets.top },
      ]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <GreetingHeader name="Alexander" subtitle="You're doing amazing!" />
      <View style={styles.progressCard}>
        <View style={styles.progressCopy}>
          <Text style={styles.progressEyebrow}>TODAY&apos;S PROGRESS</Text>
          <Text style={styles.progressTitle}>
            {missedCount > 0
              ? 'Review missed doses'
              : takenCount === medications.length
                ? 'All done for today!'
                : "You're doing great"}
          </Text>
          <Text style={styles.progressSubtitle}>
            {takenCount} of {medications.length} doses taken
            {missedCount > 0 ? ` · ${missedCount} missed` : ''}
          </Text>
          <View
            accessibilityLabel={`${completionPercentage}% of today's medications completed`}
            accessibilityRole="progressbar"
            style={styles.progressTrack}
          >
            <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
          </View>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressNumber}>{completionPercentage}%</Text>
          <Text style={styles.progressCircleLabel}>complete</Text>
        </View>
      </View>
      {missedCount > 0 && (
        <View style={styles.missedBanner} accessibilityRole="alert">
          <Text style={styles.missedBannerTitle}>
            {missedCount} missed {missedCount === 1 ? 'dose' : 'doses'}
          </Text>
          <Text style={styles.missedBannerText}>
            Review your schedule and follow your care plan before making changes.
          </Text>
        </View>
      )}
      <MedicationList
        medications={medications}
        onCycleMedicationStatus={cycleMedicationStatus}
      />
      <View style={styles.note}>
        <Text style={styles.noteIcon}>✚</Text>
        <Text style={styles.noteText}>Small steps add up. You&apos;ve got this.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
  },
  progressCard: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    overflow: 'hidden',
    padding: 22,
  },
  progressCopy: {
    flex: 1,
  },
  progressEyebrow: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  progressTitle: {
    color: colors.surface,
    fontSize: 19,
    fontWeight: '700',
    marginTop: 7,
  },
  progressSubtitle: {
    color: '#DCE5FF',
    fontSize: 13,
    marginTop: 5,
  },
  progressTrack: {
    backgroundColor: '#7184B6',
    borderRadius: 4,
    height: 7,
    marginTop: 15,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: colors.accent,
    borderRadius: 4,
    height: '100%',
  },
  progressCircle: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 40,
    height: 72,
    justifyContent: 'center',
    marginLeft: 14,
    width: 72,
  },
  progressNumber: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  progressCircleLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  note: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  noteIcon: {
    color: colors.accent,
    fontSize: 15,
    marginRight: 7,
  },
  noteText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  missedBanner: {
    backgroundColor: colors.accent,
    borderRadius: 18,
    marginBottom: 18,
    padding: 16,
  },
  missedBannerTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  missedBannerText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 4,
  },
});
