import { StyleSheet, Text, View } from 'react-native';

import { MedicationCard } from './MedicationCard';
import { Medication } from '../../types/medication';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type MedicationListProps = {
  medications: Medication[];
  onCycleMedicationStatus: (id: string) => void;
  onEditMedication: (medication: Medication) => void;
};

export function MedicationList({ medications, onCycleMedicationStatus, onEditMedication }: MedicationListProps) {
  return (
    <View>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Today&apos;s medications</Text>
        <Text style={styles.count}>{medications.length} total</Text>
      </View>
      {medications.map((medication) => (
        <MedicationCard key={medication.id} medication={medication} onMarkTaken={onCycleMedicationStatus} onEditMedication={onEditMedication} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heading: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 20,
  },
  count: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
