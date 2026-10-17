import { ScrollView, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>This section is coming next.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 8,
  },
});
