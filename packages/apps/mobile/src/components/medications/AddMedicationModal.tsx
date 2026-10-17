import { useState } from "react";
import type { ComponentProps } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Medication, MedicationFormValues } from "../../types/medication";
import { colors } from "../../theme/colors";

type AddMedicationModalProps = {
  date: Date;
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: MedicationFormValues) => void;
  medication?: Medication | null;
};

const initialValues: MedicationFormValues = {
  id: "",
  genericName: "",
  brandName: "",
  ingredients: [],
  purposes: [],
  dosageForm: "tablet",
  Frequency: "Once daily",
  doseAmount: 1,
  warning: [],
  avoidWithConditions: [],
  avoidWithIngredients: [],
  time: "8:00 AM",
  color: colors.secondary,
};

export function AddMedicationModal({
  date,
  visible,
  onClose,
  onSubmit,
  medication = null,
}: AddMedicationModalProps) {
  const [values, setValues] = useState<MedicationFormValues>(() =>
    medication ? getFormValues(medication) : initialValues,
  );
  const [ingredientName, setIngredientName] = useState(
    medication?.ingredients[0]?.name ?? "",
  );
  const [ingredientStrength, setIngredientStrength] = useState(
    String(medication?.ingredients[0]?.strength ?? 0),
  );

  const resetForm = () => {
    if (medication) {
      setValues(getFormValues(medication));
      const ingredient = medication.ingredients[0];
      setIngredientName(ingredient?.name ?? "");
      setIngredientStrength(String(ingredient?.strength ?? 0));
      return;
    }

    setValues(initialValues);
    setIngredientName("");
    setIngredientStrength("0");
  };

  const update = <K extends keyof MedicationFormValues>(
    key: K,
    value: MedicationFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }));

  const canSubmit = values.id.trim() && values.genericName.trim() && values.time.trim();

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      ...values,
      id: values.id.trim(),
      genericName: values.genericName.trim(),
      brandName: values.brandName.trim() || values.genericName.trim(),
      ingredients: ingredientName.trim()
        ? [{ name: ingredientName.trim(), strength: Number(ingredientStrength) || 0 }]
        : [],
      purposes: values.purposes,
    });
    resetForm();
    onClose();
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <View>
                <Text style={styles.kicker}>{medication ? "EDIT MEDICATION" : `ADD TO ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase()}`}</Text>
                <Text style={styles.title}>{medication ? "Edit medication" : "New medication"}</Text>
              </View>
              <Pressable accessibilityLabel="Close add medication form" accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <Field label="Medication ID" value={values.id} onChangeText={(value) => update("id", value)} placeholder="e.g. lisinopril-10mg" />
            <Field label="Generic name" value={values.genericName} onChangeText={(value) => update("genericName", value)} placeholder="e.g. Lisinopril" />
            <Field label="Brand name" value={values.brandName} onChangeText={(value) => update("brandName", value)} placeholder="Optional" />
            <View style={styles.row}>
              <View style={styles.half}><Field label="Dose amount" keyboardType="numeric" value={String(values.doseAmount)} onChangeText={(value) => update("doseAmount", Number(value) || 0)} /></View>
              <View style={styles.half}><Field label="Dosage form" value={values.dosageForm} onChangeText={(value) => update("dosageForm", value as MedicationFormValues["dosageForm"])} /></View>
            </View>
            <View style={styles.row}>
              <View style={styles.half}><Field label="Frequency" value={values.Frequency} onChangeText={(value) => update("Frequency", value)} /></View>
              <View style={styles.half}><Field label="Scheduled time" value={values.time} onChangeText={(value) => update("time", value)} /></View>
            </View>
            <Text style={styles.groupLabel}>Ingredient (optional)</Text>
            <View style={styles.row}>
              <View style={styles.half}><Field label="Name" value={ingredientName} onChangeText={setIngredientName} placeholder="e.g. Lisinopril" /></View>
              <View style={styles.half}><Field label="Strength (mg)" keyboardType="numeric" value={ingredientStrength} onChangeText={setIngredientStrength} /></View>
            </View>
            <Field label="Purpose (optional)" value={values.purposes[0] ?? ""} onChangeText={(value) => update("purposes", value ? [value] : [])} placeholder="What is it for?" />
            <Pressable accessibilityLabel="Save medication" accessibilityRole="button" disabled={!canSubmit} onPress={submit} style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}>
              <Text style={styles.saveButtonText}>{medication ? "Save changes" : "Add medication"}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function getFormValues(medication: Medication): MedicationFormValues {
  return {
    id: medication.id,
    genericName: medication.genericName,
    brandName: medication.brandName,
    ingredients: medication.ingredients,
    purposes: medication.purposes,
    dosageForm: medication.dosageForm,
    Frequency: medication.Frequency,
    doseAmount: medication.doseAmount,
    warning: medication.warning,
    avoidWithConditions: medication.avoidWithConditions,
    avoidWithIngredients: medication.avoidWithIngredients,
    time: medication.time,
    color: medication.color,
  };
}

function Field(props: ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...inputProps} style={styles.input} placeholderTextColor={colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: "rgba(36, 52, 94, 0.42)", flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "92%" },
  content: { padding: 24, paddingBottom: 36 },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  kicker: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800", marginTop: 5 },
  closeButton: { alignItems: "center", backgroundColor: colors.surface, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  closeText: { color: colors.primary, fontSize: 25, lineHeight: 28 },
  field: { flex: 1, marginBottom: 14 },
  fieldLabel: { color: colors.text, fontSize: 12, fontWeight: "800", marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, minHeight: 46, paddingHorizontal: 12 },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  groupLabel: { color: colors.text, fontSize: 12, fontWeight: "800", marginBottom: 8 },
  saveButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: 14, minHeight: 50, justifyContent: "center", marginTop: 8 },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: colors.background, fontSize: 15, fontWeight: "800" },
});
