import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';

export type PageBackdropVariant = 'dashboard' | 'schedule' | 'chat' | 'history' | 'neutral';

type PageBackdropProps = {
  children: React.ReactNode;
  variant?: PageBackdropVariant;
};

export function PageBackdrop({ children, variant = 'neutral' }: PageBackdropProps) {
  const [motion] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, { duration: 7000, toValue: 1, useNativeDriver: true }),
        Animated.timing(motion, { duration: 7000, toValue: 0, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [motion]);

  const palette = palettes[variant];

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.canvas}>
        <Animated.View
          style={[
            styles.shape,
            styles.shapeOne,
            { backgroundColor: palette.primary },
            {
              transform: [
                { rotate: palette.rotateOne },
                { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [-10, 12] }) },
                { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [5, -8] }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.shape,
            styles.shapeTwo,
            { backgroundColor: palette.secondary },
            {
              transform: [
                { rotate: palette.rotateTwo },
                { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [10, -12] }) },
                { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [-5, 8] }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.shape,
            styles.shapeThree,
            { backgroundColor: palette.accent },
            {
              transform: [
                { rotate: palette.rotateThree },
                { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [-6, 9] }) },
              ],
            },
          ]}
        />
        <View style={[styles.detail, styles.detailOne, { backgroundColor: palette.detail }]} />
        <View style={[styles.detail, styles.detailTwo, { backgroundColor: palette.detail }]} />
        <View style={[styles.detail, styles.detailThree, { backgroundColor: palette.detail }]} />
        {variant === 'history' && (
          <>
            <View style={[styles.pill, styles.pillOne, { backgroundColor: palette.detail }]} />
            <View style={[styles.pill, styles.pillTwo, { backgroundColor: palette.accent }]} />
            <View style={[styles.pill, styles.pillThree, { backgroundColor: palette.secondary }]} />
          </>
        )}
        {variant === 'schedule' && (
          <View style={styles.scheduleRing}>
            <View style={[styles.scheduleRingInner, { borderColor: palette.detail }]} />
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

const palettes: Record<PageBackdropVariant, {
  primary: string;
  secondary: string;
  accent: string;
  detail: string;
  rotateOne: string;
  rotateTwo: string;
  rotateThree: string;
}> = {
  dashboard: {
    primary: '#D7E8F0',
    secondary: '#DCD8F4',
    accent: '#F4D4DA',
    detail: '#8CB4C9',
    rotateOne: '-22deg',
    rotateTwo: '28deg',
    rotateThree: '14deg',
  },
  schedule: {
    primary: '#F3D5C7',
    secondary: '#D5E9D8',
    accent: '#DDD8F5',
    detail: '#B8A7CE',
    rotateOne: '-34deg',
    rotateTwo: '24deg',
    rotateThree: '18deg',
  },
  chat: {
    primary: '#D4E5F4',
    secondary: '#DAD8F3',
    accent: '#E7D7EC',
    detail: '#91AFCF',
    rotateOne: '-18deg',
    rotateTwo: '32deg',
    rotateThree: '20deg',
  },
  history: {
    primary: '#D9D4F0',
    secondary: '#CBE9E9',
    accent: '#F3CAD5',
    detail: '#A8A7D1',
    rotateOne: '-24deg',
    rotateTwo: '28deg',
    rotateThree: '18deg',
  },
  neutral: {
    primary: '#E3DDF2',
    secondary: '#D7E9E4',
    accent: '#F0D8DE',
    detail: '#A8A7D1',
    rotateOne: '-24deg',
    rotateTwo: '28deg',
    rotateThree: '18deg',
  },
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  canvas: { ...StyleSheet.absoluteFill },
  shape: { borderRadius: 90, height: 180, opacity: 0.48, position: 'absolute', width: 300 },
  shapeOne: { left: -150, top: 120 },
  shapeTwo: { right: -170, top: 400 },
  shapeThree: { left: -170, top: 760 },
  detail: { borderRadius: 5, height: 10, opacity: 0.24, position: 'absolute', width: 10 },
  detailOne: { right: 28, top: 220 },
  detailTwo: { left: 27, top: 560 },
  detailThree: { right: 62, top: 920 },
  pill: { borderRadius: 20, height: 17, opacity: 0.28, position: 'absolute', width: 62 },
  pillOne: { right: 46, top: 270, transform: [{ rotate: '28deg' }] },
  pillTwo: { left: 26, top: 675, transform: [{ rotate: '-34deg' }] },
  pillThree: { right: 50, top: 990, transform: [{ rotate: '22deg' }] },
  scheduleRing: { borderColor: '#C6A9B7', borderRadius: 74, borderWidth: 1, height: 148, opacity: 0.2, position: 'absolute', right: -38, top: 170, width: 148 },
  scheduleRingInner: { borderRadius: 52, borderWidth: 1, height: 104, left: 21, position: 'absolute', top: 21, width: 104 },
});
