import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';
import { api } from '../../../core/networking/api';
import * as SecureStore from 'expo-secure-store';

export default function ChatConversationScreen({ route, navigation }: any) {
  const { conversationId, conversationName } = route.params;
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [myId, setMyId] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchMessages = async () => {
    try {
      const raw = await SecureStore.getItemAsync('user_data');
      if (raw) setMyId(JSON.parse(raw).id || '');
      const res = await api.get(`/chat/conversations/${conversationId}/messages`);
      setMessages(res.data);
    } catch (e) {
      console.log('Error fetching messages', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Simple polling
    return () => clearInterval(interval);
  }, [conversationId]);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{conversationName || 'Chat'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.listContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {loading && messages.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderId === myId;
              const senderProfile = msg.sender?.adminProfile || msg.sender?.teacherProfile || msg.sender?.studentProfile;
              const senderName = [senderProfile?.firstName, senderProfile?.lastName].filter(Boolean).join(' ') || msg.sender?.email || 'Unknown';
              return (
                <View key={msg.id} style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperThem]}>
                  {!isMe && <Text style={styles.senderName}>{senderName}</Text>}
                  <View style={[styles.messageBubble, isMe ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                    <Text style={[styles.messageText, isMe ? { color: '#fff' } : { color: colors.text }]}>{msg.content}</Text>
                  </View>
                  <Text style={styles.timeText}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.subText}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.primary }]} onPress={sendMessage} disabled={sending || !inputText.trim()}>
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: c.text },
  listContainer: { padding: 15, paddingBottom: 20, flexGrow: 1, justifyContent: 'flex-end' },
  messageWrapper: { marginBottom: 15, maxWidth: '80%' },
  messageWrapperMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  messageWrapperThem: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderName: { fontSize: 11, color: c.subText, marginBottom: 4, marginLeft: 2 },
  messageBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  messageText: { fontSize: 14, lineHeight: 20 },
  timeText: { fontSize: 10, color: c.subText, marginTop: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, maxHeight: 100, fontSize: 14 },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 10, marginBottom: 2 },
});
