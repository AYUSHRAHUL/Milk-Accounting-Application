import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ChatMessage = {
  id: string;
  from: 'user' | 'support';
  text: string;
  createdAt: number;
};

// Dark Green Palette for Premium Look
const DARK_GREEN = '#064E3B';
const EMERALD_GREEN = '#059669';

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
      text: 'Hello! Welcome to Kaamwalah Support. How can we help you today?',
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
        text: 'Thank you for your message. A member of our support team will be with you shortly.',
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1000);
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  const grouped = useMemo(() => messages.sort((a, b) => a.createdAt - b.createdAt), [messages]);

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      {/* Premium Dark Green Hero Header */}
      <View style={styles.headerHero}>
        <LinearGradient
          colors={[DARK_GREEN, EMERALD_GREEN]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerDecoration} />

        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButtonCorner}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <ThemedText type="title" style={styles.headerTitleCentered}>Support Chat</ThemedText>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <ThemedText style={styles.statusText}>Support Team Online</ThemedText>
              </View>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.chatContainer}>
          <FlatList
            ref={(r) => {
              listRef.current = r;
            }}
            data={grouped}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <Bubble message={item} theme={theme} />}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />
        </View>

        {/* Floating Input Composer */}
        <View style={[styles.composerWrapper, { backgroundColor: theme.background }]}>
          <View style={[styles.composerContainer, {
            backgroundColor: colorScheme === 'dark' ? theme.surface : '#FFFFFF',
            shadowColor: theme.shadow
          }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="How can we help?"
              placeholderTextColor={theme.icon}
              style={[styles.input, { color: theme.text }]}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => send()}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={send}
              disabled={!text.trim()}
              style={({ pressed }) => [
                styles.sendButton,
                { backgroundColor: text.trim() ? DARK_GREEN : theme.border },
                pressed && text.trim() && { transform: [{ scale: 0.95 }], opacity: 0.9 },
              ]}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Bubble({ message, theme }: { message: ChatMessage; theme: any }) {
  const isUser = message.from === 'user';
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.bubbleRow, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
      {!isUser && (
        <View style={[styles.supportAvatar, { backgroundColor: EMERALD_GREEN }]}>
          <Ionicons name="headset" size={14} color="#FFFFFF" />
        </View>
      )}
      <View style={[styles.bubbleContainer, { alignItems: isUser ? 'flex-end' : 'flex-start' }]}>
        <View
          style={[
            styles.bubble,
            isUser ? {
              backgroundColor: DARK_GREEN,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 4,
              borderBottomLeftRadius: 20,
              borderBottomRightRadius: 20,
            } : {
              backgroundColor: theme.surfaceMuted,
              borderColor: theme.border,
              borderWidth: 1,
              borderTopLeftRadius: 4,
              borderTopRightRadius: 20,
              borderBottomLeftRadius: 20,
              borderBottomRightRadius: 20,
            },
          ]}
        >
          {isUser && (
            <LinearGradient
              colors={[DARK_GREEN, EMERALD_GREEN]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <ThemedText style={{
            color: isUser ? '#FFFFFF' : theme.text,
            lineHeight: 22,
            fontWeight: '600',
            fontSize: 15
          }}>
            {message.text}
          </ThemedText>
        </View>
        <ThemedText style={[styles.timestamp, { color: theme.textSecondary }]}>{time}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  headerHero: {
    height: 160,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  headerDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButtonCorner: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleCentered: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  listContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  supportAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bubbleContainer: {
    flex: 1,
  },
  bubble: {
    maxWidth: '85%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    marginHorizontal: 4,
    fontWeight: '500',
  },
  composerWrapper: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 8,
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
