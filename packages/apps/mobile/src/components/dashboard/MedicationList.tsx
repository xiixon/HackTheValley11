import { StyleSheet, Text, View } from 'react-native';

import { MedicationCard } from './MedicationCard';
import { Medication } from '../../types/medication';

type MedicationListProps = {
  medications: Medication[];
  onMarkTaken: (id: string) => void;
};

export function MedicationList({ medications, onMarkTaken }: MedicationListProps) {
  return (
    <View>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Today&apos;s medications</Text>
        <Text style={styles.count}>{medications.length} total</Text>
      </View>
      {medications.map((medication) => (
        <MedicationCard key={medication.id} medication={medication} onMarkTaken={onMarkTaken} />
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
    color: '#173B35',
    fontSize: 20,
    fontWeight: '700',
  },
  count: {
    color: '#80908A',
    fontSize: 13,
    fontWeight: '600',
  },
});
