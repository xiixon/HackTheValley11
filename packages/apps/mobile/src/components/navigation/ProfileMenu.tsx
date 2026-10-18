import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Clickable } from '../ui/Clickable';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileScreen } from '../../screens/ProfileScreen';
import { colors } from '../../theme/colors';

export function ProfileMenu() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Clickable accessibilityRole="button" accessibilityLabel="Open your profile" onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.userButton, pressed && { opacity: 0.6 }]}>
          <View style={styles.head} />
          <View style={styles.shoulders} />
        </Clickable>
      </View>
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.toolbar}>
            <Text style={styles.title}>Account</Text>
            <Clickable accessibilityRole="button" accessibilityLabel="Close profile" onPress={() => setOpen(false)} style={styles.close}>
              <Text style={styles.closeText}>Done</Text>
            </Clickable>
          </View>
          <ProfileScreen />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 4, backgroundColor: colors.background },
  userButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 3 },
  head: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  shoulders: { width: 19, height: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: colors.primary },
  sheet: { flex: 1, backgroundColor: colors.background },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  title: { fontSize: 17, fontWeight: '600', color: colors.text },
  close: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' },
  closeText: { color: colors.primary, fontSize: 17, fontWeight: '600' },
});
