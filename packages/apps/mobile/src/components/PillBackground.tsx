import { memo, useState, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';

const spacing = 88;

const PillPattern = memo(function PillPattern({ width, height }: { width: number; height: number }) {
  const [seed] = useState(() => Math.random() * 10000);
  const columns = Math.ceil(width / spacing) + 1;
  const rows = Math.ceil(height / spacing) + 1;

  // Keep each pill stable while typing, scrolling, or resizing the screen.
  const random = (row: number, column: number, variation: number) => {
    const value = Math.sin(row * 127.1 + column * 311.7 + variation * 74.7 + seed) * 43758.5453;
    return value - Math.floor(value);
  };

  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants" style={styles.pattern}>
      {Array.from({ length: columns * rows }, (_, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;
        return (
          <View key={`${row}-${column}`} style={[styles.pill, {
            left: column * spacing - 12 + random(row, column, 0) * 56,
            top: row * spacing - 12 + random(row, column, 1) * 56,
            opacity: 0.65 + random(row, column, 2) * 0.35,
            transform: [
              { rotate: `${random(row, column, 3) * 360}deg` },
              { scale: 0.8 + random(row, column, 4) * 0.3 },
            ],
          }]}>
            <View style={styles.seam} />
          </View>
        );
      })}
    </View>
  );
});

export function PillBackground({ children }: PropsWithChildren) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View collapsable={false} style={styles.screen} onLayout={({ nativeEvent: { layout } }) => {
      setSize((current) => current.width === layout.width && current.height === layout.height
        ? current : { width: layout.width, height: layout.height });
    }}>
      {children}
      <PillPattern {...size} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, zIndex: 0 },
  pattern: { ...StyleSheet.absoluteFill, overflow: 'hidden', opacity: 0.09, zIndex: -1 },
  pill: {
    position: 'absolute', width: 32, height: 14, borderRadius: 8,
    borderWidth: 1.25, borderColor: colors.primary, alignItems: 'center', overflow: 'hidden',
  },
  seam: { width: 1.25, height: '100%', backgroundColor: colors.primary },
});
