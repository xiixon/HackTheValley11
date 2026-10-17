import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Medication } from "../../types/medication";
import { colors } from "../../theme/colors";

type MedicationDetailsModalProps = {
  medication: Medication | null;
  onClose: () => void;
  onEdit: (medication: Medication) => void;
};

export function MedicationDetailsModal({
  medication,
  onClose,
  onEdit,
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
        {medication.Frequency.toLowerCase().includes("as needed") && (
          <View style={styles.asNeededNote}>
            <Text style={styles.asNeededTitle}>What does “as needed” mean?</Text>
            <Text style={styles.asNeededText}>
              Take this dose only when the symptoms or situation it was prescribed
              for occurs. Follow the directions from your healthcare professional
              for how much to take and how often.
            </Text>
          </View>
        )}
        {medication.scheduledDate && (
          <Text style={styles.scheduledDate}>
            Scheduled for {medication.scheduledDate}
          </Text>
        )}
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
        <View style={styles.editArea}>
          <Text style={styles.editPrompt}>Need to correct a detail?</Text>
          <Pressable
            accessibilityLabel={`Edit ${medication.genericName}`}
            accessibilityRole="button"
            onPress={() => onEdit(medication)}
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.editButtonPressed,
            ]}
          >
            <Text style={styles.editButtonIcon}>↗</Text>
            <Text style={styles.editButtonText}>Edit medication</Text>
          </Pressable>
        </View>
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
      <View style={styles.sectionHeading}>
        <View style={styles.sectionMarker} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionValue}>
        {values.length ? values.join("\n") : emptyLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { backgroundColor: "#F4F0E5", flexGrow: 1, padding: 24, paddingBottom: 44 },
  header: { alignItems: "flex-start", backgroundColor: colors.primary, borderRadius: 24, flexDirection: "row", justifyContent: "space-between", marginTop: 12, padding: 22 },
  headerCopy: { flex: 1 },
  kicker: { color: colors.secondary, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: colors.background, fontSize: 30, fontWeight: "800", marginTop: 8 },
  brand: { color: "#DCE5FF", fontSize: 15, marginTop: 4 },
  closeButton: { alignItems: "center", backgroundColor: "#6075B4", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  closeText: { color: colors.background, fontSize: 25, lineHeight: 28 },
  summary: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 14, paddingHorizontal: 4, paddingVertical: 16 },
  asNeededNote: { backgroundColor: "#FFF0D2", borderColor: "#E8C982", borderRadius: 16, borderWidth: 1, marginTop: 14, padding: 15 },
  asNeededTitle: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  asNeededText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  scheduledDate: { color: colors.textMuted, fontSize: 12, fontWeight: "700", marginTop: 12, textAlign: "right" },
  detail: { flex: 1, minWidth: 0, paddingHorizontal: 9 },
  detailLabel: { color: colors.textMuted, fontSize: 9, fontWeight: "800", letterSpacing: 0.7, textTransform: "uppercase" },
  detailValue: { color: colors.primary, fontSize: 13, fontWeight: "800", lineHeight: 18, marginTop: 7 },
  section: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17, borderWidth: 1, marginTop: 12, padding: 16 },
  sectionHeading: { alignItems: "center", flexDirection: "row" },
  sectionMarker: { backgroundColor: colors.accent, borderRadius: 3, height: 7, marginRight: 8, width: 7 },
  sectionTitle: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  sectionValue: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 9 },
  editArea: { alignItems: "center", marginTop: 26 },
  editPrompt: { color: colors.textMuted, fontSize: 12, marginBottom: 9 },
  editButton: { alignItems: "center", borderColor: colors.primary, borderRadius: 13, borderWidth: 1, flexDirection: "row", justifyContent: "center", minHeight: 44, paddingHorizontal: 18 },
  editButtonPressed: { backgroundColor: colors.surfaceMuted, opacity: 0.78 },
  editButtonIcon: { color: colors.primary, fontSize: 17, fontWeight: "800", marginRight: 7 },
  editButtonText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
});
