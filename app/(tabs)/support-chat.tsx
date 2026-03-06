import { ThemedText } from '@/components/themed-text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

type ChatMessage = {
  id: string;
  from: 'user' | 'support';
  text: string;
  createdAt: number;
};

function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ChatSupportScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: nowId(),
      from: 'support',
      text: 'Hello! Thank you for contacting Kaamwalah Support. Our team will get back to you shortly.',
      createdAt: Date.now(),
    },
  ]);

  const listRef = useRef<FlatList<ChatMessage> | null>(null);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = { id: nowId(), from: 'user', text: trimmed, createdAt: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setText('');

    // Simulated support reply (demo)
    setTimeout(() => {
      const reply: ChatMessage = {
        id: nowId(),
        from: 'support',
        text: 'Hello! Thank you for contacting Kaamwalah Support. Our team will get back to you shortly.',
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 650);
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  const grouped = useMemo(() => messages.sort((a, b) => a.createdAt - b.createdAt), [messages]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Support Chat" subtitle="Kaamwalah Support" onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={[styles.chatSurface, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <FlatList
            ref={(r) => {
              listRef.current = r;
            }}
            data={grouped}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <Bubble message={item} />}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />
        </View>

        <View style={[styles.composer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.inputWrap, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type your message…"
              placeholderTextColor={theme.icon}
              style={[styles.input, { color: theme.text }]}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => send()}
              blurOnSubmit={false}
            />
          </View>
          <Pressable
            onPress={send}
            disabled={!text.trim()}
            style={({ pressed }) => [
              styles.send,
              { backgroundColor: text.trim() ? theme.primary : theme.border, shadowColor: theme.shadow },
              pressed && text.trim() && { transform: [{ scale: 0.98 }], opacity: 0.95 },
            ]}
            accessibilityRole="button"
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  function Bubble({ message }: { message: ChatMessage }) {
    const isUser = message.from === 'user';
    const bubbleBg = isUser ? theme.primary : theme.surfaceMuted;
    const textColor = isUser ? '#FFFFFF' : theme.text;

    return (
      <View style={[styles.bubbleRow, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: bubbleBg,
              borderColor: isUser ? 'transparent' : theme.border,
              borderTopLeftRadius: isUser ? Radii.xl : 8,
              borderTopRightRadius: isUser ? 8 : Radii.xl,
            },
          ]}
        >
          <ThemedText style={{ color: textColor, lineHeight: 20, fontWeight: '600' }}>{message.text}</ThemedText>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
  },
  chatSurface: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radii.xl,
    overflow: 'hidden',
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubble: {
    maxWidth: '84%',
    borderWidth: 1,
    borderRadius: Radii.xl,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  composer: {
    marginTop: Spacing.md,
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 46,
  },
  input: {
    fontSize: 14,
    lineHeight: 18,
    maxHeight: 120,
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 3,
  },
});

