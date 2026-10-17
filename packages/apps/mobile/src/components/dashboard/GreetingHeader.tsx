import { StyleSheet, Text, View } from 'react-native';

function getGreeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function GreetingHeader({ name } : { name: string }) {
  const now = new Date();
  const date = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    // Alex is just a hard coded name for now. Sync to back end later. Or use localstorage.
    <View style={styles.container}>
      <Text style={styles.greeting}>{getGreeting(now.getHours())}, { name }</Text>
      <Text style={styles.date}>{date}</Text>
      <Text style={styles.subtitle}>Let&apos;s keep your routine on track.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 28,
  },
  greeting: {
    color: '#173B35',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 15,
  },
  date: {
    color: '#5F716A',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  subtitle: {
    color: '#80908A',
    fontSize: 15,
    marginTop: 5,
  },
});
