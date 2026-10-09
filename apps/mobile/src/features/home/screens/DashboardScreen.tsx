import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../../core/theme/ThemeContext';
import BottomNavigation from '../../../core/components/BottomNavigation';
import { API_BASE_URL, api } from '../../../core/networking/api';
import { getInMemoryAccessToken, getCachedUserData } from '../../../core/networking/session';
import { currentBsMonth, getBsMonthLabels, getGregorianMonthsForBsMonth } from '../../../core/utils/bsCalendar';
import { isNoticeUnread, loadNoticeReadState, type NoticeReadState } from '../../../core/utils/noticeReadState';
import { getSelectedChildId, setSelectedChildId as persistSelectedChildId } from '../../../core/utils/childSelection';

type Props = { navigation: NativeStackNavigationProp<any> };
type Feature = { name: string; icon: any; route?: string; accent: string; note?: string; disabled?: boolean; expand?: boolean };
type Profile = { id: string; email: string; role: string; firstName?: string; lastName?: string; grade?: string | null; section?: string | null; studentId?: string | null; profilePictureUrl?: string | null };
type Notice = { id: string; title: string; content: string; category: string; date: string; createdAt?: string; author?: any };
type Attendance = { id: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY'; date: string };
type Child = { id: string; email: string; student: { id: string; email: string; studentProfile?: { firstName?: string; lastName?: string; grade?: string; section?: string; rollNo?: string }; enrollments?: { sectionId: string }[] } };
type OperationsSummary = { totalStudents?: number; totalTeachers?: number; activeNotices?: number; totalClasses?: number; assignments?: any[] };

const quickFeatures: Feature[] = [
  { name: 'Class routine', icon: 'calendar-outline', route: 'Routine', accent: '#16B86A' },
  { name: 'Homework', icon: 'document-text-outline', route: 'Homework', accent: '#2389F5' },
  { name: 'Library', icon: 'library-outline', route: 'Library', accent: '#8B5CF6' },
  { name: 'Complain', icon: 'chatbubble-ellipses-outline', route: 'Feedback', accent: '#F28B20' },
  { name: 'Online exams', icon: 'checkbox-outline', route: 'Exams', accent: '#10A981' },
  { name: 'Results', icon: 'podium-outline', route: 'Result', accent: '#F39A19' },
  { name: 'Upcoming exams', icon: 'calendar-clear-outline', route: 'Exams', accent: '#EF5261' },
  { name: 'View more', icon: 'grid-outline', accent: '#64748B', expand: true },
];

const operationalQuickFeatures: Feature[] = [
  { name: 'Class routine', icon: 'calendar-outline', route: 'Routine', accent: '#16B86A' },
  { name: 'Notices', icon: 'notifications-outline', route: 'Notice', accent: '#8B5CF6' },
  { name: 'Academic calendar', icon: 'calendar-number-outline', route: 'Calendar', accent: '#64748B' },
  { name: 'Attendance register', icon: 'checkmark-circle-outline', route: 'Attendance', accent: '#10A981' },
  { name: 'Homework manager', icon: 'document-text-outline', route: 'Homework', accent: '#2389F5' },
  { name: 'Upcoming exams', icon: 'calendar-clear-outline', route: 'Exams', accent: '#EF5261' },
  { name: 'Results', icon: 'podium-outline', route: 'Result', accent: '#F39A19' },
  { name: 'View more', icon: 'grid-outline', accent: '#64748B', expand: true },
];

const parentQuickFeatures: Feature[] = [
  { name: 'Fees & invoices', icon: 'receipt-outline', route: 'Fees', accent: '#D18A0A' },
  { name: 'Academic calendar', icon: 'calendar-number-outline', route: 'Calendar', accent: '#2389F5' },
  { name: 'Notices', icon: 'notifications-outline', route: 'Notice', accent: '#8B5CF6' },
  { name: 'Class routine', icon: 'calendar-outline', route: 'Routine', accent: '#16B86A' },
  { name: 'Homework', icon: 'document-text-outline', route: 'Homework', accent: '#2389F5', note: 'Select a child first' },
  { name: 'Attendance', icon: 'checkmark-circle-outline', route: 'Attendance', accent: '#10A981', note: 'Select a child first' },
  { name: 'Results', icon: 'podium-outline', route: 'Result', accent: '#F39A19', note: 'Select a child first' },
  { name: 'View more', icon: 'grid-outline', accent: '#64748B', expand: true },
];

const moreFeatureGroups: { title: string; features: Feature[] }[] = [
  { title: 'Learning', features: [
    { name: 'Online class', icon: 'videocam-outline', route: 'OnlineClass', accent: '#0EA5E9' },
    { name: 'Class chat', icon: 'chatbubbles-outline', route: 'Chat', accent: '#8B5CF6' },
    { name: 'Classmates & teachers', icon: 'people-outline', route: 'Directory', accent: '#64748B' },
  ] },
  { title: 'School & account', features: [
    { name: 'Notices', icon: 'notifications-outline', route: 'Notice', accent: '#EF5261' },
    { name: 'Attendance', icon: 'checkmark-circle-outline', route: 'Attendance', accent: '#16A36A' },
    { name: 'Academic calendar', icon: 'calendar-number-outline', route: 'Calendar', accent: '#2389F5' },
    { name: 'Fees & invoices', icon: 'receipt-outline', route: 'Fees', accent: '#D18A0A' },
    { name: 'Settings', icon: 'settings-outline', route: 'Profile', accent: '#14A9A1' },
  ] },
];

const operationalMoreFeatureGroups: { title: string; features: Feature[] }[] = [
  { title: 'School operations', features: [
    { name: 'People & accounts', icon: 'people-outline', route: 'StaffManagement', accent: '#14A9A1' },
    { name: 'Enrollments & Links', icon: 'link-outline', route: 'Enrollment', accent: '#8B5CF6' },
    { name: 'Academic structure', icon: 'school-outline', route: 'AcademicManagement', accent: '#2389F5' },
    { name: 'Audit logs', icon: 'shield-checkmark-outline', route: 'AuditLogs', accent: '#8B5CF6' },
    { name: 'Online class', icon: 'videocam-outline', route: 'OnlineClass', accent: '#0EA5E9' },
    { name: 'Class chat', icon: 'chatbubbles-outline', route: 'Chat', accent: '#8B5CF6', note: 'Coming soon', disabled: true },
    { name: 'Attendance register', icon: 'checkmark-circle-outline', route: 'Attendance', accent: '#16A36A' },
    { name: 'Fees review', icon: 'receipt-outline', accent: '#D18A0A', note: 'Management coming soon', disabled: true },
  ] },
  { title: 'Account', features: [
    { name: 'Notices', icon: 'notifications-outline', route: 'Notice', accent: '#EF5261' },
    { name: 'Academic calendar', icon: 'calendar-number-outline', route: 'Calendar', accent: '#2389F5' },
    { name: 'Settings', icon: 'settings-outline', route: 'Profile', accent: '#14A9A1' },
  ] },
];

const parentMoreFeatureGroups: { title: string; features: Feature[] }[] = [
  { title: 'Child and school', features: [
    { name: 'Class chat', icon: 'chatbubbles-outline', route: 'Chat', accent: '#8B5CF6', note: 'Coming soon', disabled: true },
    { name: 'Homework', icon: 'document-text-outline', accent: '#2389F5', note: 'Select a child first', disabled: true },
    { name: 'Attendance', icon: 'checkmark-circle-outline', accent: '#16A36A', note: 'Select a child first', disabled: true },
    { name: 'Results', icon: 'podium-outline', accent: '#F39A19', note: 'Select a child first', disabled: true },
  ] },
  { title: 'Account', features: [
    { name: 'Fees & invoices', icon: 'receipt-outline', route: 'Fees', accent: '#D18A0A' },
    { name: 'Notices', icon: 'notifications-outline', route: 'Notice', accent: '#EF5261' },
    { name: 'Academic calendar', icon: 'calendar-number-outline', route: 'Calendar', accent: '#2389F5' },
    { name: 'Settings', icon: 'settings-outline', route: 'Profile', accent: '#14A9A1' },
  ] },
];

const formatNoticeTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently posted' : date.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
};

