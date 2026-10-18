import { useState } from "react";
import type { ComponentProps } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Medication, MedicationFormValues } from "../../types/medication";
import { colors } from "../../theme/colors";
import { typography } from '../../theme/typography';
import { Clickable } from '../ui/Clickable';

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
  Frequency: "Once",
  doseAmount: 1,
  warning: [],
  avoidWithConditions: [],
  avoidWithIngredients: [],
  time: "8:00 AM",
  color: colors.secondary,
  startDate: "",
  endDate: "",
  notes: "",
  reminderTimes: ["8:00 AM"],
  selectedWeekdays: [],
  intervalDays: 2,
};

const frequencyOptions = ["Once", "Daily", "Selected days", "Every N days", "Weekly", "Monthly", "As needed", "Once daily"];
const weekdayOptions = [["S", 0], ["M", 1], ["T", 2], ["W", 3], ["T", 4], ["F", 5], ["S", 6]] as const;

type PickerTarget = "startDate" | "endDate" | "reminder" | null;

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function parseDate(value: string, fallback: Date) {
  const parsed = value ? new Date(`${value}T12:00:00`) : fallback;
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

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
  const [isFrequencyOpen, setIsFrequencyOpen] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState("");
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerDate, setPickerDate] = useState(new Date());

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

  const isRecurring = !["Once", "As needed"].includes(values.Frequency);
  const needsWeekdays = values.Frequency === "Selected days";
  const needsInterval = values.Frequency === "Every N days";
  const startDateValid = /^\d{4}-\d{2}-\d{2}$/.test(values.startDate);
  const endDateValid =
    !isRecurring ||
    (/^\d{4}-\d{2}-\d{2}$/.test(values.endDate) &&
      values.endDate >= values.startDate);
  const canSubmit =
    Boolean(values.id.trim() && values.genericName.trim()) &&
    startDateValid &&
    endDateValid &&
    (!needsWeekdays || values.selectedWeekdays.length > 0) &&
    (!needsInterval || values.intervalDays > 0) &&
    values.reminderTimes.every((time) => time.trim().length > 0);

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      ...values,
      id: values.id.trim(),
      genericName: values.genericName.trim(),
      time: values.reminderTimes[0] ?? values.time,
      brandName: values.brandName.trim() || values.genericName.trim(),
      ingredients: ingredientName.trim()
        ? [{ name: ingredientName.trim(), strength: Number(ingredientStrength) || 0 }]
        : [],
      purposes: values.purposes,
      startDate: values.startDate.trim(),
      endDate: isRecurring ? values.endDate.trim() : "",
      notes: values.notes.trim(),
      reminderTimes: values.reminderTimes,
      selectedWeekdays: values.selectedWeekdays,
      intervalDays: values.intervalDays,
    });
    resetForm();
    onClose();
  };

  const openDatePicker = (target: "startDate" | "endDate") => {
    setPickerDate(
      parseDate(
        target === "startDate" ? values.startDate : values.endDate,
        date,
      ),
    );
    setPickerTarget(target);
  };

  const openTimePicker = () => {
    setPickerDate(new Date());
    setPickerTarget("reminder");
  };

  const handlePickerChange = (_event: unknown, selected?: Date) => {
    if (Platform.OS !== "ios") setPickerTarget(null);
    if (!selected || !pickerTarget) return;

    if (pickerTarget === "reminder") {
      setNewReminderTime(formatTime(selected));
      return;
    }

    update(pickerTarget, formatDate(selected));
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
              <Clickable accessibilityLabel="Close add medication form" accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Clickable>
            </View>
            <Field label="Medication ID" value={values.id} onChangeText={(value) => update("id", value)} placeholder="e.g. lisinopril-10mg" />
            <Field label="Generic name" value={values.genericName} onChangeText={(value) => update("genericName", value)} placeholder="e.g. Lisinopril" />
            <Field label="Brand name" value={values.brandName} onChangeText={(value) => update("brandName", value)} placeholder="Optional" />
            <View style={styles.row}>
              <View style={styles.half}><Field label="Dose amount" keyboardType="numeric" value={String(values.doseAmount)} onChangeText={(value) => update("doseAmount", Number(value) || 0)} /></View>
              <View style={styles.half}>
                <SelectField
                  label="Dosage form"
                  value={values.dosageForm}
                  onPress={() => update("dosageForm", values.dosageForm === "tablet" ? "capsule" : "tablet")}
                />
              </View>
            </View>
            {needsWeekdays && (
              <View style={styles.scheduleGroup}>
                <Text style={styles.groupLabel}>Days of the week</Text>
                <View style={styles.weekdayRow}>
                  {weekdayOptions.map(([label, day]) => {
                    const selected = values.selectedWeekdays.includes(day);
                    return (
                      <Clickable
                        key={`${label}-${day}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => update("selectedWeekdays", selected ? values.selectedWeekdays.filter((item) => item !== day) : [...values.selectedWeekdays, day].sort())}
                        style={[styles.weekday, selected && styles.weekdaySelected]}
                      >
                        <Text style={[styles.weekdayText, selected && styles.weekdayTextSelected]}>{label}</Text>
                      </Clickable>
                    );
                  })}
                </View>
              </View>
            )}
            {needsInterval && (
              <Field label="Repeat every (days)" keyboardType="numeric" value={String(values.intervalDays)} onChangeText={(value) => update("intervalDays", Number(value) || 0)} />
            )}
            <View style={styles.scheduleGroup}>
              <Text style={styles.groupLabel}>Reminder times</Text>
              {values.reminderTimes.map((time, index) => (
                <View key={`${time}-${index}`} style={styles.timeRow}>
                  <Field label={`Time ${index + 1}`} value={time} onChangeText={(value) => update("reminderTimes", values.reminderTimes.map((item, itemIndex) => itemIndex === index ? value : item))} placeholder="e.g. 8:00 AM" />
                  {values.reminderTimes.length > 1 && (
                    <Clickable accessibilityLabel={`Remove reminder time ${index + 1}`} accessibilityRole="button" onPress={() => update("reminderTimes", values.reminderTimes.filter((_, itemIndex) => itemIndex !== index))} style={styles.removeTime}>
                      <Text style={styles.removeTimeText}>−</Text>
                    </Clickable>
                  )}
                </View>
              ))}
              <View style={styles.addTimeRow}>
                <SelectField label="New reminder time" value={newReminderTime || "Choose time"} onPress={openTimePicker} />
                <Clickable accessibilityLabel="Add reminder time" accessibilityRole="button" disabled={!newReminderTime.trim()}                 onPress={() => { if (!newReminderTime) return; update("reminderTimes", [...values.reminderTimes, newReminderTime]); setNewReminderTime(""); }} style={[styles.addTimeButton, !newReminderTime.trim() && styles.saveButtonDisabled]}>
                  <Text style={styles.addTimeText}>+</Text>
                </Clickable>
              </View>
            </View>
            {!startDateValid && values.startDate.length > 0 && (
              <Text style={styles.validationText}>Use a date in YYYY-MM-DD format.</Text>
            )}
            {isRecurring && !endDateValid && values.endDate.length > 0 && (
              <Text style={styles.validationText}>End date must be on or after the start date.</Text>
            )}
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.fieldLabel}>Frequency</Text>
                <Clickable accessibilityRole="button" accessibilityLabel="Choose medication frequency" onPress={() => setIsFrequencyOpen((open) => !open)} style={({ pressed }) => [styles.select, pressed && styles.selectPressed]}>
                  <Text style={styles.selectText}>{values.Frequency}</Text>
                  <Text style={styles.selectChevron}>{isFrequencyOpen ? "▲" : "▼"}</Text>
                </Clickable>
                {isFrequencyOpen && (
                  <View style={styles.options}>
                    {frequencyOptions.map((option) => (
                      <Clickable key={option} onPress={() => { update("Frequency", option); setIsFrequencyOpen(false); }} style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
                        <Text style={styles.optionText}>{option}</Text>
                      </Clickable>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.half}>
                <SelectField
                  label="Primary reminder time"
                  value={values.reminderTimes[0] ?? values.time}
                  onPress={openTimePicker}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.half}>
                <SelectField label="Start date" value={values.startDate || "Choose date"} onPress={() => openDatePicker("startDate")} />
              </View>
              {isRecurring && <View style={styles.half}><SelectField label="End date" value={values.endDate || "Choose date"} onPress={() => openDatePicker("endDate")} /></View>}
            </View>
            <Text style={styles.groupLabel}>Ingredient (optional)</Text>
            <View style={styles.row}>
              <View style={styles.half}><Field label="Name" value={ingredientName} onChangeText={setIngredientName} placeholder="e.g. Lisinopril" /></View>
              <View style={styles.half}><Field label="Strength (mg)" keyboardType="numeric" value={ingredientStrength} onChangeText={setIngredientStrength} /></View>
            </View>
            <Field label="Purpose (optional)" value={values.purposes[0] ?? ""} onChangeText={(value) => update("purposes", value ? [value] : [])} placeholder="What is it for?" />
            <Field label="Instructions or notes (optional)" value={values.notes} onChangeText={(value) => update("notes", value)} placeholder="e.g. Take with food" multiline />
            <Clickable accessibilityLabel="Save medication" accessibilityRole="button" disabled={!canSubmit} onPress={submit} style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}>
              <Text style={styles.saveButtonText}>{medication ? "Save changes" : "Add medication"}</Text>
            </Clickable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      {pickerTarget && (
        <DateTimePicker
          value={pickerDate}
          mode={pickerTarget === "reminder" ? "time" : "date"}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handlePickerChange}
        />
      )}
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
    startDate: medication.startDate ?? medication.scheduledDate ?? "",
    endDate: medication.endDate ?? medication.startDate ?? medication.scheduledDate ?? "",
    notes: medication.notes ?? "",
    reminderTimes: medication.reminderTimes ?? [medication.time],
    selectedWeekdays: medication.selectedWeekdays ?? [],
    intervalDays: medication.intervalDays ?? 2,
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

function SelectField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Clickable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        onPress={onPress}
        style={({ pressed }) => [styles.select, pressed && styles.selectPressed]}
      >
        <Text style={styles.selectText}>{value}</Text>
        <Text style={styles.selectChevron}>⌄</Text>
      </Clickable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: "rgba(36, 52, 94, 0.42)", flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "92%" },
  content: { padding: 24, paddingBottom: 36 },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  kicker: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { ...typography.heading, color: colors.text, fontSize: 28, marginTop: 5 },
  closeButton: { alignItems: "center", backgroundColor: colors.surface, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  closeText: { color: colors.primary, fontSize: 25, lineHeight: 28 },
  field: { flex: 1, marginBottom: 14 },
  fieldLabel: { color: colors.text, fontSize: 12, fontWeight: "800", marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, minHeight: 46, paddingHorizontal: 12 },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  select: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 46, paddingHorizontal: 12 },
  selectText: { color: colors.text, fontSize: 13 },
  selectChevron: { color: colors.primary, fontSize: 10, fontWeight: "800" },
  selectPressed: { backgroundColor: colors.surfaceMuted, opacity: 0.8 },
  options: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, marginTop: 4, overflow: "hidden" },
  option: { borderBottomColor: colors.border, borderBottomWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  optionText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  optionPressed: { backgroundColor: colors.surfaceMuted },
  scheduleGroup: { marginBottom: 8 },
  weekdayRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  weekday: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  weekdaySelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  weekdayText: { color: colors.textMuted, fontSize: 12, fontWeight: "800" },
  weekdayTextSelected: { color: colors.background },
  timeRow: { alignItems: "center", flexDirection: "row" },
  removeTime: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: 16, height: 32, justifyContent: "center", marginLeft: 8, width: 32 },
  removeTimeText: { color: colors.primary, fontSize: 20 },
  addTimeRow: { alignItems: "center", flexDirection: "row" },
  addTimeButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: 12, height: 46, justifyContent: "center", marginLeft: 8, width: 46 },
  addTimeText: { color: colors.background, fontSize: 24, fontWeight: "700" },
  validationText: { color: colors.primary, fontSize: 11, marginBottom: 8 },
  groupLabel: { color: colors.text, fontSize: 12, fontWeight: "800", marginBottom: 8 },
  saveButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: 14, minHeight: 50, justifyContent: "center", marginTop: 8 },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: colors.background, fontSize: 15, fontWeight: "800" },
});
