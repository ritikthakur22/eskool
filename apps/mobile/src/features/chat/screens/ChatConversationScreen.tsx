import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, FlatList, ListRenderItem } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';
import { api } from '../../../core/networking/api';
import * as SecureStore from 'expo-secure-store';

export default function ChatConversationScreen({ route, navigation }: any) {
  const { conversationId, conversationName } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [myId, setMyId] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const raw = await SecureStore.getItemAsync('user_data');
        if (raw) setMyId(JSON.parse(raw).id || '');
      } catch (e) {
        console.log('Error reading secure store', e);
      }
    };
    fetchUser();
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/chat/conversations/${conversationId}/messages`);
      setMessages(res.data);
    } catch (e) {
      console.log('Error fetching messages', e);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Simple polling
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    Keyboard.dismiss();

    try {
      await api.post(`/chat/conversations/${conversationId}/messages`, { content: text });
      fetchMessages();
    } catch (e) {
      console.log('Error sending message', e);
    } finally {
      setSending(false);
    }
  };

  const renderItem: ListRenderItem<any> = useCallback(({ item: msg }) => {
    const isMe = msg.senderId === myId;
    const senderProfile = msg.sender?.adminProfile || msg.sender?.teacherProfile || msg.sender?.studentProfile;
    const senderName = [senderProfile?.firstName, senderProfile?.lastName].filter(Boolean).join(' ') || msg.sender?.email || 'Unknown';
    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperThem]}>
        {!isMe && <Text style={styles.senderName}>{senderName}</Text>}
        <View style={[styles.messageBubble, isMe ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.messageText, isMe ? { color: '#fff' } : { color: colors.text }]}>{msg.content}</Text>
        </View>
        <Text style={styles.timeText}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  }, [myId, colors, styles]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Go Back" accessibilityRole="button">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">{conversationName || 'Chat'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading && messages.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList 
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id?.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.subText}
            value={inputText}
            onChangeText={setInputText}
            multiline
            accessibilityLabel="Message input"
          />
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.primary }]} onPress={sendMessage} disabled={sending || !inputText.trim()} accessibilityLabel="Send message" accessibilityRole="button">
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, minHeight: 60 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: c.text, flex: 1, textAlign: 'center' },
  listContainer: { padding: 15, paddingBottom: 20, flexGrow: 1, justifyContent: 'flex-end' },
  messageWrapper: { marginBottom: 15, maxWidth: '85%' },
  messageWrapperMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  messageWrapperThem: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderName: { fontSize: 13, color: c.subText, marginBottom: 4, marginLeft: 2 },
  messageBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  messageText: { fontSize: 16, lineHeight: 22 },
  timeText: { fontSize: 12, color: c.subText, marginTop: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, maxHeight: 120, fontSize: 16, minHeight: 44 },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 10, marginBottom: 0 },
});
