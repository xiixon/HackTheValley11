import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import React, { useState } from "react";

import { Medication } from "../../types/medication";
import { colors } from "../../theme/colors";

type ScheduleProps = {
  medicationsByDate: Record<string, Medication[]>;
};

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function Schedule({ medicationsByDate }: ScheduleProps) {
  const [now] = useState(() => new Date());
  const [selectedIndex, setSelectedIndex] = useState(2);

  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const dates = Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index - 2);
    return date;
  });

  const formattedDates = dates.map((date) => {
    const label = weekdays[date.getDay()];
    const number = date.getDate();

    return `${label} ${number}`;
  });
  const selectedDate = dates[selectedIndex];
  const selectedDateKey = getDateKey(selectedDate);
  const selectedMedications = medicationsByDate[selectedDateKey] ?? [];
  const selectedDateLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>
            {now.toLocaleDateString(undefined, {
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
          <Text style={styles.heroBadgeNumber}>{selectedMedications.length}</Text>
          <Text style={styles.heroBadgeLabel}>doses</Text>
        </View>
      </View>

      <View style={styles.dateRail}>
        {formattedDates.map((day, index) => {
          const [label, number] = day.split(" ");
          const isActive = index === selectedIndex;

          return (
            <Pressable
              accessibilityLabel={`Select ${label} ${number}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              key={day}
              onPress={() => setSelectedIndex(index)}
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
              {isActive && <View style={styles.dateDot} />}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Scheduled doses</Text>
          <Text style={styles.sectionSubtitle}>{selectedDateLabel}</Text>
        </View>
        {/* TODO: Connect this control to a calendar modal or date picker. */}
        <View style={styles.calendarButton}>
          <Text style={styles.calendarIcon}>▣</Text>
          <Text style={styles.calendarLabel}>Change day</Text>
        </View>
      </View>

      {/* TODO: Add dose actions here when schedule editing and completion logic are ready. */}
      <View style={styles.doseList}>
        {selectedMedications.map((medication) => {
          const isTaken = medication.status === "taken";

          return (
            <View
              key={medication.id}
              style={[
                styles.doseCard,
                isTaken ? styles.doseCardTaken : styles.doseCardUpcoming,
              ]}
            >
              <View style={styles.timeColumn}>
                <Text style={styles.time}>{medication.time}</Text>
                <Text style={styles.timeLabel}>
                  {isTaken ? "DONE" : "NEXT"}
                </Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.doseDetails}>
                <View
                  style={[
                    styles.medicationDot,
                    { backgroundColor: medication.color },
                  ]}
                />
                <View style={styles.medicationCopy}>
                  <Text style={styles.medicationName}>{medication.name}</Text>
                  <Text style={styles.dosage}>{medication.dosage}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.status,
                  isTaken ? styles.statusTaken : styles.statusUpcoming,
                ]}
              >
                <Text
                  style={
                    isTaken ? styles.statusTakenText : styles.statusUpcomingText
                  }
                >
                  {isTaken ? "Taken" : "Upcoming"}
                </Text>
              </View>
            </View>
          );
        })}
        {selectedMedications.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>✦</Text>
            <Text style={styles.emptyStateTitle}>Nothing scheduled</Text>
            <Text style={styles.emptyStateText}>
              No medications have been added for this day yet.
            </Text>
            {/* TODO: Add an action to create a medication schedule for this date. */}
          </View>
        )}
      </View>
    </ScrollView>
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
    color: colors.background,
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1.5,
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
    color: colors.primary,
    fontSize: 28,
    fontWeight: "800",
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
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.7,
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
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
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
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 10,
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  timeColumn: {
    alignItems: "flex-end",
    justifyContent: "center",
    width: 78,
  },
  time: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: "800",
  },
  timeLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 5,
  },
  cardDivider: {
    backgroundColor: colors.border,
    height: 48,
    marginHorizontal: 16,
    width: 1,
  },
  doseCard: {
    alignItems: "center",
    flexDirection: "row",
    borderRadius: 24,
    marginBottom: 16,
    minHeight: 118,
    padding: 20,
  },
  doseCardTaken: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  doseCardUpcoming: {
    backgroundColor: colors.secondary,
  },
  medicationDot: {
    borderRadius: 8,
    height: 18,
    width: 18,
  },
  doseDetails: {
    flex: 1,
    flexDirection: "row",
    marginLeft: 16,
  },
  medicationCopy: {
    flex: 1,
    marginLeft: 11,
  },
  medicationName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  dosage: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  status: {
    borderRadius: 12,
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusTaken: {
    backgroundColor: colors.successSurface,
  },
  statusUpcoming: {
    backgroundColor: colors.background,
  },
  statusTakenText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  statusUpcomingText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
});
