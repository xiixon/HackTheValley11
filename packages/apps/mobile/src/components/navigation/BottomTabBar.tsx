import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';

export type TabName = 'Today' | 'Schedule' | 'Meds' | 'History' | 'Profile';

const tabs: { name: TabName; icon: string }[] = [
  { name: 'Today', icon: '⌂' },
  { name: 'Schedule', icon: '◷' },
  { name: 'Meds', icon: '✚' },
  { name: 'History', icon: '▤' },
  { name: 'Profile', icon: '◯' },
];

type BottomTabBarProps = {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
};

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const isActive = tab.name === activeTab;
        return (
          <Pressable
            accessibilityLabel={`${tab.name} tab`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab.name}
            onPress={() => onTabPress(tab.name)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <Text style={[styles.icon, isActive && styles.activeIcon]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 8,
    paddingTop: 10,
  },
  tab: {
    alignItems: 'center',
    minHeight: 44,
    minWidth: 58,
    paddingHorizontal: 4,
  },
  icon: {
    color: colors.textMuted,
    fontSize: 22,
    height: 25,
  },
  activeIcon: {
    color: colors.primary,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  activeLabel: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.6,
  },
});
