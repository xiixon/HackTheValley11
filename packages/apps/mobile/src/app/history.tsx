import { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useMedications } from '../context/MedicationContext';
import { PageBackdrop } from '../components/navigation/PageBackdrop';
import { Clickable } from '../components/ui/Clickable';
import { colors } from '../theme/colors';
import { getMedicationDisplayStatus, Medication } from '../types/medication';

type AdherenceStatus = 'on-time' | 'late' | 'missed';
type DateRange = 'all' | '7' | '30';

type HistoryEntry = {
  medication: Medication;
  date: Date;
  adherence: AdherenceStatus;
  notes: string;
};

const statusCopy: Record<AdherenceStatus, { label: string; color: string; background: string; icon: string }> = {
  'on-time': { label: 'On time', color: '#287A62', background: '#E4F5EE', icon: '✓' },
  late: { label: 'Late', color: '#9A681E', background: '#FFF1D5', icon: '◷' },
  missed: { label: 'Missed', color: '#A84E5E', background: '#FFE4E8', icon: '!' },
};

function parseScheduledDate(medication: Medication) {
  if (!medication.scheduledDate) return null;
  const [year, month, day] = medication.scheduledDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const timeMatch = medication.time.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!timeMatch) return date;

  let hour = Number(timeMatch[1]);
  if (hour === 12) hour = 0;
  if (timeMatch[3].toUpperCase() === 'PM') hour += 12;
  date.setHours(hour, Number(timeMatch[2] ?? 0), 0, 0);
  return date;
}

