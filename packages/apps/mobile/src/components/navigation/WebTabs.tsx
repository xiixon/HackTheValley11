import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors } from '../../theme/colors';

const tabs = [
  ['index', 'Today', '⌂'], ['schedule', 'Schedule', '▦'], ['vending', 'Vending', '▦'],
  ['chat', 'IntelliMed', '✦'], ['history', 'History', '◷'],
] as const;

// Keep the browser's bottom bar clear of the shared top-right profile button.
export function WebTabs({ signedIn }: { signedIn: boolean }) {
  return (
    <Tabs screenOptions={{
      headerShown: false, tabBarHideOnKeyboard: true,
      tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarStyle: signedIn ? { backgroundColor: colors.surface, height: 64 } : { display: 'none' },
    }}>
      <Tabs.Protected guard={!signedIn}>
        <Tabs.Screen name="login" options={{ title: 'Sign in' }} />
      </Tabs.Protected>
      <Tabs.Protected guard={signedIn}>
        {tabs.map(([name, title, icon]) => (
          <Tabs.Screen key={name} name={name} options={{ title,
            tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>{icon}</Text>,
          }} />
        ))}
      </Tabs.Protected>
    </Tabs>
  );
}
