import { ScrollView, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { PageBackdrop } from '../components/navigation/PageBackdrop';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <PageBackdrop>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>This section is coming next.</Text>
      </ScrollView>
    </PageBackdrop>
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
    ...typography.heading,
    color: colors.primary,
    fontSize: 28,
  },
  description: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 8,
  },
});