const publisherName = (notice: Notice) => {
  const author = notice.author?.adminProfile || notice.author?.teacherProfile;
  return [author?.firstName, author?.lastName].filter(Boolean).join(' ') || 'School administration';
};

export default function DashboardScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { width } = useWindowDimensions();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticeReadState, setNoticeReadState] = useState<NoticeReadState>({ initialized: false, readThrough: 0, readIds: [] });
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noticeError, setNoticeError] = useState(false);
  const [attendanceError, setAttendanceError] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [operationsSummary, setOperationsSummary] = useState<OperationsSummary | null>(null);

  const loadDashboard = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else if (!profile) setLoading(true);
    setNoticeError(false);
    setAttendanceError(false);
    const [profileResult, noticesResult] = await Promise.allSettled([
      api.get('/users/me'),
      api.get('/notices', { params: { limit: 8 } }),
    ]);

    let currentProfile: Profile | null = null;
    if (profileResult.status === 'fulfilled') {
      currentProfile = profileResult.value.data as Profile;
      setProfile(currentProfile);
      setAvatarVersion(Date.now());
    } else {
      setProfile(null);
      try {
        const raw = await getCachedUserData();
        if (raw) {
          currentProfile = JSON.parse(raw) as Profile;
          setProfile(currentProfile);
        }
      } catch { /* Keep the dashboard available with its default identity. */ }
    }

    if (noticesResult.status === 'fulfilled') {
      const fetchedNotices = Array.isArray(noticesResult.value.data) ? noticesResult.value.data : [];
      setNotices(fetchedNotices);
      setNoticeReadState(await loadNoticeReadState(fetchedNotices));
    } else {
      setNotices([]);
      setNoticeReadState(await loadNoticeReadState());
      setNoticeError(true);
    }

    if (currentProfile?.role === 'STUDENT' && currentProfile.id) {
      try {
        const months = getGregorianMonthsForBsMonth(currentBsMonth());
        const responses = await Promise.all(months.map(({ year, month }) => api.get(
          `/attendance/student/${encodeURIComponent(currentProfile!.id)}`,
          { params: { month: month + 1, year } },
        )));
        const rows = responses.flatMap(response => Array.isArray(response.data) ? response.data : []) as Attendance[];
        setAttendance([...new Map(rows.map(record => [record.id, record])).values()]);
      } catch { setAttendance([]); setAttendanceError(true); }
    } else {
      setAttendance([]);
    }
    if (currentProfile?.role === 'PARENT') {
      try {
        const { data } = await api.get('/academics/children');
        const linked = Array.isArray(data) ? data : [];
        setChildren(linked);
        const saved = await getSelectedChildId();
        const selected = linked.find((item: Child) => item.student.id === saved) || linked[0];
        if (selected) { setSelectedChildId(selected.student.id); await persistSelectedChildId(selected.student.id); }
      } catch { setChildren([]); }
    } else { setChildren([]); setSelectedChildId(''); }
    if (currentProfile && ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(currentProfile.role)) {
      try {
        const { data } = await api.get('/dashboard/summary');
        setOperationsSummary(data.kpis || { assignments: data.assignments || [] });
      } catch { setOperationsSummary(null); }
    } else setOperationsSummary(null);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const identity = useMemo(() => {
    const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || profile?.email?.split('@')[0] || 'Student';
    const detail = profile?.grade
      ? `Class ${profile.grade}${profile.section ? ` · ${profile.section}` : ''}`
      : (profile?.role || 'School account').toLowerCase().replace('_', ' ');
    return { name, detail };
  }, [profile]);

  const presentCount = attendance.filter(item => item.status === 'PRESENT').length;
  const absentCount = attendance.filter(item => item.status === 'ABSENT').length;
  const rate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;
  const monthLabels = getBsMonthLabels(currentBsMonth());
  // Keep one notice fully visible with a useful preview of the next one on
  // phones, while allowing larger screens to use a wider reading surface.
  const cardWidth = Math.min(520, Math.max(230, (width - 58) * 0.72));
  const isOperationalRole = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(profile?.role || '');
  const isParentRole = profile?.role === 'PARENT';

  const openFeature = (feature: Feature) => {
    if (feature.expand) { setShowAllFeatures(value => !value); return; }
    if (feature.route) navigation.navigate(feature.route);
  };

  return <SafeAreaView style={s.screen}>
    <View style={s.header}>
      <TouchableOpacity accessibilityLabel="Open profile settings" onPress={() => navigation.navigate('Profile')} style={s.identity}>
        {profile?.profilePictureUrl ? <Image source={{ uri: `${API_BASE_URL}${profile.profilePictureUrl}?v=${avatarVersion}`, headers: { Authorization: `Bearer ${getInMemoryAccessToken() || ''}` } }} style={s.avatar} /> : <View style={s.avatar}><Text style={s.avatarText}>{identity.name.slice(0, 1).toUpperCase()}</Text></View>}
        <View style={s.identityCopy}><Text numberOfLines={1} style={s.greeting}>Hi, {identity.name}</Text><Text numberOfLines={1} style={s.meta}>{identity.detail}</Text></View>
      </TouchableOpacity>
      <View style={s.headerActions}>
        <TouchableOpacity accessibilityLabel="Open notices" onPress={() => navigation.navigate('Notice')} style={s.headerButton}><Ionicons name="notifications-outline" size={25} color={colors.text} />{notices.some(notice => isNoticeUnread(notice, noticeReadState)) && <View style={s.notificationDot} />}</TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Open settings" onPress={() => navigation.navigate('Profile')} style={s.headerButton}><Ionicons name="settings-outline" size={26} color={colors.text} /></TouchableOpacity>
      </View>
    </View>

    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} tintColor={colors.primary} />}
    >
      <View style={s.sectionCard}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Quick access</Text>
        </View>
        <View style={s.quickGrid}>{(isOperationalRole ? operationalQuickFeatures : isParentRole ? parentQuickFeatures : quickFeatures).map(feature => <QuickTile key={feature.name} feature={feature} styles={s} onPress={() => openFeature(feature)} />)}</View>
        {showAllFeatures && <View style={s.moreFeatures}>
          {(isOperationalRole ? operationalMoreFeatureGroups : isParentRole ? parentMoreFeatureGroups : moreFeatureGroups).map(group => <View key={group.title} style={s.moreGroup}>
            <Text style={s.moreGroupTitle}>{group.title}</Text>
            <View style={s.moreGrid}>{group.features.map(feature => <MoreTile key={feature.name} feature={feature} styles={s} onPress={() => openFeature(feature)} />)}</View>
          </View>)}
        </View>}
      </View>

      {isParentRole && <View style={s.sectionCard}>
        <View style={s.sectionHeader}><View><Text style={s.sectionTitle}>Selected child</Text><Text style={s.sectionHint}>Choose which child’s records to view</Text></View><Ionicons name="people-outline" size={21} color={colors.primary} /></View>
        {children.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{children.map(child => { const profile = child.student.studentProfile; const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || child.student.email; const active = selectedChildId === child.student.id; return <TouchableOpacity key={child.student.id} onPress={async () => { setSelectedChildId(child.student.id); await persistSelectedChildId(child.student.id); }} style={[s.childChip, active && s.childChipActive]}><Text style={[s.childChipName, active && s.childChipNameActive]} numberOfLines={1}>{name}</Text><Text style={[s.childChipMeta, active && s.childChipMetaActive]}>{profile?.grade ? `Class ${profile.grade}${profile.section ? ` · ${profile.section}` : ''}` : 'Student'}</Text></TouchableOpacity>; })}</ScrollView> : <Text style={s.mutedText}>No linked children are available yet.</Text>}
      </View>}

      {isOperationalRole && operationsSummary && operationsSummary.totalStudents !== undefined && <View style={s.sectionCard}>
        <View style={s.sectionHeader}><View><Text style={s.sectionTitle}>School snapshot</Text><Text style={s.sectionHint}>Live operations overview</Text></View><Ionicons name="analytics-outline" size={21} color={colors.primary} /></View>
        <View style={s.operationsGrid}>
          <OperationStat value={String(operationsSummary.totalStudents || 0)} label="Students" tint={colors.primary} styles={s} />
          <OperationStat value={String(operationsSummary.totalTeachers || 0)} label="Teachers" tint={colors.success} styles={s} />
          <OperationStat value={String(operationsSummary.totalClasses || 0)} label="Classes" tint={colors.warning} styles={s} />
          <OperationStat value={String(operationsSummary.activeNotices || 0)} label="Notices" tint="#8B5CF6" styles={s} />
        </View>
      </View>}

      {profile?.role === 'TEACHER' && operationsSummary && operationsSummary.assignments && <View style={s.sectionCard}>
        <View style={s.sectionHeader}><View><Text style={s.sectionTitle}>My Classes</Text><Text style={s.sectionHint}>Your current assignments</Text></View><Ionicons name="book-outline" size={21} color={colors.primary} /></View>
        {operationsSummary.assignments.length === 0 ? <Text style={s.mutedText}>No assigned classes.</Text> : <View style={{ gap: 10, marginTop: 10 }}>
          {operationsSummary.assignments.map((assignment: any) => (
            <View key={assignment.id} style={{ padding: 12, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{assignment.subject?.name}</Text>
              <Text style={{ color: colors.subText, fontSize: 12, marginTop: 4 }}>Class {assignment.section?.class?.name} · {assignment.section?.name}</Text>
            </View>
          ))}
        </View>}
      </View>}

      {profile?.role === 'STUDENT' && <View style={s.sectionCard}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>My attendance</Text>
          <Text style={s.sectionHint}>This BS month · {monthLabels.bs}</Text>
        </View>
        {loading ? <View style={s.attendanceLoading}><ActivityIndicator color={colors.primary} /><Text style={s.mutedText}>Loading attendance…</Text></View> : attendanceError ? <View style={s.attendanceError}><Text style={s.mutedText}>Attendance couldn’t load.</Text><TouchableOpacity onPress={() => loadDashboard(true)}><Text style={s.viewAllText}>Retry</Text></TouchableOpacity></View> : <>
          <View style={s.attendanceBody}>
            <View style={s.progressRing}><View style={s.ringInner}><Text style={s.rateValue}>{rate}%</Text><Text style={s.rateCaption}>Present</Text></View></View>
            <View style={s.attendanceStats}>
              <AttendanceStat value={String(attendance.length)} label="Total" tint={colors.primary} styles={s} />
              <AttendanceStat value={String(presentCount)} label="Present" tint={colors.success} styles={s} />
              <AttendanceStat value={String(absentCount)} label="Absent" tint={colors.danger} styles={s} />
            </View>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('Attendance')} style={s.attendanceLink}>
            <Ionicons name="stats-chart" size={20} color={colors.primary} /><Text style={s.attendanceLinkText}>View full attendance</Text><Ionicons name="chevron-forward" size={19} color={colors.primary} />
          </TouchableOpacity>
        </>}
      </View>}

      <View style={s.sectionCard}>
        <View style={s.sectionHeader}>
          <View><Text style={s.sectionTitle}>News & updates</Text><Text style={s.sectionHint}>Latest from your school</Text></View>
          <TouchableOpacity accessibilityLabel="View all notices" onPress={() => navigation.navigate('Notice')} style={s.viewAllButton}><Text style={s.viewAllText}>View all</Text><Ionicons name="chevron-forward" size={17} color={colors.primary} /></TouchableOpacity>
        </View>
        {loading && notices.length === 0 ? <View style={s.noticeState}><ActivityIndicator color={colors.primary} /><Text style={s.mutedText}>Loading notices…</Text></View> : noticeError ? <View style={s.noticeState}><Ionicons name="cloud-offline-outline" size={22} color={colors.subText} /><Text style={s.mutedText}>Notices couldn’t load. Pull down to retry.</Text></View> : notices.length === 0 ? <View style={s.noticeState}><Ionicons name="notifications-off-outline" size={22} color={colors.subText} /><Text style={s.mutedText}>No school updates yet.</Text></View> : <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={cardWidth + 12} decelerationRate="fast" contentContainerStyle={s.noticeCarousel}>
          {notices.slice(0, 2).map(notice => (
            <TouchableOpacity key={notice.id} activeOpacity={0.9} onPress={() => navigation.navigate('Notice')} style={[s.noticeCard, { width: cardWidth }]}
            >
            <View style={s.noticeMetaRow}><View style={s.noticeBadge}><Text style={s.noticeBadgeText}>{notice.category || 'Notice'}</Text></View><Text numberOfLines={1} style={s.publisher}>{publisherName(notice)}</Text></View>
            <View style={s.noticeContentRow}><View style={s.noticeCopy}><Text numberOfLines={2} style={s.noticeTitle}>{notice.title}</Text><Text numberOfLines={3} style={s.noticePreview}>{notice.content}</Text></View><View style={s.noticeIcon}><Ionicons name="megaphone-outline" size={21} color={colors.primary} /></View></View>
            <View style={s.noticeFooter}><Ionicons name="time-outline" size={13} color={colors.subText} /><Text numberOfLines={1} style={s.noticeDate}>{formatNoticeTime(notice.date || notice.createdAt || '')}</Text></View>
          </TouchableOpacity>))}
        </ScrollView>}
      </View>
    </ScrollView>
    <BottomNavigation navigation={navigation} activeRoute="Dashboard" colors={colors} role={profile?.role} />
  </SafeAreaView>;
}

