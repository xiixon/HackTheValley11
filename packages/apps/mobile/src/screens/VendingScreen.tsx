import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PillBackground } from '../components/PillBackground';
import { useVending } from '../vending/VendingProvider';
import { colors } from '../theme/colors';

export function VendingScreen() {
  const { pass, syncing, error, retry } = useVending();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const qrSize = Math.max(100, Math.min(210, width - 144));
  return (
    <PillBackground>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content,
        Platform.OS === 'android' && { paddingTop: insets.top + 24 }]}>
        <View style={styles.card}>
          {pass ? <>
            <View accessible accessibilityLabel={`Vending QR code. Your code is ${pass.code.split('').join(' ')}.`} style={styles.qr}>
              <QRCode value={pass.qrValue} size={qrSize} color={colors.text} backgroundColor={colors.surface} quietZone={12} />
            </View>
            <Text selectable accessibilityLabel={`Vending code ${pass.code.split('').join(' ')}`} style={styles.code}>{pass.code}</Text>
          </> : <View style={styles.loading}>
            {syncing ? <ActivityIndicator accessibilityLabel="Loading vending pass" color={colors.primary} /> : null}
          </View>}
          <View style={styles.divider} />
          <Text accessibilityRole={error ? 'alert' : undefined} style={[styles.status, !!error && styles.error]}>{syncing ? 'Syncing your schedule…' : error || (pass ? `${pass.doseCount} scheduled doses synced` : 'Connecting to your account')}</Text>
          <Pressable accessibilityRole="button" disabled={syncing} onPress={retry} style={styles.refresh}>
            <Text style={styles.refreshText}>{syncing ? 'Please wait…' : 'Refresh schedule'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </PillBackground>
  );
}
const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 24, paddingBottom: 32, width: '100%', maxWidth: 520, alignSelf: 'center' },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 28, padding: 24, alignItems: 'center', gap: 14 },
  qr: { padding: 4, backgroundColor: colors.surface },
  code: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 32, fontWeight: '700', letterSpacing: 7, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, width: '100%', marginTop: 8 },
  status: { fontSize: 13, lineHeight: 20, color: colors.primary, textAlign: 'center' },
  error: { color: '#A12D3C', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  loading: { minHeight: 240, justifyContent: 'center', alignItems: 'center', gap: 16 },
  refresh: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  refreshText: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
