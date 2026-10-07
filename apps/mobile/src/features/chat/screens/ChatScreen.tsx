import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { KeyboardAvoidingView, Platform, Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, useTheme } from '../../../core/theme/ThemeContext';
import { KeyboardAvoidingView, Platform, api } from '../../../core/networking/api';

export default function ChatScreen({ navigation }: any) {
  const { colors } = useTheme(); const styles = makeStyles(colors);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Conversations');
  const tabs = ['Conversations', 'Directory'];

  // Creation State
  const [users, setUsers] = useState<any[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
    } catch (e) {
      console.log(e);
    } finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/admin/users'); // fallback to simple fetch
      setUsers(res.data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, []);

  const openConversation = (conv: any) => {
    navigation.navigate('ChatConversation', { conversationId: conv.id, conversationName: conv.name || 'Chat' });
  };

  const startConversation = async (userId: string, userName: string) => {
    setCreateModalVisible(false);
    try {
      const res = await api.post('/chat/conversations', { participantIds: [userId] });
      navigation.navigate('ChatConversation', { conversationId: res.data.id, conversationName: userName });
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not start chat.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => setCreateModalVisible(true)}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {activeTab === 'Conversations' ? (
          loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> :
          conversations.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}><Ionicons name="chatbubbles-outline" size={30} color={colors.primary} /></View>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyText}>Start a chat by tapping the compose icon above.</Text>
            </View>
          ) : (
            conversations.map(conv => (
              <TouchableOpacity key={conv.id} style={[styles.chatCard, { borderBottomColor: colors.border }]} onPress={() => openConversation(conv)}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '18' }]}><Ionicons name="people" size={20} color={colors.primary} /></View>
                <View style={styles.chatContent}>
                  <Text style={[styles.chatName, { color: colors.text }]}>{conv.name || 'Direct Message'}</Text>
                  <Text style={styles.chatTime}>{new Date(conv.updatedAt).toLocaleDateString()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.subText} />
              </TouchableOpacity>
            ))
          )
        ) : (
          users.map(u => {
            const profile = u.adminProfile || u.teacherProfile || u.studentProfile;
            const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || u.email;
            return (
              <TouchableOpacity key={u.id} style={[styles.chatCard, { borderBottomColor: colors.border }]} onPress={() => startConversation(u.id, name)}>
                <View style={[styles.avatar, { backgroundColor: colors.mutedSurface }]}><Ionicons name="person" size={20} color={colors.subText} /></View>
                <View style={styles.chatContent}>
                  <Text style={[styles.chatName, { color: colors.text }]}>{name}</Text>
                  <Text style={styles.chatTime}>{u.role}</Text>
                </View>
                <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      <Modal visible={createModalVisible} animationType="slide" transparent onRequestClose={() => setCreateModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>New Chat</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}><Ionicons name="close" size={24} color={colors.subText} /></TouchableOpacity>
            </View>
            <ScrollView>
              {users.map(u => {
                const profile = u.adminProfile || u.teacherProfile || u.studentProfile;
                const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || u.email;
                return (
                  <TouchableOpacity key={u.id} style={[styles.chatCard, { borderBottomColor: colors.border }]} onPress={() => startConversation(u.id, name)}>
                    <View style={styles.chatContent}><Text style={[styles.chatName, { color: colors.text }]}>{name}</Text><Text style={styles.chatTime}>{u.role}</Text></View>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: c.text },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: c.border },
  tabButton: { paddingVertical: 15, paddingHorizontal: 20 },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: c.primary },
  tabText: { fontSize: 14, color: c.subText, fontWeight: '500' },
  tabTextActive: { color: c.primary, fontWeight: '800' },
  listContainer: { padding: 20 },
  emptyCard: { alignItems: 'center', padding: 28, backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, marginTop: 18 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '15', marginBottom: 15 },
  emptyTitle: { color: c.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: c.subText, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  chatCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  chatContent: { flex: 1 },
  chatName: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  chatTime: { fontSize: 11, color: c.subText },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
});
