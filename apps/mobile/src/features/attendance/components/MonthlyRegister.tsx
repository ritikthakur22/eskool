import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';
import { api } from '../../../core/networking/api';

export default function MonthlyRegister({ sectionId, students }: { sectionId: string, students: any[] }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sectionId) loadMonthlyData();
  }, [sectionId, currentMonth]);

  const loadMonthlyData = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const res = await api.get(`/attendance/register?sectionId=${sectionId}&startDate=${firstDay}&endDate=${lastDay}`);
      setAttendance(res.data?.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  }, [currentMonth]);

  const daysArray = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const shiftMonth = (amount: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + amount, 1));
  };

  // Group attendance by student -> date -> status
  const grid = useMemo(() => {
    const map: any = {};
    attendance.forEach(a => {
      if (!map[a.student.id]) map[a.student.id] = {};
      const day = new Date(a.date).getUTCDate();
      map[a.student.id][day] = a.status === 'PRESENT' ? 'P' : a.status === 'ABSENT' ? 'A' : 'L';
    });
    return map;
  }, [attendance]);

  if (!sectionId) {
    return <View style={styles.center}><Text style={styles.empty}>Please select a section first.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.btn}><Ionicons name="chevron-back" size={20} color={colors.text}/></TouchableOpacity>
        <Text style={styles.title}>{currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</Text>
        <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.btn}><Ionicons name="chevron-forward" size={20} color={colors.text}/></TouchableOpacity>
      </View>
      
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} /> : (
        <ScrollView horizontal>
          <View>
            <View style={styles.row}>
              <View style={[styles.cell, styles.nameCell, styles.headerCell]}><Text style={styles.headerText}>Student</Text></View>
              {daysArray.map(d => (
                <View key={d} style={[styles.cell, styles.dayCell, styles.headerCell]}>
                  <Text style={styles.headerText}>{d}</Text>
                </View>
              ))}
              <View style={[styles.cell, styles.totalCell, styles.headerCell]}><Text style={styles.headerText}>Total</Text></View>
            </View>

            {students.map(enroll => {
              const studentId = enroll.studentId;
              const prof = enroll.student?.studentProfile || {};
              const name = [prof.firstName, prof.lastName].filter(Boolean).join(' ') || enroll.student?.email || 'Unknown';
              let presentCount = 0;
              let totalCount = 0;
              const stdGrid = grid[studentId] || {};
              
              daysArray.forEach(d => {
                if (stdGrid[d]) {
                  totalCount++;
                  if (stdGrid[d] === 'P') presentCount++;
                }
              });
              
              const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

              return (
                <View key={studentId} style={styles.row}>
                  <View style={[styles.cell, styles.nameCell]}>
                    <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
                  </View>
                  
                  {daysArray.map(d => {
                    const status = stdGrid[d] || '-';
                    return (
                      <View key={d} style={[styles.cell, styles.dayCell, status === 'P' ? styles.presentCell : status === 'A' ? styles.absentCell : null]}>
                        <Text style={[styles.statusText, status === 'P' ? styles.presentText : status === 'A' ? styles.absentText : null]}>{status}</Text>
                      </View>
                    );
                  })}
                  
                  <View style={[styles.cell, styles.totalCell]}>
                    <Text style={styles.totalText}>{presentCount}/{totalCount}</Text>
                    <Text style={styles.percentText}>{percentage}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, marginHorizontal: 16, overflow: 'hidden', paddingBottom: 10, marginTop: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: c.border },
  title: { fontSize: 16, fontWeight: '800', color: c.text },
  btn: { padding: 8, backgroundColor: c.mutedSurface, borderRadius: 8 },
  center: { padding: 40, alignItems: 'center' },
  empty: { color: c.subText },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: c.border },
  cell: { justifyContent: 'center', padding: 8, borderRightWidth: 1, borderColor: c.border },
  headerCell: { backgroundColor: c.mutedSurface },
  nameCell: { width: 140, alignItems: 'flex-start' },
  dayCell: { width: 35, alignItems: 'center' },
  totalCell: { width: 60, alignItems: 'center' },
  headerText: { fontSize: 11, fontWeight: '800', color: c.subText },
  nameText: { fontSize: 12, fontWeight: '700', color: c.text },
  statusText: { fontSize: 12, fontWeight: '800', color: c.subText },
  presentCell: { backgroundColor: c.success + '15' },
  absentCell: { backgroundColor: c.danger + '15' },
  presentText: { color: c.success },
  absentText: { color: c.danger },
  totalText: { fontSize: 12, fontWeight: '800', color: c.text },
  percentText: { fontSize: 10, color: c.subText, marginTop: 2 }
});
