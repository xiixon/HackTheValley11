import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme/colors';
import { PillBackground } from '../components/PillBackground';
import { typography } from '../theme/typography';

export function ProfileScreen() {
  const { session, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  if (!session) return null;
  const { user } = session;
  return (
    <PillBackground>
      <ScrollView contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, Platform.OS === 'android' && { paddingTop: insets.top + 28 }]}>
        <Text accessibilityRole="header" style={styles.title}>Your profile</Text>
        <View style={styles.card}>
          <View style={styles.avatar}><Text style={styles.initials}>{user.firstName[0]}{user.lastName[0]}</Text></View>
          <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>Signed in</Text></View>
        </View>
        <Pressable accessibilityRole="button" onPress={signOut}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.6 }]}>
          <Text style={styles.buttonText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </PillBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 24 },
  title: { ...typography.heading, color: colors.text, fontSize: 30 },
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: 28, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 12 },
  avatar: { width: 72, height: 72, backgroundColor: colors.primary, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  initials: { color: colors.surface, fontSize: 26, fontWeight: '700' },
  name: { ...typography.heading, color: colors.text, fontSize: 24, textAlign: 'center' },
  email: { color: colors.textMuted, fontSize: 16, textAlign: 'center' },
  badge: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.successSurface },
  badgeText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  button: { borderWidth: 1, borderColor: colors.primary, borderRadius: 14, padding: 16, minHeight: 54, alignItems: 'center' },
  buttonText: { color: colors.primary, fontSize: 17, fontWeight: '600' },
});
