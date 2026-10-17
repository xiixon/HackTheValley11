import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { Medication } from '../../types/medication';
import { colors } from '../../theme/colors';
import { MedicationDetailsModal } from '../medications/MedicationDetailsModal';

type MedicationCardProps = {
  medication: Medication;
  onMarkTaken: (id: string) => void;
};

export function MedicationCard({ medication, onMarkTaken }: MedicationCardProps) {
  const isTaken = medication.status === 'taken';
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: medication.color }]}>
        <Text style={styles.iconText}>✦</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.name}>{medication.genericName}</Text>
        <Text style={styles.dosage}>{medication.dosage}</Text>
        <Text style={styles.time}>{medication.time}</Text>
      </View>
      <Pressable
        accessibilityLabel={`${isTaken ? 'Undo taken status for' : 'Mark'} ${medication.genericName}`}
        accessibilityRole="button"
        accessibilityState={{ checked: isTaken }}
        onPress={() => onMarkTaken(medication.id)}
        style={({ pressed }) => [
          isTaken ? styles.takenButton : styles.takeButton,
          pressed && styles.pressed,
        ]}
      >
        {isTaken && <Text style={styles.takenCheck}>✓</Text>}
        <Text style={isTaken ? styles.takenText : styles.takeButtonText}>
          {isTaken ? 'Taken' : 'Upcoming'}
        </Text>
      </Pressable>
      <Pressable accessibilityLabel={`View details for ${medication.genericName}`} accessibilityRole="button" onPress={() => setIsDetailsVisible(true)}>
        <Text style={styles.detailsLink}>Details</Text>
      </Pressable>
      <MedicationDetailsModal medication={isDetailsVisible ? medication : null} onClose={() => setIsDetailsVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    minHeight: 108,
    padding: 16,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  iconText: {
    color: colors.primary,
    fontSize: 25,
    fontWeight: '700',
  },
  details: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  dosage: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  time: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  takenButton: {
    alignItems: 'center',
    backgroundColor: colors.successSurface,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  takenCheck: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  takenText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  takeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  takeButtonText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  detailsLink: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 8,
  },
});