function QuickTile({ feature, styles, onPress }: { feature: Feature; styles: any; onPress: () => void }) {
  return <TouchableOpacity disabled={feature.disabled} accessibilityRole="button" accessibilityState={{ disabled: feature.disabled }} onPress={onPress} style={[styles.quickTile, feature.disabled && styles.quickTileDisabled]}>
    <View style={[styles.quickIcon, { backgroundColor: `${feature.accent}18` }]}><Ionicons name={feature.icon} size={27} color={feature.accent} /></View>
    <Text numberOfLines={2} style={styles.quickLabel}>{feature.name}</Text>
  </TouchableOpacity>;
}

function MoreTile({ feature, styles, onPress }: { feature: Feature; styles: any; onPress: () => void }) {
  return <TouchableOpacity disabled={feature.disabled} accessibilityRole="button" accessibilityState={{ disabled: feature.disabled }} onPress={onPress} style={[styles.moreTile, feature.disabled && styles.moreTileDisabled]}>
    <View style={[styles.moreIcon, { backgroundColor: `${feature.accent}18` }]}><Ionicons name={feature.icon} size={19} color={feature.accent} /></View>
    <View style={styles.moreCopy}><Text numberOfLines={1} style={styles.moreLabel}>{feature.name}</Text>{feature.note && <Text style={styles.moreNote}>{feature.note}</Text>}</View>
    {!feature.disabled && <Ionicons name="chevron-forward" size={15} color={styles.subTextColor} />}
  </TouchableOpacity>;
}

