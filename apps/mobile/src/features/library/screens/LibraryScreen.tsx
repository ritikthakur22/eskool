import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';

export default function LibraryScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Issued', 'Available'];

  const books = [
    { id: '1', title: 'Science Textbook', cls: 'Class 10', status: 'Available', copies: '12 copies', icon: 'flask', color: '#38A169' },
    { id: '2', title: 'Mathematics Guide', cls: 'Class 10', status: 'Issued', copies: 'Return by Oct 5', icon: 'calculator', color: '#E53E3E' },
    { id: '3', title: 'English Literature', cls: 'Class 10', status: 'Available', copies: '8 copies', icon: 'book', color: '#3182CE' },
    { id: '4', title: 'Computer Science', cls: 'Class 10', status: 'Available', copies: '5 copies', icon: 'laptop', color: '#805AD5' }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Library</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.subText} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search books..."
          placeholderTextColor={colors.subText}
        />
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
        {books.map((book) => (
          <TouchableOpacity key={book.id} style={styles.bookCard}>
            <View style={[styles.bookCover, { backgroundColor: book.color + '15' }]}>
              <Ionicons name={book.icon as any} size={32} color={book.color} />
            </View>
            <View style={styles.bookContent}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookClass}>{book.cls}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.badge, book.status === 'Available' ? styles.badgeAvailable : styles.badgeIssued]}>
                  <Text style={[styles.badgeText, book.status === 'Available' ? styles.badgeTextAvailable : styles.badgeTextIssued]}>
                    {book.status}
                  </Text>
                </View>
                <Text style={styles.copiesText}>• {book.copies}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: c.text },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, marginHorizontal: 20, marginBottom: 15, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: c.border },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: c.text },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: c.border },
  tabButton: { paddingVertical: 15, paddingHorizontal: 20 },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: '#3182CE' },
  tabText: { fontSize: 14, color: c.subText, fontWeight: '500' },
  tabTextActive: { color: c.primary, fontWeight: 'bold' },
  listContainer: { padding: 20 },
  bookCard: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: c.border },
  bookCover: { width: 60, height: 80, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  bookContent: { flex: 1, justifyContent: 'center' },
  bookTitle: { fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 4 },
  bookClass: { fontSize: 14, color: c.subText, marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeAvailable: { backgroundColor: '#C6F6D5' },
  badgeIssued: { backgroundColor: '#FED7D7' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  badgeTextAvailable: { color: '#276749' },
  badgeTextIssued: { color: '#C53030' },
  copiesText: { fontSize: 12, color: c.subText, marginLeft: 8 }
});
