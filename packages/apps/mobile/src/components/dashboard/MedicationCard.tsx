import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { getMedicationDisplayStatus, Medication } from '../../types/medication';
import { colors } from '../../theme/colors';
import { MedicationDetailsModal } from '../medications/MedicationDetailsModal';

type MedicationCardProps = {
  medication: Medication;
  onMarkTaken: (id: string) => void;
};

export function MedicationCard({ medication, onMarkTaken }: MedicationCardProps) {
  const displayStatus = getMedicationDisplayStatus(medication);
  const isTaken = displayStatus === 'taken';
  const isMissed = displayStatus === 'missed';
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
        accessibilityLabel={
          isMissed
            ? `${medication.genericName} was missed; mark it as taken`
            : `${isTaken ? 'Mark' : 'Take'} ${medication.genericName}`
        }
        accessibilityRole="button"
        accessibilityState={{ checked: isTaken }}
        disabled={isMissed}
        onPress={() => onMarkTaken(medication.id)}
        style={({ pressed }) => [
          isMissed ? styles.missedButton : isTaken ? styles.takenButton : styles.takeButton,
          pressed && styles.pressed,
        ]}
      >
        {isTaken && <Text style={styles.takenCheck}>✓</Text>}
        {isMissed && <Text style={styles.missedMark}>!</Text>}
        <Text style={isMissed ? styles.missedText : isTaken ? styles.takenText : styles.takeButtonText}>
          {isMissed ? 'Missed' : isTaken ? 'Taken' : 'Upcoming'}
        </Text>
      </Pressable>
      {isMissed && (
        <Pressable
          accessibilityLabel={`Mark missed ${medication.genericName} as taken`}
          accessibilityRole="button"
          onPress={() => onMarkTaken(medication.id)}
          style={({ pressed }) => [styles.markTakenButton, pressed && styles.pressed]}
        >
          <Text style={styles.markTakenText}>Mark taken</Text>
        </Pressable>
      )}
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
  missedButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  missedMark: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
    marginRight: 4,
  },
  missedText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  markTakenButton: {
    borderColor: colors.primary,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  markTakenText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
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
