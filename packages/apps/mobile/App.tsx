import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { BottomTabBar, TabName } from './src/components/navigation/BottomTabBar';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { colors } from './src/theme/colors';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('Today');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {activeTab === 'Today' ? (
          <DashboardScreen />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>{activeTab}</Text>
            <Text style={styles.placeholderText}>This section is coming next.</Text>
          </View>
        )}
      </View>
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  placeholderTitle: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 8,
  },
});
