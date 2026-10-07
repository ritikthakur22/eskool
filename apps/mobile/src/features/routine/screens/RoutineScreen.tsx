import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../core/networking/api';
import { useTheme } from '../../../core/theme/ThemeContext';
import { getCachedUserData } from '../../../core/networking/session';

export default function RoutineScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [role, setRole] = useState('STUDENT');
  const [routineData, setRoutineData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRoutine = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const savedUser = await getCachedUserData();
      if (savedUser) setRole(JSON.parse(savedUser).role || 'STUDENT');
      const response = await api.get('/routine');
      setRoutineData(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      if (err.response?.status === 404) setRoutineData([]);
      else setError('Could not load the routine. Pull to retry or try again below.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoutine(); }, [loadRoutine]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.title}>Class Routine</Text><Text style={styles.subtitle}>Weekly class timetable</Text></View>
        <TouchableOpacity accessibilityLabel="Refresh routine" style={styles.refresh} onPress={loadRoutine}><Ionicons name="refresh" size={19} color={colors.primary} /></TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? <View style={styles.state}><ActivityIndicator color={colors.primary} /><Text style={styles.stateText}>Loading school routine…</Text></View> : error ? <View style={styles.state}><Ionicons name="cloud-offline-outline" size={28} color={colors.subText} /><Text style={styles.stateText}>{error}</Text><TouchableOpacity onPress={loadRoutine}><Text style={styles.retryText}>Try again</Text></TouchableOpacity></View> : routineData.length === 0 ? <View style={styles.state}><Ionicons name="calendar-outline" size={28} color={colors.subText} /><Text style={styles.stateText}>No routine available.</Text></View> : (
          <View style={{gap: 20}}>
            {routineData.map((dayData, idx) => (
              <View key={idx} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{dayData.dayOfWeek}</Text>
                </View>
                <View style={styles.periodsList}>
                  {dayData.periods && dayData.periods.length > 0 ? dayData.periods.map((period: any, pIdx: number) => (
                    <View key={pIdx} style={[styles.periodItem, pIdx === dayData.periods.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={styles.timeCol}>
                        <Text style={styles.timeText}>{period.startTime}</Text>
                        <Text style={styles.timeTextSub}>{period.endTime}</Text>
                      </View>
                      <View style={styles.subjectCol}>
                        <Text style={styles.subjectText}>{period.subjectName}</Text>
                        <Text style={styles.teacherText}>{period.teacherName} · Class {period.className}</Text>
                      </View>
                    </View>
                  )) : (
                    <Text style={styles.stateText}>No periods scheduled for this day.</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background }, header: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, padding: 15, borderBottomWidth: 1, borderColor: c.border }, back: { padding: 5, marginRight: 9 }, headerCopy: { flex: 1 }, title: { fontSize: 19, fontWeight: '800', color: c.text }, subtitle: { color: c.subText, fontSize: 12, marginTop: 3 }, refresh: { padding: 9, borderRadius: 10, backgroundColor: c.primary + '15' }, content: { padding: 16, paddingBottom: 30 }, 
  state: { minHeight: 110, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card, borderRadius: 15, borderWidth: 1, borderColor: c.border, padding: 16, gap: 8 }, stateText: { color: c.subText, fontSize: 12, textAlign: 'center', lineHeight: 17, marginTop: 6 }, retryText: { color: c.primary, fontWeight: '800', marginTop: 5 },
  dayCard: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
  dayHeader: { backgroundColor: c.primary + '15', padding: 14, borderBottomWidth: 1, borderBottomColor: c.border },
  dayTitle: { fontSize: 16, fontWeight: '900', color: c.primary, textTransform: 'uppercase', letterSpacing: 1 },
  periodsList: { padding: 8 },
  periodItem: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  timeCol: { width: 70, alignItems: 'flex-start', justifyContent: 'center' },
  timeText: { fontSize: 14, fontWeight: '800', color: c.text },
  timeTextSub: { fontSize: 11, color: c.subText, marginTop: 2 },
  subjectCol: { flex: 1, justifyContent: 'center', paddingLeft: 12, borderLeftWidth: 3, borderLeftColor: c.primary + '30' },
  subjectText: { fontSize: 15, fontWeight: '800', color: c.text },
  teacherText: { fontSize: 12, color: c.subText, marginTop: 4 }
});
