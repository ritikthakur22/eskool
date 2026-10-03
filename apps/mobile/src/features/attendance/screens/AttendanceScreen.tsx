import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import NepaliDate from 'nepali-date-converter';
import { api } from '../../../core/networking/api';
import { useTheme } from '../../../core/theme/ThemeContext';
import BottomNavigation from '../../../core/components/BottomNavigation';
import { currentBsMonth, getBsMonthDays, getBsMonthLabels, getGregorianMonthsForBsMonth, shiftBsMonth, type BsMonth } from '../../../core/utils/bsCalendar';
import { getSelectedChildId } from '../../../core/utils/childSelection';
import StaffAttendanceScreen from './StaffAttendanceScreen';

type RecordItem = { id: string; date: string; createdAt?: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY'; subject?: string | null; remarks?: string | null };
type ManagedRecord = RecordItem & { student?: { email?: string; studentProfile?: { firstName?: string; lastName?: string; rollNo?: string; grade?: string; section?: string } }; teacher?: { email?: string; teacherProfile?: { firstName?: string; lastName?: string }; adminProfile?: { firstName?: string; lastName?: string } } };
const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function AttendanceScreen({ navigation }: any) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const [month, setMonth] = useState<BsMonth>(currentBsMonth);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [childId, setChildId] = useState('');

  useEffect(() => { SecureStore.getItemAsync('user_data').then(raw => { if (raw) setRole(JSON.parse(raw).role || ''); }).catch(() => undefined); }, []);
  useEffect(() => { if (role === 'PARENT') getSelectedChildId().then(id => setChildId(id || '')).catch(() => undefined); }, [role]);

  const days = useMemo(() => getBsMonthDays(month), [month]);
  const weeks = useMemo(() => {
    const cells: (typeof days[number] | null)[] = [...Array(days[0]?.weekDay || 0).fill(null), ...days];
    while (cells.length % 7) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
  }, [days]);
  const { bs: bsLabel, ad: adLabel } = getBsMonthLabels(month);
  const selectedRecords = records.filter(item => dateKey(new Date(item.date)) === dateKey(selectedDate));

  const loadAttendance = useCallback(async (refresh = false) => {
    if (!role) return;
    if (role !== 'STUDENT' && role !== 'PARENT') { setLoading(false); return; }
    if (role === 'PARENT' && !childId) { setLoading(false); setError('Select a child from the home screen first.'); return; }
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const { data: profileResponse } = await api.get('/users/me');
      const studentId = role === 'PARENT' ? childId : profileResponse?.id;
      if (!studentId) throw new Error('Student profile is unavailable.');
      const adMonths = getGregorianMonthsForBsMonth(month);
      const responses = await Promise.all(adMonths.map(({ year, month: adMonth }) =>
        api.get(`/attendance/student/${encodeURIComponent(studentId)}`, { params: { month: adMonth + 1, year } }),
      ));
      const allRecords = responses.flatMap(response => Array.isArray(response.data) ? response.data : []) as RecordItem[];
      const unique = new Map(allRecords.map(item => [item.id, item]));
      setRecords([...unique.values()]);
    } catch (e: any) {
      setError(e.response?.status === 401 ? 'Your session expired. Please sign in again.' : 'We couldn’t load attendance for this month. Check your connection and retry.');
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month, role, childId]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const moveMonth = (offset: number) => {
    const next = shiftBsMonth(month, offset);
    const nextDays = getBsMonthDays(next);
    const todayKey = dateKey(new Date());
    const todayInMonth = nextDays.find(day => dateKey(day.adDate) === todayKey);
    setMonth(next);
    setSelectedDate(todayInMonth?.adDate || nextDays[0].adDate);
  };
  const goToToday = () => {
    const today = new Date();
    setMonth(currentBsMonth());
    setSelectedDate(today);
  };

  const getDayStatus = (day: Date) => {
    const matches = records.filter(item => dateKey(new Date(item.date)) === dateKey(day));
    if (!matches.length) return null;
    if (matches.some(item => item.status === 'ABSENT')) return 'ABSENT';
    if (matches.some(item => item.status === 'HALF_DAY')) return 'HALF_DAY';
    if (matches.some(item => item.status === 'LATE')) return 'LATE';
    return 'PRESENT';
  };
  const statusColor = (status: string) => status === 'PRESENT' ? colors.success : status === 'ABSENT' ? colors.danger : colors.warning;
  const presentCount = records.filter(item => item.status === 'PRESENT').length;
  const absentCount = records.filter(item => item.status === 'ABSENT').length;
  const otherCount = records.filter(item => item.status === 'LATE' || item.status === 'HALF_DAY').length;
  const attendanceRate = records.length ? Math.round((presentCount / records.length) * 100) : 0;
  if (role && role !== 'STUDENT' && role !== 'PARENT') return <StaffAttendanceScreen navigation={navigation} role={role} />;
  const selectedBs = new NepaliDate(selectedDate).format('ddd, DD MMMM YYYY');
  const selectedAd = selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return <SafeAreaView style={s.screen}>
    <View style={s.header}>
      <TouchableOpacity accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={s.back}><Ionicons name="chevron-back" size={23} color={colors.text} /></TouchableOpacity>
      <View style={{ flex: 1 }}><Text style={s.title}>Attendance</Text><Text style={s.subtitle}>Bikram Sambat · Gregorian</Text></View>
      <TouchableOpacity accessibilityLabel="Go to today" onPress={goToToday} style={s.todayButton}><Text style={s.todayButtonText}>Today</Text></TouchableOpacity>
    </View>
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAttendance(true)} tintColor={colors.primary} />}>
      <View style={s.calendarCard}>
        <View style={s.monthHeader}>
          <TouchableOpacity accessibilityLabel="Previous BS month" onPress={() => moveMonth(-1)} style={s.monthArrow}><Ionicons name="chevron-back" size={19} color={colors.text} /></TouchableOpacity>
          <View style={s.monthCopy}><Text style={s.bsMonth}>{bsLabel}</Text><Text style={s.adMonth}>{adLabel}</Text></View>
          <TouchableOpacity accessibilityLabel="Next BS month" onPress={() => moveMonth(1)} style={s.monthArrow}><Ionicons name="chevron-forward" size={19} color={colors.text} /></TouchableOpacity>
        </View>
        <View style={s.weekHeader}>{weekDays.map((day, index) => <View key={`${day}-${index}`} style={s.weekdayCell}><Text style={[s.weekday, index === 6 && s.saturday]}>{day}</Text></View>)}</View>
        {weeks.map((week, weekIndex) => <View key={weekIndex} style={s.weekRow}>{week.map((day, dayIndex) => {
          if (!day) return <View key={`blank-${dayIndex}`} style={s.dayCell} />;
          const isToday = dateKey(day.adDate) === dateKey(new Date());
          const isSelected = dateKey(day.adDate) === dateKey(selectedDate);
          const isSaturday = day.weekDay === 6;
          const status = getDayStatus(day.adDate);
          const color = isSaturday ? colors.danger : status ? statusColor(status) : colors.text;
          return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${new NepaliDate(day.adDate).format('DD MMMM YYYY')}, ${day.adDate.toLocaleDateString()}, ${status || 'no attendance record'}`} key={day.adDate.toISOString()} onPress={() => setSelectedDate(day.adDate)} style={[s.dayCell, isSelected && s.selectedDay]}>
            <Text style={[s.bsDay, { color: isToday ? colors.primary : color }, isToday && s.todayDay]}>{day.bsDay}</Text>
            <Text style={[s.adDay, isSelected && s.selectedAd]}>{day.adDate.getDate()}</Text>
            {status ? <View style={[s.statusDot, { backgroundColor: statusColor(status) }]} /> : null}
          </TouchableOpacity>;
        })}</View>)}
        <View style={s.legend}><LegendDot color={colors.success} label="Present" styles={s} /><LegendDot color={colors.danger} label="Absent" styles={s} /><LegendDot color={colors.warning} label="Late / half day" styles={s} /><LegendDot color={colors.danger} label="Saturday" styles={s} /></View>
      </View>

      {error ? <View style={s.errorCard}><Ionicons name="cloud-offline-outline" size={25} color={colors.subText} /><Text style={s.errorText}>{error}</Text><TouchableOpacity onPress={() => loadAttendance()}><Text style={s.retry}>Retry</Text></TouchableOpacity></View> : loading ? <View style={s.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={s.muted}>Loading this month’s attendance…</Text></View> : <>
        <View style={s.statsRow}>
          <StatCard value={String(records.length)} label="Sessions" accent={colors.primary} styles={s} />
          <StatCard value={String(presentCount)} label="Present" accent={colors.success} styles={s} />
          <StatCard value={String(absentCount)} label="Absent" accent={colors.danger} styles={s} />
          <StatCard value={String(otherCount)} label="Other" accent={colors.warning} styles={s} />
        </View>
        <View style={s.overviewCard}><View style={[s.rateRing, { borderColor: colors.success }]}><Text style={s.rateText}>{attendanceRate}%</Text></View><View style={s.overviewCopy}><Text style={s.overviewTitle}>Monthly attendance</Text><Text style={s.overviewHint}>{presentCount} present of {records.length} recorded sessions</Text></View><Ionicons name="analytics-outline" size={23} color={colors.primary} /></View>
        <View style={s.daySectionHead}><View><Text style={s.sectionTitle}>Selected day</Text><Text style={s.sectionSubtitle}>{selectedBs}</Text><Text style={s.sectionSubtitle}>{selectedAd}</Text></View><Ionicons name="calendar-outline" size={21} color={colors.primary} /></View>
        {selectedRecords.length ? selectedRecords.map(item => <View key={item.id} style={s.recordCard}><View style={[s.recordMarker, { backgroundColor: statusColor(item.status) }]} /><View style={{ flex: 1 }}><Text style={s.recordSubject}>{item.subject || 'Class attendance'}</Text>{item.remarks ? <Text style={s.recordRemarks}>{item.remarks}</Text> : null}</View><Text style={[s.recordStatus, { color: statusColor(item.status) }]}>{item.status.replace('_', ' ')}</Text></View>) : <View style={s.emptyCard}><Ionicons name="information-circle-outline" size={20} color={colors.subText} /><Text style={s.emptyText}>No attendance has been recorded for this day.</Text></View>}
      </>}
    </ScrollView>
    <BottomNavigation navigation={navigation} activeRoute="Attendance" colors={colors} role={role} />
  </SafeAreaView>;
}

function StaffAttendanceRegister({ navigation, role, colors, styles: s }: any) {
  const [rows, setRows] = useState<ManagedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const date = dateKey(new Date());
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/attendance/register', { params: { date } });
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.status === 403 ? 'You do not have access to this attendance register.' : 'Could not load the attendance register.');
      setRows([]);
    } finally { setLoading(false); }
  }, [date]);
  useEffect(() => { load(); }, [load]);
  const nameFor = (row: ManagedRecord) => [row.student?.studentProfile?.firstName, row.student?.studentProfile?.lastName].filter(Boolean).join(' ') || row.student?.email || 'Student';
  const markerFor = (row: ManagedRecord) => { const profile = row.teacher?.teacherProfile || row.teacher?.adminProfile; return [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || row.teacher?.email || 'System'; };
  const statusColor = (status: string) => status === 'PRESENT' ? colors.success : status === 'ABSENT' ? colors.danger : colors.warning;
  return <SafeAreaView style={s.screen}>
    <View style={s.header}><TouchableOpacity accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={s.back}><Ionicons name="chevron-back" size={23} color={colors.text} /></TouchableOpacity><View style={{ flex: 1 }}><Text style={s.title}>Attendance register</Text><Text style={s.subtitle}>{role === 'TEACHER' ? 'Assigned students' : 'School register'} · {new Date().toLocaleDateString()}</Text></View><TouchableOpacity accessibilityLabel="Refresh attendance register" onPress={load} style={s.todayButton}><Ionicons name="refresh" size={17} color={colors.primary} /></TouchableOpacity></View>
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.overviewCard}><Ionicons name="people-outline" size={23} color={colors.primary} /><View style={s.overviewCopy}><Text style={s.overviewTitle}>{rows.length} recorded sessions</Text><Text style={s.overviewHint}>Marked by and time are shown for each record.</Text></View></View>
      {loading ? <View style={s.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={s.muted}>Loading register…</Text></View> : error ? <View style={s.errorCard}><Ionicons name="lock-closed-outline" size={25} color={colors.subText} /><Text style={s.errorText}>{error}</Text><TouchableOpacity onPress={load}><Text style={s.retry}>Retry</Text></TouchableOpacity></View> : rows.length ? rows.map(row => <View key={row.id} style={s.recordCard}><View style={[s.recordMarker, { backgroundColor: statusColor(row.status) }]} /><View style={{ flex: 1 }}><Text style={s.recordSubject}>{nameFor(row)}</Text><Text style={s.recordRemarks}>{[row.student?.studentProfile?.rollNo && `Roll ${row.student.studentProfile.rollNo}`, row.student?.studentProfile?.grade && `Class ${row.student.studentProfile.grade}${row.student.studentProfile.section ? ` · ${row.student.studentProfile.section}` : ''}`].filter(Boolean).join(' · ') || 'Student record'}</Text><Text style={s.recordRemarks}>Marked by {markerFor(row)} · {new Date(row.createdAt || row.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text></View><Text style={[s.recordStatus, { color: statusColor(row.status) }]}>{row.status.replace('_', ' ')}</Text></View>) : <View style={s.emptyCard}><Ionicons name="calendar-outline" size={20} color={colors.subText} /><Text style={s.emptyText}>No attendance has been recorded for today.</Text></View>}
    </ScrollView><BottomNavigation navigation={navigation} activeRoute="Attendance" colors={colors} role={role} />
  </SafeAreaView>;
}

function LegendDot({ color, label, styles }: any) {
  return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendLabel}>{label}</Text></View>;
}

function StatCard({ value, label, accent, styles }: any) {
  return <View style={styles.statCard}><Text style={[styles.statValue, { color: accent }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const makeStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 11, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border }, back: { padding: 6, marginRight: 9 }, title: { color: c.text, fontSize: 19, fontWeight: '900' }, subtitle: { color: c.subText, fontSize: 11, marginTop: 2 }, todayButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: c.primary + '14' }, todayButtonText: { color: c.primary, fontSize: 11, fontWeight: '900' }, content: { padding: 15, paddingBottom: 25 },
  calendarCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 17, overflow: 'hidden' }, monthHeader: { height: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }, monthArrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: c.mutedSurface }, monthCopy: { alignItems: 'center' }, bsMonth: { color: c.text, fontSize: 15, fontWeight: '900' }, adMonth: { color: c.subText, fontSize: 10, marginTop: 3 }, weekHeader: { flexDirection: 'row', backgroundColor: c.mutedSurface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.border }, weekdayCell: { flex: 1, height: 33, alignItems: 'center', justifyContent: 'center' }, weekday: { color: c.subText, fontSize: 10, fontWeight: '900' }, saturday: { color: c.danger }, weekRow: { flexDirection: 'row' }, dayCell: { width: '14.2857%', height: 53, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderBottomWidth: 1, borderColor: c.border, position: 'relative' }, selectedDay: { backgroundColor: c.primary + '12', borderWidth: 1, borderColor: c.primary }, bsDay: { fontSize: 14, fontWeight: '800' }, todayDay: { textDecorationLine: 'underline' }, adDay: { color: c.subText, fontSize: 8, position: 'absolute', bottom: 4, right: 5 }, selectedAd: { color: c.primary, fontWeight: '800' }, statusDot: { width: 5, height: 5, borderRadius: 3, position: 'absolute', bottom: 3, left: 5 }, legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 11, paddingVertical: 11, borderTopWidth: 1, borderColor: c.border }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 }, legendDot: { width: 7, height: 7, borderRadius: 4 }, legendLabel: { color: c.subText, fontSize: 8, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 7, marginTop: 13 }, statCard: { flex: 1, minHeight: 68, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 12 }, statValue: { fontSize: 17, fontWeight: '900' }, statLabel: { color: c.subText, fontSize: 8, fontWeight: '800', marginTop: 3 }, overviewCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, marginTop: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14 }, rateRing: { width: 48, height: 48, borderWidth: 4, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, rateText: { color: c.text, fontSize: 11, fontWeight: '900' }, overviewCopy: { flex: 1 }, overviewTitle: { color: c.text, fontSize: 12, fontWeight: '900' }, overviewHint: { color: c.subText, fontSize: 9, marginTop: 4 }, daySectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 21, marginBottom: 10 }, sectionTitle: { color: c.text, fontSize: 15, fontWeight: '900' }, sectionSubtitle: { color: c.subText, fontSize: 9, marginTop: 3 }, recordCard: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, marginBottom: 7, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, recordMarker: { width: 8, height: 29, borderRadius: 5 }, recordSubject: { color: c.text, fontSize: 11, fontWeight: '800' }, recordRemarks: { color: c.subText, fontSize: 9, marginTop: 3 }, recordStatus: { fontSize: 9, fontWeight: '900' }, emptyCard: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 13, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 12 }, emptyText: { color: c.subText, fontSize: 10, flex: 1 }, loading: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 8 }, muted: { color: c.subText, fontSize: 10 }, errorCard: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 8 }, errorText: { color: c.subText, textAlign: 'center', fontSize: 10, lineHeight: 15 }, retry: { color: c.primary, fontSize: 11, fontWeight: '900' },
});
