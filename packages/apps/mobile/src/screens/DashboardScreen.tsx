import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { todaysMedications } from '../data/medications';
import { GreetingHeader } from '../components/dashboard/GreetingHeader';
import { MedicationList } from '../components/dashboard/MedicationList';
import { colors } from '../theme/colors';

export function DashboardScreen() {
  const [medications, setMedications] = useState(todaysMedications);
  const takenCount = medications.filter(({ status }) => status === 'taken').length;

  const markMedicationTaken = (id: string) => {
    setMedications((current) =>
      current.map((medication) =>
        medication.id === id ? { ...medication, status: 'taken' } : medication,
      ),
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <GreetingHeader name="Alexander" subtitle="You're doing amazing!" />
      <View style={styles.progressCard}>
        <View style={styles.progressCopy}>
          <Text style={styles.progressEyebrow}>YOUR PROGRESS</Text>
          <Text style={styles.progressTitle}>
            {takenCount === medications.length ? 'All done for today!' : "You're doing great"}
          </Text>
          <Text style={styles.progressSubtitle}>
            {takenCount} of {medications.length} doses logged
          </Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressNumber}>
            {Math.round((takenCount / medications.length) * 100)}%
          </Text>
        </View>
      </View>
      <MedicationList medications={medications} onMarkTaken={markMedicationTaken} />
      <View style={styles.note}>
        <Text style={styles.noteIcon}>✦</Text>
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
    backgroundColor: colors.secondary,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    padding: 20,
  },
  progressCopy: {
    flex: 1,
  },
  progressEyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  progressTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '700',
    marginTop: 7,
  },
  progressSubtitle: {
    color: colors.text,
    fontSize: 13,
    marginTop: 5,
  },
  progressCircle: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 40,
    borderWidth: 5,
    height: 72,
    justifyContent: 'center',
    marginLeft: 14,
    width: 72,
  },
  progressNumber: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
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
});
