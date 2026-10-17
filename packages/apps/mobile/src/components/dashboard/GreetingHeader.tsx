import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';

interface GreetingHeaderProps {
  name: string;
  subtitle?: string;
}

function getGreeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function GreetingHeader({ name, subtitle = "Let's keep your routine on track." } : GreetingHeaderProps) {
  const now = new Date();
  const date = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{getGreeting(now.getHours())}, { name }</Text>
      <Text style={styles.date}>{date}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 32,
  },
  greeting: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 40,
  },
  date: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 12,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    marginTop: 6,
  },
});
