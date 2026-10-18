import { DefaultTheme, ThemeProvider } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';

import { AuthProvider, useAuth } from '../auth/AuthContext';
import { ProfileMenu } from '../components/navigation/ProfileMenu';
import { WebTabs } from '../components/navigation/WebTabs';
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
      <View style={{ flex: 1 }}>
        {signedIn && <ProfileMenu />}
        {Platform.OS === 'web' ? <WebTabs signedIn={signedIn} /> : <NativeTabs
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
          <NativeTabs.Trigger name="chat" hidden={!signedIn} disableAutomaticContentInsets>
            <NativeTabs.Trigger.Label>IntelliMed</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right" md="chat" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="history" hidden={!signedIn}>
            <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="clock.arrow.circlepath" md="history" />
          </NativeTabs.Trigger>
        </NativeTabs>}
      </View>
    </MedicationProvider>
  );
}
