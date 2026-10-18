import {
  Modal,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useState } from "react";

import {
  getMedicationDisplayStatus,
  Medication,
  MedicationFormValues,
} from "../../types/medication";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { AddMedicationModal } from "../medications/AddMedicationModal";
import { MedicationDetailsModal } from "../medications/MedicationDetailsModal";
import { PageBackdrop } from "../navigation/PageBackdrop";

type ScheduleProps = {
  medicationsByDate: Record<string, Medication[]>;
  onCycleMedicationStatus: (id: string) => void;
  onAddMedication: (date: Date, medication: MedicationFormValues) => void;
  onUpdateMedication: (id: string, medication: MedicationFormValues) => void;
  onDeleteMedication: (id: string) => void;
};

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function Schedule({
  medicationsByDate,
  onCycleMedicationStatus,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
}: ScheduleProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isAddMedicationVisible, setIsAddMedicationVisible] = useState(false);
  const [detailsMedication, setDetailsMedication] = useState<Medication | null>(null);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const dates = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(selectedDate);
    date.setDate(selectedDate.getDate() + index - 2);
    return date;
  });

  const selectedDateKey = getDateKey(selectedDate);
  const selectedMedications = medicationsByDate[selectedDateKey] ?? [];
  const selectedDateLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const untakenDoses = selectedMedications.filter(
    (medication) => medication.status !== "taken",
  ).length;
  const getDaySummary = (date: Date) => {
    const dayMedications = medicationsByDate[getDateKey(date)] ?? [];
    const hasMissed = dayMedications.some(
      (medication) => getMedicationDisplayStatus(medication) === "missed",
    );
    const allTaken =
      dayMedications.length > 0 &&
      dayMedications.every(
        (medication) => getMedicationDisplayStatus(medication) === "taken",
      );

    return {
      hasMissed,
      allTaken,
      hasScheduled: dayMedications.length > 0,
    };
  };
  const monthStart = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1,
  );
  const monthDays = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0,
  ).getDate();
  const calendarCells: (Date | null)[] = [
    ...Array.from({ length: monthStart.getDay() }, () => null),
    ...Array.from({ length: monthDays }, (_, index) => {
      return new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth(),
        index + 1,
      );
    }),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const changeMonth = (amount: number) => {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + amount, 1),
    );
  };

  return (
    <PageBackdrop variant="schedule">
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.title}>Your day,{"\n"}at a glance.</Text>
            <Text style={styles.heroDescription}>
              A clear view of what&apos;s next.
            </Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeNumber}>{untakenDoses}</Text>
            <Text style={styles.heroBadgeLabel}>doses left</Text>
          </View>
        </View>

        <View style={styles.dateRail}>
          {dates.map((date) => {
            const label = weekdays[date.getDay()];
            const number = date.getDate();
            const isActive = getDateKey(date) === selectedDateKey;
            const summary = getDaySummary(date);

            return (
              <Pressable
                accessibilityLabel={`Select ${label} ${number}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                key={getDateKey(date)}
                onPress={() => setSelectedDate(date)}
                style={({ pressed }) => [
                  styles.dateItem,
                  isActive && styles.dateItemActive,
                  pressed && styles.dateItemPressed,
                ]}
              >
                <Text
                  style={[styles.dateLabel, isActive && styles.dateLabelActive]}
                >
                  {label}
                </Text>
                <Text
                  style={[styles.dateNumber, isActive && styles.dateNumberActive]}
                >
                  {number}
                </Text>
                {summary.hasScheduled && (
                  <View
                    style={[
                      isActive ? styles.dateDot : styles.dateStatusDot,
                      summary.hasMissed
                        ? styles.dateStatusDotMissed
                        : summary.allTaken
                          ? styles.dateStatusDotTaken
                          : styles.dateStatusDotUpcoming,
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Scheduled doses</Text>
            <Text style={styles.sectionSubtitle}>{selectedDateLabel}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel={`Add medication for ${selectedDateLabel}`}
              accessibilityRole="button"
              onPress={() => setIsAddMedicationVisible(true)}
              style={({ pressed }) => [
                styles.addHeaderButton,
                pressed && styles.calendarButtonPressed,
              ]}
            >
              <Text style={styles.addHeaderButtonText}>+ Add</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Open date picker"
              accessibilityRole="button"
              onPress={() => {
                setCalendarMonth(
                  new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
                );
                setIsCalendarVisible(true);
              }}
              style={({ pressed }) => [
                styles.calendarButton,
                pressed && styles.calendarButtonPressed,
              ]}
            >
              <Text style={styles.calendarLabel}>Change day</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.doseList}>
          {selectedMedications.map((medication) => {
            const displayStatus = getMedicationDisplayStatus(medication);
            const isTaken = displayStatus === "taken";
            const isMissed = displayStatus === "missed";

            return (
              <View
                key={medication.id}
                style={[
                  styles.doseCard,
                  isMissed
                    ? styles.doseCardMissed
                    : isTaken
                      ? styles.doseCardTaken
                      : styles.doseCardUpcoming,
                ]}
              >
                <View
                  style={[
                    styles.doseAccent,
                    isMissed
                      ? styles.doseAccentMissed
                      : isTaken
                        ? styles.doseAccentTaken
                        : styles.doseAccentUpcoming,
                  ]}
                />
                <View style={styles.timeColumn}>
                  <Text style={styles.time}>{medication.time}</Text>
                  <Text style={styles.timeLabel}>
                    {isMissed ? "MISSED" : isTaken ? "TAKEN" : "NEXT DOSE"}
                  </Text>
                  {medication.time.toLowerCase().includes("as needed") && (
                    <Text style={styles.timeHint}>WHEN NEEDED</Text>
                  )}
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.doseDetails}>
                  <View style={styles.medicationCopy}>
                    <Text
                      ellipsizeMode="tail"
                      numberOfLines={1}
                      style={styles.medicationName}
                    >
                      {medication.genericName}
                    </Text>
                    <Text
                      ellipsizeMode="tail"
                      numberOfLines={1}
                      style={styles.dosage}
                    >
                      {medication.dosage}
                    </Text>
                  </View>
                </View>
                <View style={styles.actionColumn}>
                  <Pressable
                    accessibilityLabel={
                      isMissed
                        ? `${medication.genericName} was missed; mark it as taken`
                        : `${isTaken ? "Mark" : "Take"} ${medication.genericName}`
                    }
                    accessibilityRole="button"
                    accessibilityState={{ checked: isTaken }}
                    disabled={isMissed}
                    onPress={() => onCycleMedicationStatus(medication.id)}
                    style={({ pressed }) => [
                      styles.status,
                      isMissed
                        ? styles.statusMissed
                        : isTaken
                          ? styles.statusTaken
                          : styles.statusUpcoming,
                      pressed && styles.statusPressed,
                    ]}
                  >
                    <Text
                      style={
                        isMissed
                          ? styles.statusMissedText
                          : isTaken
                            ? styles.statusTakenText
                            : styles.statusUpcomingText
                      }
                    >
                      {isMissed ? "Missed" : isTaken ? "Taken" : "Upcoming"}
                    </Text>
                  </Pressable>
                  {isMissed && (
                    <Pressable
                      accessibilityLabel={`Mark missed ${medication.genericName} as taken`}
                      accessibilityRole="button"
                      onPress={() => onCycleMedicationStatus(medication.id)}
                      style={({ pressed }) => [
                        styles.markTakenButton,
                        pressed && styles.statusPressed,
                      ]}
                    >
                      <Text style={styles.markTakenButtonText}>Mark taken</Text>
                    </Pressable>
                  )}
                  <Pressable
                    accessibilityLabel={`View details for ${medication.genericName}`}
                    accessibilityRole="button"
                    onPress={() => setDetailsMedication(medication)}
                    style={({ pressed }) => [
                      styles.detailsButton,
                      pressed && styles.statusPressed,
                    ]}
                  >
                    <Text style={styles.detailsButtonText}>Details</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Delete ${medication.genericName} scheduled dose`}
                    accessibilityRole="button"
                    onPress={() =>
                      Alert.alert(
                        "Delete scheduled dose?",
                        `Remove the ${medication.time} dose of ${medication.genericName}?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => onDeleteMedication(medication.id),
                          },
                        ],
                      )
                    }
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && styles.statusPressed,
                    ]}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          {selectedMedications.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>✚</Text>
              <Text style={styles.emptyStateTitle}>Nothing scheduled</Text>
              <Text style={styles.emptyStateText}>
                No medications have been added for this day yet.
              </Text>
              <Pressable
                accessibilityLabel={`Add medication for ${selectedDateLabel}`}
                accessibilityRole="button"
                onPress={() => setIsAddMedicationVisible(true)}
                style={({ pressed }) => [styles.addButton, pressed && styles.statusPressed]}
              >
                <Text style={styles.addButtonText}>Add medication</Text>
                <Text style={styles.addButtonIcon}>+</Text>
              </Pressable>
            </View>
          )}
        </View>
        <Modal
          animationType="fade"
          onRequestClose={() => setIsCalendarVisible(false)}
          transparent
          visible={isCalendarVisible}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              accessibilityLabel="Close date picker"
              accessibilityRole="button"
              onPress={() => setIsCalendarVisible(false)}
              style={styles.modalBackdrop}
            />
            <View style={styles.calendarModal}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalKicker}>SELECT A DAY</Text>
                  <Text style={styles.modalTitle}>Your schedule</Text>
                </View>
                <Pressable
                  accessibilityLabel="Close date picker"
                  accessibilityRole="button"
                  onPress={() => setIsCalendarVisible(false)}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.calendarButtonPressed,
                  ]}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </Pressable>
              </View>
              <View style={styles.monthHeader}>
                <Pressable
                  accessibilityLabel="Previous month"
                  accessibilityRole="button"
                  onPress={() => changeMonth(-1)}
                  style={styles.monthArrow}
                >
                  <Text style={styles.monthArrowText}>‹</Text>
                </Pressable>
                <Text style={styles.modalMonth}>
                  {calendarMonth.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <Pressable
                  accessibilityLabel="Next month"
                  accessibilityRole="button"
                  onPress={() => changeMonth(1)}
                  style={styles.monthArrow}
                >
                  <Text style={styles.monthArrowText}>›</Text>
                </Pressable>
              </View>
              <View style={styles.weekdayRow}>
                {weekdays.map((weekday) => (
                  <Text key={weekday} style={styles.weekdayLabel}>
                    {weekday.slice(0, 2)}
                  </Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {calendarCells.map((date, index) => {
                  if (!date) {
                    return <View key={`empty-${index}`} style={styles.calendarCell} />;
                  }

                  const isActive = getDateKey(date) === selectedDateKey;
                  const summary = getDaySummary(date);
                  const label = date.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  });

                  return (
                    <Pressable
                      accessibilityLabel={`Select ${label}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      key={getDateKey(date)}
                      onPress={() => {
                        setSelectedDate(date);
                        setIsCalendarVisible(false);
                      }}
                      style={({ pressed }) => [
                        styles.calendarCell,
                        isActive && styles.calendarCellActive,
                        pressed && styles.modalDateOptionPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayNumber,
                          isActive && styles.calendarDayNumberActive,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {summary.hasScheduled && (
                        <View
                          style={[
                            styles.calendarDayMarker,
                            summary.hasMissed
                              ? styles.calendarDayMarkerMissed
                              : summary.allTaken
                                ? styles.calendarDayMarkerTaken
                                : styles.calendarDayMarkerUpcoming,
                          ]}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                accessibilityLabel="Keep current date"
                accessibilityRole="button"
                onPress={() => setIsCalendarVisible(false)}
                style={({ pressed }) => [
                  styles.doneButton,
                  pressed && styles.doneButtonPressed,
                ]}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <AddMedicationModal
          key={editingMedication?.id ?? "new-medication"}
          date={selectedDate}
          onClose={() => setIsAddMedicationVisible(false)}
          onSubmit={(medication) => onAddMedication(selectedDate, medication)}
          visible={isAddMedicationVisible}
        />
        <MedicationDetailsModal
          medication={detailsMedication}
          onClose={() => setDetailsMedication(null)}
          onEdit={(medication) => {
            setDetailsMedication(null);
            setEditingMedication(medication);
          }}
        />
        <AddMedicationModal
          date={selectedDate}
          medication={editingMedication}
          onClose={() => setEditingMedication(null)}
          onSubmit={(updated) => {
            if (editingMedication) onUpdateMedication(editingMedication.id, updated);
          }}
          visible={editingMedication !== null}
        />
      </ScrollView>
    </PageBackdrop>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    paddingTop: 24,
  },
  hero: {
    alignItems: "flex-end",
    backgroundColor: colors.primary,
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    minHeight: 218,
    overflow: "hidden",
    padding: 16,
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    ...typography.heading,
    color: colors.background,
    fontSize: 38,
    lineHeight: 41,
    marginTop: 14,
  },
  heroDescription: {
    color: "#DCE5FF",
    fontSize: 14,
    marginTop: 14,
  },
  heroBadge: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 38,
    height: 76,
    justifyContent: "center",
    marginLeft: 12,
    width: 76,
  },
  heroBadgeNumber: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 28,
  },
  heroBadgeLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  dateRail: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 34,
    paddingHorizontal: 6,
    paddingVertical: 9,
  },
  dateItem: {
    alignItems: "center",
    borderRadius: 15,
    justifyContent: "center",
    minWidth: 48,
    paddingVertical: 8,
  },
  dateItemActive: {
    backgroundColor: colors.primary,
  },
  dateItemPressed: {
    opacity: 0.72,
  },
  dateLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dateLabelActive: {
    color: colors.background,
  },
  dateNumber: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 3,
  },
  dateNumberActive: {
    color: colors.surface,
  },
  dateDot: {
    backgroundColor: colors.accent,
    borderRadius: 3,
    height: 5,
    marginTop: 4,
    width: 5,
  },
  dateStatusDot: {
    borderRadius: 3,
    height: 5,
    marginTop: 4,
    width: 5,
  },
  dateStatusDotMissed: {
    backgroundColor: colors.accent,
  },
  dateStatusDotTaken: {
    backgroundColor: colors.primary,
  },
  dateStatusDotUpcoming: {
    backgroundColor: colors.secondary,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    marginLeft: 8,
  },
  addHeaderButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 11,
  },
  addHeaderButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
    fontSize: 27,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 5,
  },
  calendarButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 14,
    justifyContent: "center",
    marginLeft: 12,
    minHeight: 50,
    paddingHorizontal: 10,
  },
  calendarIcon: {
    color: colors.primary,
    fontSize: 16,
  },
  calendarLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  calendarButtonPressed: {
    opacity: 0.75,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(36, 52, 94, 0.42)",
  },
  calendarModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalKicker: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  modalTitle: {
    ...typography.heading,
    color: colors.text,
    fontSize: 26,
    marginTop: 5,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  closeButtonText: {
    color: colors.primary,
    fontSize: 25,
    fontWeight: "400",
    lineHeight: 28,
  },
  monthHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  modalMonth: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  monthArrow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  monthArrowText: {
    color: colors.primary,
    fontSize: 25,
    lineHeight: 28,
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  weekdayLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    width: "14.28%",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  calendarCell: {
    alignItems: "center",
    borderRadius: 16,
    height: 44,
    justifyContent: "center",
    width: "14.28%",
  },
  calendarCellActive: {
    backgroundColor: colors.primary,
  },
  calendarDayNumber: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  calendarDayNumberActive: {
    color: colors.background,
  },
  calendarDayMarker: {
    borderRadius: 2,
    height: 3,
    marginTop: 3,
    width: 18,
  },
  calendarDayMarkerMissed: {
    backgroundColor: colors.accent,
  },
  calendarDayMarkerTaken: {
    backgroundColor: colors.primary,
  },
  calendarDayMarkerUpcoming: {
    backgroundColor: colors.secondary,
  },
  modalDateList: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  modalDateOption: {
    alignItems: "center",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 76,
    minWidth: 54,
    paddingVertical: 9,
  },
  modalDateOptionActive: {
    backgroundColor: colors.primary,
  },
  modalDateOptionPressed: {
    opacity: 0.7,
  },
  modalDateLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modalDateLabelActive: {
    color: colors.background,
  },
  modalDateNumber: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "800",
    marginTop: 4,
  },
  modalDateNumberActive: {
    color: colors.surface,
  },
  modalDateDot: {
    backgroundColor: colors.accent,
    borderRadius: 3,
    height: 5,
    marginTop: 4,
    width: 5,
  },
  doneButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: "center",
    marginTop: 24,
    minHeight: 50,
  },
  doneButtonPressed: {
    opacity: 0.8,
  },
  doneButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "800",
  },
  doseList: {
    paddingBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  emptyStateIcon: {
    color: colors.accent,
    fontSize: 24,
  },
  emptyStateTitle: {
    ...typography.heading,
    color: colors.text,
    fontSize: 18,
    marginTop: 10,
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  addButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
    minHeight: 48,
    paddingHorizontal: 20,
    width: "100%",
  },
  addButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "800",
  },
  addButtonIcon: {
    color: colors.accent,
    fontSize: 21,
    marginLeft: 8,
  },
  timeColumn: {
    alignItems: "flex-end",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexShrink: 0,
    justifyContent: "center",
    minHeight: 60,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 92,
  },
  time: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
    textAlign: "right",
  },
  timeLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 4,
  },
  timeHint: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginTop: 3,
  },
  cardDivider: {
    backgroundColor: colors.border,
    height: 52,
    marginHorizontal: 10,
    width: 1,
  },
  doseCard: {
    alignItems: "center",
    flexDirection: "row",
    borderRadius: 18,
    marginBottom: 16,
    minHeight: 118,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  doseCardTaken: {
    backgroundColor: colors.surface,
    borderColor: "#CFE3D5",
    borderWidth: 1,
  },
  doseCardUpcoming: {
    backgroundColor: colors.surface,
    borderColor: "#BBDCEB",
    borderWidth: 1,
  },
  doseCardMissed: {
    backgroundColor: "#FFF8F8",
    borderColor: colors.accent,
    borderWidth: 2,
  },
  doseAccent: {
    alignSelf: "stretch",
    borderRadius: 2,
    marginLeft: -16,
    marginRight: 12,
    width: 4,
  },
  doseAccentUpcoming: {
    backgroundColor: colors.secondary,
  },
  doseAccentTaken: {
    backgroundColor: "#9EE3BB",
  },
  doseAccentMissed: {
    backgroundColor: colors.accent,
  },
  doseDetails: {
    flex: 1,
    minWidth: 0,
  },
  medicationCopy: {
    flex: 1,
    minWidth: 0,
  },
  medicationName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  dosage: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 5,
  },
  actionColumn: {
    alignItems: "stretch",
    flexShrink: 0,
    marginLeft: 8,
    width: 78,
  },
  status: {
    alignItems: "center",
    borderRadius: 10,
    minHeight: 34,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  statusPressed: {
    opacity: 0.72,
  },
  detailsButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 7,
    minHeight: 30,
  },
  detailsButtonText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  statusTaken: {
    backgroundColor: "#DDEFE4",
  },
  statusUpcoming: {
    backgroundColor: colors.primary,
  },
  statusTakenText: {
    color: "#285B3C",
    fontSize: 11,
    fontWeight: "800",
  },
  statusUpcomingText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: "800",
  },
  statusMissed: {
    backgroundColor: colors.accent,
  },
  statusMissedText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },
  markTakenButton: {
    backgroundColor: "#FFE2E7",
    borderColor: colors.accent,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 7,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  markTakenButtonText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },
  deleteButton: {
    alignItems: "center",
    borderRadius: 10,
    justifyContent: "center",
    marginTop: 6,
    minHeight: 26,
  },
  deleteButtonText: {
    color: "#B5485A",
    fontSize: 10,
    fontWeight: "800",
  },
});
