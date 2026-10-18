import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { Clickable } from './Clickable';
import type { DateTimeDialogProps } from './DateTimeDialog.types';

export function DateTimeDialog({ mode, value, onConfirm, onCancel }: DateTimeDialogProps) {
  const [draft, setDraft] = useState(value);
  if (Platform.OS === 'android') {
    return <DateTimePicker mode={mode} value={value} onChange={(event, selected) => {
      if (event.type === 'dismissed' || !selected) onCancel(); else onConfirm(selected);
    }} />;
  }
  return <View style={styles.overlay}>
    <View accessibilityViewIsModal style={styles.card}>
      <View style={styles.toolbar}>
        <Clickable accessibilityRole="button" onPress={onCancel} style={styles.action}><Text style={styles.actionText}>Cancel</Text></Clickable>
        <Text style={styles.title}>{mode === 'date' ? 'Choose date' : 'Choose time'}</Text>
        <Clickable accessibilityRole="button" onPress={() => onConfirm(draft)} style={styles.action}><Text style={styles.actionText}>Done</Text></Clickable>
      </View>
      <DateTimePicker mode={mode} value={draft} display="spinner" themeVariant="light" onChange={(_event, selected) => { if (selected) setDraft(selected); }} />
    </View>
  </View>;
}
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', backgroundColor: 'rgba(36,52,94,0.3)', zIndex: 20 },
  card: { borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.surface, padding: 16, paddingBottom: 30 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontWeight: '600', color: colors.text, fontSize: 16 },
  action: { minHeight: 44, minWidth: 60, justifyContent: 'center', alignItems: 'center' },
  actionText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
});
