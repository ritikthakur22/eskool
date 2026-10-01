import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';

export default function OnlineClassScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Online Class</Text>
        <View style={{ width: 24 }} />
      </View>

      {/*
        Online class sections are intentionally disabled until the backend integration is ready:
        - Upcoming classes
        - Live classes
        - Recorded classes
      */}
      <View style={styles.comingSoonCard}>
        <View style={styles.comingSoonIcon}>
          <Ionicons name="videocam-outline" size={34} color="#3182CE" />
        </View>
        <Text style={styles.comingSoonTitle}>Online classes are coming soon</Text>
        <Text style={styles.comingSoonText}>
          Upcoming, live, and recorded classes will appear here when the online class service is available.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: c.text },
  comingSoonCard: { margin: 20, padding: 28, alignItems: 'center', backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border },
  comingSoonIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.primary + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  comingSoonTitle: { fontSize: 18, fontWeight: 'bold', color: c.text, textAlign: 'center', marginBottom: 10 },
  comingSoonText: { fontSize: 14, lineHeight: 21, color: c.subText, textAlign: 'center' }
});
