import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Medication } from '../../types/medication';
import { colors } from '../../theme/colors';

type MedicationCardProps = {
  medication: Medication;
  onMarkTaken: (id: string) => void;
};

export function MedicationCard({ medication, onMarkTaken }: MedicationCardProps) {
  const isTaken = medication.status === 'taken';

  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: medication.color }]}>
        <Text style={styles.iconText}>✦</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.name}>{medication.name}</Text>
        <Text style={styles.dosage}>{medication.dosage}</Text>
        <Text style={styles.time}>{medication.time}</Text>
      </View>
      {isTaken ? (
        <View style={styles.takenBadge}>
          <Text style={styles.takenCheck}>✓</Text>
          <Text style={styles.takenText}>Taken</Text>
        </View>
      ) : (
        <Pressable
          accessibilityLabel={`Mark ${medication.name} as taken`}
          accessibilityRole="button"
          onPress={() => onMarkTaken(medication.id)}
          style={({ pressed }) => [styles.takeButton, pressed && styles.pressed]}
        >
          <Text style={styles.takeButtonText}>Mark taken</Text>
        </Pressable>
      )}
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
  takenBadge: {
    alignItems: 'center',
    backgroundColor: colors.successSurface,
    borderRadius: 12,
    flexDirection: 'row',
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
});
