import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';

export default function LibraryScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Library</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        <View style={styles.emptyCard}><View style={styles.emptyIcon}><Ionicons name="library-outline" size={30} color={colors.primary} /></View><Text style={styles.emptyTitle}>Library service is not connected</Text><Text style={styles.emptyText}>Your school has not enabled book catalogue, issue, or return tracking yet. This screen will become available when the library service is connected.</Text><View style={styles.infoRow}><Ionicons name="information-circle-outline" size={17} color={colors.primary} /><Text style={styles.infoText}>No book data has been loaded or changed.</Text></View><TouchableOpacity onPress={() => navigation.goBack()} style={styles.backToHome}><Text style={styles.backToHomeText}>Back to home</Text></TouchableOpacity></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: c.text },
  listContainer: { padding: 20 },
  emptyCard: { alignItems: 'center', padding: 28, backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, marginTop: 18 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '15', marginBottom: 15 },
  emptyTitle: { color: c.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: c.subText, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 17, padding: 10, borderRadius: 10, backgroundColor: c.primary + '10' }, infoText: { color: c.primary, fontSize: 10, fontWeight: '700' }, backToHome: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 11, backgroundColor: c.primary }, backToHomeText: { color: '#fff', fontSize: 12, fontWeight: '900' },
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
