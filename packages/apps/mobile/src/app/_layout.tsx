import { DefaultTheme, ThemeProvider } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StatusBar } from 'expo-status-bar';

import { colors } from '../theme/colors';
import { MedicationProvider } from '../context/MedicationContext';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  return (
    <MedicationProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="dark" />
        <NativeTabs
          tintColor={colors.primary}
          backgroundColor={colors.surface}
          iconColor={{ default: colors.textMuted, selected: colors.primary }}
          labelStyle={{
            default: { color: colors.textMuted },
            selected: { color: colors.primary },
          }}
          minimizeBehavior="never"
        >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="schedule">
          <NativeTabs.Trigger.Label>Schedule</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="medications">
          <NativeTabs.Trigger.Label>Meds</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'pills', selected: 'pills.fill' }} md="medication" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="history">
          <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="clock.arrow.circlepath" md="history" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        </NativeTabs.Trigger>
        </NativeTabs>
      </ThemeProvider>
    </MedicationProvider>
  );
}