function AttendanceStat({ value, label, tint, styles }: { value: string; label: string; tint: string; styles: any }) {
  return <View style={[styles.attendanceStat, { backgroundColor: `${tint}12` }]}><Text style={[styles.attendanceValue, { color: tint }]}>{value}</Text><Text numberOfLines={1} style={styles.attendanceLabel}>{label}</Text></View>;
}

function OperationStat({ value, label, tint, styles }: { value: string; label: string; tint: string; styles: any }) {
  return <View style={[styles.operationStat, { backgroundColor: `${tint}12` }]}><Text style={[styles.operationValue, { color: tint }]}>{value}</Text><Text style={styles.operationLabel}>{label}</Text></View>;
}

const makeStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  header: { minHeight: 82, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17, paddingVertical: 12, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border },
  identity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', marginRight: 8 }, avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '18', marginRight: 11 }, avatarText: { color: c.primary, fontSize: 21, fontWeight: '900' }, identityCopy: { flex: 1, minWidth: 0 }, greeting: { color: c.text, fontSize: 19, fontWeight: '900' }, meta: { color: c.subText, fontSize: 13, marginTop: 3, textTransform: 'capitalize' }, headerActions: { flexDirection: 'row', alignItems: 'center', gap: 7 }, headerButton: { width: 42, height: 44, alignItems: 'center', justifyContent: 'center', position: 'relative' }, notificationDot: { position: 'absolute', right: 8, top: 5, width: 9, height: 9, borderRadius: 5, backgroundColor: c.danger, borderWidth: 1, borderColor: c.card },
  scrollContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24, gap: 13 }, sectionCard: { padding: 15, backgroundColor: c.card, borderRadius: 19, borderWidth: 1, borderColor: c.border, shadowColor: '#18223A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.045, shadowRadius: 8, elevation: 2 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }, sectionTitle: { color: c.text, fontSize: 19, fontWeight: '900' }, sectionHint: { color: c.subText, fontSize: 11, marginTop: 3 }, viewAllButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 8 }, viewAllText: { color: c.primary, fontSize: 13, fontWeight: '700' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 13 }, quickTile: { width: '23.5%', minHeight: 93, alignItems: 'center', justifyContent: 'flex-start' }, quickTileDisabled: { opacity: 0.62 }, quickIcon: { width: 61, height: 61, maxWidth: '100%', borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, quickLabel: { color: c.text, fontSize: 11, lineHeight: 14, textAlign: 'center', marginTop: 7, paddingHorizontal: 2 }, childChip: { minWidth: 130, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, backgroundColor: c.mutedSurface, borderWidth: 1, borderColor: c.border }, childChipActive: { backgroundColor: c.primary + '14', borderColor: c.primary }, childChipName: { color: c.text, fontSize: 12, fontWeight: '800' }, childChipNameActive: { color: c.primary }, childChipMeta: { color: c.subText, fontSize: 9, marginTop: 3 }, childChipMetaActive: { color: c.primary }, moreFeatures: { marginTop: 15, paddingTop: 14, borderTopWidth: 1, borderColor: c.border }, moreGroup: { marginBottom: 11 }, moreGroupTitle: { color: c.subText, fontSize: 10, fontWeight: '900', letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 6 }, moreGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, moreTile: { width: '49%', minHeight: 53, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, marginBottom: 5, borderRadius: 12, backgroundColor: c.mutedSurface }, moreTileDisabled: { opacity: 0.65 }, moreIcon: { width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 8 }, moreCopy: { flex: 1, minWidth: 0 }, moreLabel: { color: c.text, fontSize: 10, fontWeight: '700' }, moreNote: { color: c.subText, fontSize: 9, marginTop: 2 }, subTextColor: c.subText,
  attendanceBody: { flexDirection: 'row', alignItems: 'center', gap: 12 }, progressRing: { width: 102, height: 102, borderRadius: 51, borderWidth: 9, borderColor: c.success, alignItems: 'center', justifyContent: 'center' }, ringInner: { alignItems: 'center', justifyContent: 'center' }, rateValue: { color: c.text, fontSize: 24, lineHeight: 29, fontWeight: '900' }, rateCaption: { color: c.subText, fontSize: 11, marginTop: 1 }, attendanceStats: { flex: 1, flexDirection: 'row', gap: 7 }, attendanceStat: { flex: 1, minWidth: 0, height: 67, alignItems: 'center', justifyContent: 'center', borderRadius: 13, paddingHorizontal: 4 }, attendanceValue: { fontSize: 21, fontWeight: '900' }, attendanceLabel: { color: c.text, fontSize: 9, marginTop: 4 }, attendanceLink: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, paddingHorizontal: 13, borderRadius: 13, backgroundColor: c.primary + '12' }, attendanceLinkText: { flex: 1, color: c.primary, fontSize: 13, fontWeight: '800' }, attendanceLoading: { minHeight: 118, alignItems: 'center', justifyContent: 'center', gap: 8 }, attendanceError: { minHeight: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, mutedText: { color: c.subText, fontSize: 11 },
  operationsGrid: { flexDirection: 'row', gap: 7 }, operationStat: { flex: 1, minHeight: 68, alignItems: 'center', justifyContent: 'center', borderRadius: 13 }, operationValue: { fontSize: 21, fontWeight: '900' }, operationLabel: { color: c.text, fontSize: 9, marginTop: 4 },
  noticeCarousel: { paddingRight: 2, gap: 12 }, noticeCard: { minHeight: 181, padding: 12, borderRadius: 15, borderWidth: 1, borderColor: c.border, backgroundColor: c.card }, noticeMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, noticeBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, backgroundColor: c.primary + '14' }, noticeBadgeText: { color: c.primary, fontSize: 10, fontWeight: '800', textTransform: 'capitalize' }, publisher: { flex: 1, color: c.subText, fontSize: 9, textAlign: 'right' }, noticeContentRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, paddingBottom: 8 }, noticeCopy: { flex: 1, minWidth: 0 }, noticeTitle: { color: c.text, fontSize: 14, lineHeight: 19, fontWeight: '800' }, noticePreview: { color: c.subText, fontSize: 11, lineHeight: 16, marginTop: 5 }, noticeIcon: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '12' }, noticeFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderColor: c.border, paddingTop: 8 }, noticeDate: { flex: 1, color: c.subText, fontSize: 9 }, noticeState: { minHeight: 94, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
