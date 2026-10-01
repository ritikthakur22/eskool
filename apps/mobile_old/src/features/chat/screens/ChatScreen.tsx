import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';

export default function ChatScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [activeTab, setActiveTab] = useState('Teachers');
  const tabs = ['Teachers', 'Classmates', 'Groups'];

  const chats = [
    { id: '1', name: 'Mr. Sharma', role: 'Mathematics', message: 'Please complete the homework.', time: '10:30 AM', unread: 2, avatarColor: '#3182CE' },
    { id: '2', name: 'Class 10A', role: 'Group', message: 'Exam postponed to next week.', time: '9:15 AM', unread: 12, avatarColor: '#DD6B20' },
    { id: '3', name: 'Ms. Rai', role: 'Science', message: 'Upload your lab report.', time: 'Yesterday', unread: 0, avatarColor: '#E53E3E' },
    { id: '4', name: 'Ramesh', role: 'Classmate', message: 'Are you coming to school?', time: 'Yesterday', unread: 0, avatarColor: '#38A169' },
    { id: '5', name: 'School Admin', role: 'Official', message: 'Dear all, school will be closed...', time: 'Sep 24', unread: 0, avatarColor: '#805AD5' }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {chats.map((chat) => (
          <TouchableOpacity key={chat.id} style={styles.chatCard}>
            <View style={[styles.avatar, { backgroundColor: chat.avatarColor }]}>
              <Ionicons name={chat.role === 'Group' ? 'people' : 'person'} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.chatContent}>
              <View style={styles.chatHeaderRow}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={[styles.chatTime, chat.unread > 0 && styles.chatTimeUnread]}>{chat.time}</Text>
              </View>
              <Text style={styles.chatRole}>{chat.role}</Text>
              <View style={styles.chatMessageRow}>
                <Text style={styles.chatMessage} numberOfLines={1}>{chat.message}</Text>
                {chat.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{chat.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: c.text },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: c.border },
  tabButton: { paddingVertical: 15, paddingHorizontal: 20 },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: c.primary },
  tabText: { fontSize: 14, color: c.subText, fontWeight: '500' },
  tabTextActive: { color: c.primary, fontWeight: 'bold' },
  listContainer: { padding: 20 },
  chatCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: c.border },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  chatContent: { flex: 1 },
  chatHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  chatName: { fontSize: 16, fontWeight: 'bold', color: c.text },
  chatTime: { fontSize: 12, color: c.subText },
  chatTimeUnread: { color: c.primary, fontWeight: 'bold' },
  chatRole: { fontSize: 12, color: c.subText, marginBottom: 4 },
  chatMessageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatMessage: { flex: 1, fontSize: 14, color: c.subText, marginRight: 10 },
  unreadBadge: { backgroundColor: c.danger, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, minWidth: 24, alignItems: 'center' },
  unreadText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center', shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }
});
