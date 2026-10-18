import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Medication } from "../../types/medication";
import { colors } from "../../theme/colors";
import { typography } from '../../theme/typography';

type MedicationDetailsModalProps = {
  medication: Medication | null;
  onClose: () => void;
};

export function MedicationDetailsModal({
  medication,
  onClose,
}: MedicationDetailsModalProps) {
  if (!medication) return null;

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>MEDICATION DETAILS</Text>
            <Text style={styles.title}>{medication.genericName}</Text>
            <Text style={styles.brand}>{medication.brandName}</Text>
          </View>
          <Pressable accessibilityLabel="Close medication details" accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>
        <View style={styles.summary}>
          <Detail label="Dose" value={`${medication.doseAmount} ${medication.dosageForm}`} />
          <Detail label="Frequency" value={medication.Frequency} />
          <Detail label="Time" value={medication.time} />
        </View>
        <Section title="Purpose" values={medication.purposes} />
        <Section
          title="Ingredients"
          values={medication.ingredients.map(({ name, strength }) => `${name} · ${strength} mg`)}
        />
        <Section title="Warnings" values={medication.warning} emptyLabel="No warnings recorded." />
        <Section
          title="Avoid with conditions"
          values={medication.avoidWithConditions}
          emptyLabel="No conditions recorded."
        />
        <Section
          title="Avoid with ingredients"
          values={medication.avoidWithIngredients}
          emptyLabel="No interactions recorded."
        />
      </ScrollView>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function Section({
  title,
  values,
  emptyLabel = "Not specified.",
}: {
  title: string;
  values: string[];
  emptyLabel?: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionValue}>{values.length ? values.join("\n") : emptyLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { backgroundColor: colors.background, flexGrow: 1, padding: 24 },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", paddingTop: 24 },
  headerCopy: { flex: 1 },
  kicker: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.3 },
  title: { ...typography.heading, color: colors.text, fontSize: 30, marginTop: 8 },
  brand: { color: colors.textMuted, fontSize: 15, marginTop: 4 },
  closeButton: { alignItems: "center", backgroundColor: colors.surface, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  closeText: { color: colors.primary, fontSize: 25, lineHeight: 28 },
  summary: { backgroundColor: colors.primary, borderRadius: 20, flexDirection: "row", justifyContent: "space-between", marginTop: 28, padding: 18 },
  detail: { flex: 1 },
  detailLabel: { color: colors.secondary, fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  detailValue: { color: colors.background, fontSize: 14, fontWeight: "700", marginTop: 6 },
  section: { borderBottomColor: colors.border, borderBottomWidth: 1, paddingVertical: 18 },
  sectionTitle: { ...typography.heading, color: colors.text, fontSize: 16 },
  sectionValue: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 6 },
});
