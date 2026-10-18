import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';
import type { AppMedicationSnapshot, ChatMessage, ChatReply } from '../../../../shared/src/types/Chat';

import { useAuth } from '../auth/AuthContext';
import { useMedications } from '../context/MedicationContext';
import { apiUrl } from '../lib/api';
import { colors } from '../theme/colors';
import { PillBackground } from '../components/PillBackground';
import { typography } from '../theme/typography';

export function ChatScreen() {
  const { session } = useAuth();
  const { medicationsByDate } = useMedications();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const scroll = useRef<ScrollView>(null);
  const scrollAfterMessage = useRef(false);
  const sending = useRef(false);

  const appMedications = useMemo<AppMedicationSnapshot[]>(() =>
    Object.entries(medicationsByDate).sort(([a], [b]) => b.localeCompare(a))
      .flatMap(([date, medications]) => medications.map((medication) => ({
        date, name: medication.genericName.slice(0, 160), dosage: medication.dosage.slice(0, 120),
        time: medication.time.slice(0, 40), status: medication.status,
      }))).slice(0, 30), [medicationsByDate]);

  useEffect(() => () => request.current?.abort(), []);

  function newChat() {
    request.current?.abort();
    request.current = null;
    sending.current = false;
    setBusy(false);
    setMessages([]);
    setDraft('');
    setError('');
  }

  async function send() {
    const message = draft.trim();
    if (!message || !session || sending.current) return;
    const history = messages.slice(-12).map(({ role, text }) => ({ role, text: text.slice(0, 4000) }));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);
    request.current = controller;
    sending.current = true;
    setBusy(true);
    setError('');
    setDraft('');
    scrollAfterMessage.current = true;
    setMessages((current) => current.concat({ role: 'user', text: message }).slice(-24));
    try {
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        signal: controller.signal,
        body: JSON.stringify({ message, history, appMedications }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Chat is unavailable. Please try again.');
      const reply = result as ChatReply;
      if (typeof reply.reply !== 'string' || !reply.reply) throw new Error('No response was received. Please try again.');
      if (controller.signal.aborted) return;
      scrollAfterMessage.current = true;
      setMessages((current) => current.concat({ role: 'model', text: reply.reply }).slice(-24));
    } catch (caught) {
      if (request.current === controller) {
        setError(controller.signal.aborted ? 'The request timed out. Please try again.' :
          caught instanceof Error ? caught.message : 'Could not connect. Please try again.');
        // Failed requests are kept in the composer so the user can edit and resend.
        setMessages((current) => current.slice(0, -1));
        setDraft(message);
      }
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        sending.current = false;
        setBusy(false);
      }
    }
  }

  const canSend = !!draft.trim() && !busy;
  const conversation = (
    <PillBackground>
      <KeyboardAvoidingView style={styles.conversationShell} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>IntelliMed</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={newChat} style={styles.newChat}>
            <Text style={styles.newChatText}>New chat</Text>
          </Pressable>
        </View>
        <View style={styles.warning}>
          <Text style={styles.warningText}>AI can be wrong. Check the accuracy of its answers before relying on them.</Text>
        </View>
        <ScrollView ref={scroll} style={styles.conversation} contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          onContentSizeChange={() => {
            if (scrollAfterMessage.current) { scrollAfterMessage.current = false; scroll.current?.scrollToEnd({ animated: true }); }
          }}>
          {messages.length === 0 && !busy && (
            <View style={styles.empty}>
              <Text style={styles.sparkle}>✦</Text>
              <Text style={styles.emptyTitle}>What’s on your mind?</Text>
              <Text style={styles.emptyText}>Ask about medications, your routine, or questions to bring to your pharmacist.</Text>
              {['Help me understand my medication routine', 'What should I ask my pharmacist?'].map((suggestion) => (
                <Pressable key={suggestion} accessibilityRole="button" onPress={() => setDraft(suggestion)} style={styles.suggestion}>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                  <Text style={styles.suggestionArrow}>↗</Text>
                </Pressable>
              ))}
            </View>
          )}
          {messages.map((message, index) => (
            <View key={index} style={[styles.message, message.role === 'user' ? styles.userMessage : styles.aiMessage]}>
              {message.role === 'model' && <Text style={styles.aiLabel}>✦ IntelliMed</Text>}
              <Text selectable style={[styles.messageText, message.role === 'user' && styles.userText]}>{message.text}</Text>
            </View>
          ))}
          {busy && <View accessibilityLiveRegion="polite" style={[styles.message, styles.aiMessage, styles.typing]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.subtitle}>Thinking…</Text>
          </View>}
        </ScrollView>
        <View style={styles.composer}>
          {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
          <View style={styles.inputRow}>
            <TextInput accessibilityLabel="Message to IntelliMed" multiline maxLength={1500} editable={!busy}
              value={draft} onChangeText={(value) => { setDraft(value); setError(''); }}
              placeholder="Message IntelliMed…" placeholderTextColor={colors.textMuted}
              style={styles.input} textAlignVertical="top" />
            <Pressable accessibilityRole="button" accessibilityLabel="Send message"
              accessibilityState={{ disabled: !canSend, busy }} disabled={!canSend} onPress={() => void send()}
              style={({ pressed }) => [styles.sendButton, (!canSend || pressed) && styles.disabled]}>
              <Text style={styles.sendArrow}>↑</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </PillBackground>
  );
  return Platform.OS === 'web' ? conversation : (
    <SafeAreaView edges={{ bottom: true }} style={styles.screen}>{conversation}</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  conversationShell: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heading: { flex: 1, gap: 4 },
  title: { ...typography.heading, color: colors.text, fontSize: 30 },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  newChat: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  newChatText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  warning: { marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.surfaceMuted, borderRadius: 14 },
  warningText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  conversation: { flex: 1 },
  messages: { flexGrow: 1, padding: 20, gap: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingVertical: 24 },
  sparkle: { color: colors.primary, fontSize: 38 },
  emptyTitle: { ...typography.heading, color: colors.text, fontSize: 23 },
  emptyText: { color: colors.textMuted, fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 320, marginBottom: 10 },
  suggestion: { width: '100%', maxWidth: 380, flexDirection: 'row', gap: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  suggestionText: { flex: 1, color: colors.primary, fontSize: 14, lineHeight: 21 },
  suggestionArrow: { color: colors.primary, fontSize: 18 },
  message: { maxWidth: '90%', padding: 16, borderRadius: 20, gap: 6 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  aiMessage: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: colors.border },
  aiLabel: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  messageText: { color: colors.text, fontSize: 16, lineHeight: 25 },
  userText: { color: colors.surface },
  typing: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  composer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 10, backgroundColor: colors.background },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 26, gap: 8 },
  input: { flex: 1, minWidth: 0, minHeight: 42, maxHeight: 130, paddingVertical: 10, paddingHorizontal: 12, fontSize: 16, lineHeight: 23, color: colors.text },
  sendButton: { minHeight: 44, minWidth: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendArrow: { color: colors.surface, fontSize: 26, fontWeight: '600' },
  disabled: { opacity: 0.4 },
  error: { color: '#A12D3C', fontSize: 14, lineHeight: 21, paddingHorizontal: 8 },
});
