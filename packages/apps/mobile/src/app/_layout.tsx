import { DefaultTheme, ThemeProvider } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '../auth/AuthContext';
import { MedicationProvider } from '../context/MedicationContext';
import { colors } from '../theme/colors';

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
    <AuthProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="dark" />
        <Navigation />
      </ThemeProvider>
    </AuthProvider>
  );
}

function Navigation() {
  const { session } = useAuth();
  const signedIn = !!session;

  return (
    <MedicationProvider key={session?.user.id ?? 'signed-out'}>
      <NativeTabs
        hidden={!signedIn}
        tintColor={colors.primary}
        backgroundColor={colors.surface}
        iconColor={{ default: colors.textMuted, selected: colors.primary }}
        labelStyle={{
          default: { color: colors.textMuted },
          selected: { color: colors.primary },
        }}
        minimizeBehavior="never"
      >
        {/* Hidden native tab routes are excluded from navigation, including direct links. */}
        <NativeTabs.Trigger name="login" hidden={signedIn}>
          <NativeTabs.Trigger.Label>Sign in</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="index" hidden={!signedIn}>
          <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="schedule" hidden={!signedIn}>
          <NativeTabs.Trigger.Label>Schedule</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="medications" hidden={!signedIn}>
          <NativeTabs.Trigger.Label>Meds</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'pills', selected: 'pills.fill' }} md="medication" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="history" hidden={!signedIn}>
          <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="clock.arrow.circlepath" md="history" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile" hidden={!signedIn}>
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </MedicationProvider>
  );
}