function getAdherence(medication: Medication, scheduledDate: Date): AdherenceStatus {
  if (getMedicationDisplayStatus(medication) === 'missed') return 'missed';
  if (!medication.takenAt) return 'on-time';
  return new Date(medication.takenAt).getTime() > scheduledDate.getTime() ? 'late' : 'on-time';
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatRecordedTime(medication: Medication) {
  if (!medication.takenAt) return medication.time;
  return new Date(medication.takenAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function csvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function HistoryScreen() {
  const { medicationsByDate } = useMedications();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All medications');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const entries = useMemo<HistoryEntry[]>(() => {
    const now = new Date();
    return Object.values(medicationsByDate)
      .flatMap((medications) =>
        medications.flatMap((medication) => {
          const date = parseScheduledDate(medication);
          if (!date || date > now || medication.status === 'upcoming') return [];
          return [{
            medication,
            date,
            adherence: getAdherence(medication, date),
            notes: medication.notes?.trim() || 'No notes added for this dose.',
          }];
        }),
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [medicationsByDate]);

  const medicationTypes = useMemo(
    () => ['All medications', ...new Set(entries.map(({ medication }) => medication.genericName))],
    [entries],
  );

  const filteredEntries = useMemo(() => {
    const now = new Date();
    const cutoff = dateRange === 'all' ? null : new Date(now.getTime() - Number(dateRange) * 24 * 60 * 60 * 1000);
    const normalizedQuery = query.trim().toLowerCase();

    return entries.filter(({ medication, date, notes }) => {
      const searchable = `${medication.genericName} ${medication.brandName} ${notes}`.toLowerCase();
      return (
        (selectedType === 'All medications' || medication.genericName === selectedType) &&
        (!cutoff || date >= cutoff) &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });
  }, [dateRange, entries, query, selectedType]);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, HistoryEntry[]>();
    filteredEntries.forEach((entry) => {
      const key = entry.medication.scheduledDate ?? entry.date.toISOString();
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    });
    return [...groups.entries()];
  }, [filteredEntries]);

  const exportCsv = async () => {
    const header = 'Date,Time,Medication,Dose,Adherence,Notes';
    const rows = filteredEntries.map(({ medication, date, adherence, notes }) =>
      [date.toLocaleDateString(), formatRecordedTime(medication), medication.genericName, medication.dosage, statusCopy[adherence].label, notes]
        .map(csvValue)
        .join(','),
    );
    const csv = [header, ...rows].join('\n');

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
      link.download = 'intellimed-history.csv';
      link.click();
      setExportMessage('CSV downloaded');
      return;
    }

    await Share.share({ message: csv, title: 'IntelliMed history' });
    setExportMessage('History ready to share');
  };

  return (
    <PageBackdrop variant="history">
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.headerRow}>
        <View pointerEvents="none" style={styles.headerPattern}>
          <View style={[styles.patternPill, styles.patternPillOne]} />
          <View style={[styles.patternPill, styles.patternPillTwo]} />
          <View style={[styles.patternPill, styles.patternPillThree]} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>YOUR CARE JOURNAL</Text>
          <Text style={styles.title}>Dose history</Text>
          <Text style={styles.subtitle}>A clear record of your medication routine.</Text>
        </View>
        <Clickable
          accessibilityLabel="Learn about dose history"
          accessibilityRole="button"
          onPress={() => setHelpVisible((visible) => !visible)}
          style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}
        >
          <Text style={styles.helpText}>?</Text>
        </Clickable>
      </View>

      {helpVisible && (
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>How history works</Text>
          <Text style={styles.helpBody}>
            Taken doses are compared with their scheduled time. Missed doses stay visible so you and your care team can spot patterns.
          </Text>
        </View>
      )}

      <View style={styles.summaryCard}>
        <View pointerEvents="none" style={styles.summaryPattern}>
          <View style={[styles.summaryPill, styles.summaryPillOne]} />
          <View style={[styles.summaryPill, styles.summaryPillTwo]} />
          <View style={[styles.summaryPill, styles.summaryPillThree]} />
        </View>
        <View>
          <Text style={styles.summaryLabel}>SHOWING</Text>
          <Text style={styles.summaryValue}>{filteredEntries.length} recorded doses</Text>
        </View>
        <Clickable
          accessibilityLabel="Export filtered dose history as CSV"
          accessibilityRole="button"
          onPress={exportCsv}
          style={({ pressed }) => [styles.exportButton, pressed && styles.pressed]}
        >
          <Text style={styles.exportIcon}>↓</Text>
          <Text style={styles.exportText}>Export CSV</Text>
        </Clickable>
      </View>
      {!!exportMessage && <Text style={styles.exportMessage}>{exportMessage}</Text>}

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          accessibilityLabel="Search history notes and medications"
          onChangeText={setQuery}
          placeholder="Search notes or medications"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          value={query}
        />
        {!!query && (
          <Clickable accessibilityLabel="Clear search" accessibilityRole="button" onPress={() => setQuery('')}>
            <Text style={styles.clearText}>×</Text>
          </Clickable>
        )}
      </View>

      <Text style={styles.filterLabel}>MEDICATION</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {medicationTypes.map((type) => (
          <Clickable
            accessibilityRole="button"
            accessibilityState={{ selected: selectedType === type }}
            key={type}
            onPress={() => setSelectedType(type)}
            style={[styles.chip, selectedType === type && styles.activeChip]}
          >
            <Text style={[styles.chipText, selectedType === type && styles.activeChipText]}>{type}</Text>
          </Clickable>
        ))}
      </ScrollView>

      <Text style={styles.filterLabel}>DATE RANGE</Text>
      <View style={styles.rangeRow}>
        {([['all', 'All time'], ['7', 'Last 7 days'], ['30', 'Last 30 days']] as const).map(([value, label]) => (
          <Clickable
            accessibilityRole="button"
            accessibilityState={{ selected: dateRange === value }}
            key={value}
            onPress={() => setDateRange(value)}
            style={[styles.rangeButton, dateRange === value && styles.activeRangeButton]}
          >
            <Text style={[styles.rangeText, dateRange === value && styles.activeRangeText]}>{label}</Text>
          </Clickable>
        ))}
      </View>

      <View style={styles.timelineHeader}>
        <Text style={styles.sectionTitle}>Your timeline</Text>
        <View style={styles.legend}>
          <Text style={styles.legendText}>✓ On time</Text>
          <Text style={styles.legendText}>◷ Late</Text>
          <Text style={styles.legendText}>! Missed</Text>
        </View>
      </View>

      {groupedEntries.length ? groupedEntries.map(([dateKey, group]) => (
        <View key={dateKey} style={styles.dayGroup}>
          <Text style={styles.dateHeading}>{formatDate(group[0].date)}</Text>
          {group.map(({ medication, date, adherence, notes }) => {
            const status = statusCopy[adherence];
            const isExpanded = expandedId === medication.id;
            return (
              <Clickable
                accessibilityLabel={`${medication.genericName}, ${status.label}. ${isExpanded ? 'Collapse' : 'Expand'} details`}
                accessibilityRole="button"
                key={medication.id}
                onPress={() => setExpandedId(isExpanded ? null : medication.id)}
                style={({ pressed }) => [styles.entryCard, pressed && styles.entryPressed]}
              >
                <View style={[styles.timelineDot, { backgroundColor: medication.color }]} />
                <View style={styles.entryContent}>
                  <View style={styles.entryTopRow}>
                    <Text style={styles.entryTime}>{formatRecordedTime(medication)}</Text>
                    <View style={[styles.statusPill, { backgroundColor: status.background }]}>
                      <Text style={[styles.statusIcon, { color: status.color }]}>{status.icon}</Text>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.medicationName}>{medication.genericName}</Text>
                  <Text style={styles.dosage}>{medication.dosage}</Text>
                  {isExpanded ? (
                    <View style={styles.expandedDetails}>
                      <Text style={styles.detailLabel}>NOTE</Text>
                      <Text style={styles.notes}>{notes}</Text>
                      <Text style={styles.detailLabel}>SCHEDULED</Text>
                      <Text style={styles.scheduled}>{medication.time}</Text>
                    </View>
                  ) : (
                    <Text numberOfLines={1} style={styles.previewNote}>{notes}</Text>
                  )}
                  <Text style={styles.detailsHint}>{isExpanded ? 'Hide details' : 'View details'} {isExpanded ? '⌃' : '⌄'}</Text>
                </View>
              </Clickable>
            );
          })}
        </View>
      )) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⌕</Text>
          <Text style={styles.emptyTitle}>No matching doses</Text>
          <Text style={styles.emptyText}>Try a different medication, date range, or keyword.</Text>
        </View>
      )}
      </ScrollView>
    </PageBackdrop>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 42, position: 'relative' },
  headerRow: { alignItems: 'flex-start', borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', overflow: 'hidden', padding: 16, position: 'relative' },
  headerPattern: { ...StyleSheet.absoluteFill, backgroundColor: '#F4F0FF' },
  patternPill: { borderRadius: 20, height: 15, position: 'absolute', transform: [{ rotate: '-32deg' }], width: 48 },
  patternPillOne: { backgroundColor: '#DDD8F5', right: 55, top: -2 },
  patternPillTwo: { backgroundColor: '#F7CDD8', right: -8, top: 33, transform: [{ rotate: '40deg' }] },
  patternPillThree: { backgroundColor: '#D1EAF1', right: 84, top: 66, transform: [{ rotate: '25deg' }] },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  title: { color: colors.primary, fontSize: 32, fontWeight: '900', marginTop: 6 },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  helpButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, height: 36, justifyContent: 'center', marginLeft: 14, width: 36 },
  helpText: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  helpCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, marginTop: 14, padding: 15 },
  helpTitle: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  helpBody: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  summaryCard: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, overflow: 'hidden', padding: 18, position: 'relative' },
  summaryPattern: { ...StyleSheet.absoluteFill },
  summaryPill: { borderRadius: 20, height: 17, opacity: 0.18, position: 'absolute', width: 58 },
  summaryPillOne: { backgroundColor: '#FFFFFF', right: 116, top: -5, transform: [{ rotate: '28deg' }] },
  summaryPillTwo: { backgroundColor: '#FFB4C2', right: 16, top: 8, transform: [{ rotate: '-38deg' }] },
  summaryPillThree: { backgroundColor: '#9BE0E3', bottom: -4, right: 58, transform: [{ rotate: '26deg' }] },
  summaryLabel: { color: '#C8D4F7', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  summaryValue: { color: colors.surface, fontSize: 18, fontWeight: '800', marginTop: 4 },
  exportButton: { alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, flexDirection: 'row', minHeight: 42, paddingHorizontal: 12 },
  exportIcon: { color: colors.primary, fontSize: 19, fontWeight: '800', marginRight: 5 },
  exportText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  exportMessage: { color: '#287A62', fontSize: 12, fontWeight: '700', marginTop: 7, textAlign: 'right' },
  searchBox: { alignItems: 'center', backgroundColor: '#FFFCF4', borderColor: '#E2D6B8', borderRadius: 15, borderWidth: 1, flexDirection: 'row', marginTop: 18, minHeight: 50, paddingHorizontal: 14 },
  searchIcon: { color: colors.primary, fontSize: 25, marginRight: 8 },
  searchInput: { color: colors.text, flex: 1, fontSize: 14, minHeight: 48 },
  clearText: { color: colors.textMuted, fontSize: 22, paddingLeft: 8 },
  filterLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 8, marginTop: 18 },
  chipScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  chip: { backgroundColor: '#FFFDF8', borderColor: colors.border, borderRadius: 16, borderWidth: 1, marginRight: 8, paddingHorizontal: 13, paddingVertical: 9 },
  activeChip: { backgroundColor: '#C8EAF0', borderColor: '#9FD7E1' },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  activeChipText: { color: colors.primary },
  rangeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rangeButton: { backgroundColor: '#FFFDF8', borderColor: colors.border, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  activeRangeButton: { backgroundColor: '#E4E0F6', borderColor: '#8C8AC2' },
  rangeText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  activeRangeText: { color: colors.primary },
  timelineHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  sectionTitle: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  legend: { alignItems: 'flex-end' },
  legendText: { color: colors.textMuted, fontSize: 10, lineHeight: 16 },
  dayGroup: { marginTop: 18 },
  dateHeading: { color: colors.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 9 },
  entryCard: { backgroundColor: '#FFFDF9', borderColor: '#E8DEC5', borderRadius: 18, borderWidth: 1, flexDirection: 'row', marginBottom: 10, overflow: 'hidden', padding: 15 },
  entryPressed: { opacity: 0.78 },
  timelineDot: { borderRadius: 7, height: 14, marginRight: 12, marginTop: 3, width: 14 },
  entryContent: { flex: 1 },
  entryTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  entryTime: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  statusPill: { alignItems: 'center', borderRadius: 10, flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 5 },
  statusIcon: { fontSize: 11, fontWeight: '900', marginRight: 4 },
  statusText: { fontSize: 10, fontWeight: '900' },
  medicationName: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 9 },
  dosage: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  previewNote: { color: colors.textMuted, fontSize: 12, marginTop: 10 },
  expandedDetails: { borderTopColor: colors.border, borderTopWidth: 1, marginTop: 12, paddingTop: 11 },
  detailLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 5 },
  notes: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 4 },
  scheduled: { color: colors.text, fontSize: 13, marginTop: 4 },
  detailsHint: { color: colors.primary, fontSize: 10, fontWeight: '900', marginTop: 12, textAlign: 'right' },
  emptyState: { alignItems: 'center', backgroundColor: '#F6F1E4', borderColor: colors.border, borderRadius: 20, borderWidth: 1, marginTop: 18, overflow: 'hidden', padding: 30 },
  emptyIcon: { color: colors.secondary, fontSize: 34 },
  emptyTitle: { color: colors.primary, fontSize: 17, fontWeight: '900', marginTop: 8 },
  emptyText: { color: colors.textMuted, fontSize: 13, marginTop: 5, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
