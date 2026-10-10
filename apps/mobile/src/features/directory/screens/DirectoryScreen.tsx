import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, RefreshControl, FlatList, StyleSheet, Text, TouchableOpacity, View, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../../core/networking/api';
import { useTheme } from '../../../core/theme/ThemeContext';
import BottomNavigation from '../../../core/components/BottomNavigation';

export default function DirectoryScreen({ navigation }: any) {
  const { colors } = useTheme(); 
  const s = useMemo(() => makeStyles(colors), [colors]); 
  const [tab, setTab] = useState('Teachers'); 
  const [role, setRole] = useState(''); 
  const [teachers, setTeachers] = useState<any[]>([]); 
  const [students, setStudents] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false); 
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => { 
    refresh ? setRefreshing(true) : setLoading(true); 
    setError(''); 
    try { 
      const saved = await SecureStore.getItemAsync('user_data'); 
      const current = saved ? JSON.parse(saved) : {}; 
      setRole(current.role || ''); 
      const [profileResponse, structureResponse] = await Promise.all([api.get('/users/me'), api.get('/academics/structure')]); 
      const profile = profileResponse.data; 
      const structure = structureResponse.data || {}; 
      setTeachers(structure.assignments || []); 
      let sectionId = ''; 
      if (profile.role === 'PARENT') { 
        const children = await api.get('/academics/children'); 
        const child = children.data?.[0]; 
        sectionId = child?.student?.enrollments?.[0]?.sectionId || ''; 
      } else { 
        const match = (structure.classes || []).flatMap((item: any) => item.sections || []).find((section: any) => section.name === profile.section); 
        sectionId = match?.id || ''; 
      } 
      if (sectionId) { 
        const response = await api.get(`/academics/sections/${sectionId}/students`); 
        setStudents(Array.isArray(response.data) ? response.data : []); 
      } else setStudents([]); 
    } catch (e: any) { 
      setError(e.response?.data?.message || 'Directory could not be loaded.'); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    } 
  }, []);

  useEffect(() => { load(); }, [load]);
  
  const teacherName = (item: any) => [item.teacher?.teacherProfile?.firstName, item.teacher?.teacherProfile?.lastName].filter(Boolean).join(' ') || item.teacher?.email || 'Teacher';
  const studentName = (item: any) => [item.student?.studentProfile?.firstName, item.student?.studentProfile?.lastName].filter(Boolean).join(' ') || item.student?.email || 'Student';

  const renderTeacher: ListRenderItem<any> = useCallback(({ item }) => (
    <View style={s.personCard}>
      <View style={[s.avatar, { backgroundColor: colors.primary + '16' }]}>
        <Ionicons name="school-outline" size={24} color={colors.primary} />
      </View>
      <View style={s.personCopy}>
        <Text style={s.name}>{teacherName(item)}</Text>
        <Text style={s.detail}>{item.subject?.name || 'Assigned teacher'} · {item.section?.class?.name || 'Class'} {item.section?.name || ''}</Text>
      </View>
    </View>
  ), [s, colors.primary]);

  const renderStudent: ListRenderItem<any> = useCallback(({ item }) => (
    <View style={s.personCard}>
      <View style={[s.avatar, { backgroundColor: colors.success + '16' }]}>
        <Text style={[s.initial, { color: colors.success }]}>{studentName(item).slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={s.personCopy}>
        <Text style={s.name}>{studentName(item)}</Text>
        <Text style={s.detail}>Roll {item.rollNo || item.student?.studentProfile?.rollNo || '—'}</Text>
      </View>
    </View>
  ), [s, colors.success]);

  const renderListEmptyComponent = () => {
    if (loading) {
      return (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={s.muted}>Loading directory…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.subText} />
          <Text style={s.muted}>{error}</Text>
          <TouchableOpacity onPress={() => load()} accessibilityRole="button" accessibilityLabel="Try again" style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={s.link}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (tab === 'Teachers') {
      return <Empty text="No teacher assignments are visible for this account yet." styles={s} />;
    }
    return <Empty text="Classmates are not available until your class section is assigned." styles={s} />;
  };

  const listData = (loading || error) ? [] : (tab === 'Teachers' ? teachers : students);
  const renderItem = tab === 'Teachers' ? renderTeacher : renderStudent;
  const keyExtractor = useCallback((item: any, index: number) => item.id?.toString() || item.studentId?.toString() || index.toString(), []);

  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back} accessibilityRole="button" accessibilityLabel="Go Back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerCopy}>
          <Text style={s.eyebrow}>SCHOOL DIRECTORY</Text>
          <Text style={s.title} accessibilityRole="header">People</Text>
        </View>
        <TouchableOpacity onPress={() => load(true)} style={s.refresh} accessibilityRole="button" accessibilityLabel="Refresh Directory">
          <Ionicons name="refresh-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={s.tabs}>
        {['Teachers', 'Classmates'].map(item => (
          <TouchableOpacity key={item} onPress={() => setTab(item)} style={[s.tab, tab === item && s.activeTab]} accessibilityRole="tab" accessibilityState={{ selected: tab === item }}>
            <Ionicons name={item === 'Teachers' ? 'school-outline' : 'people-outline'} size={20} color={tab === item ? colors.primary : colors.subText} />
            <Text style={[s.tabText, tab === item && s.activeText]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList 
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.content}
        ListEmptyComponent={renderListEmptyComponent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      />
      <BottomNavigation navigation={navigation} activeRoute="Dashboard" colors={colors} role={role} />
    </SafeAreaView>
  );
}

function Empty({ text, styles: s }: any) { 
  return (
    <View style={s.center}>
      <Ionicons name="people-outline" size={40} color="#9CA3AF" />
      <Text style={s.muted}>{text}</Text>
    </View>
  ); 
}

const makeStyles = (c: any) => StyleSheet.create({ 
  screen: { flex: 1, backgroundColor: c.background }, 
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: c.card, borderBottomWidth: 1, borderColor: c.border, minHeight: 60 }, 
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, 
  headerCopy: { flex: 1, marginLeft: 8 }, 
  eyebrow: { color: c.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }, 
  title: { color: c.text, fontSize: 24, fontWeight: '900', marginTop: 2 }, 
  refresh: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, 
  tabs: { flexDirection: 'row', backgroundColor: c.card, borderBottomWidth: 1, borderColor: c.border }, 
  tab: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' }, 
  activeTab: { borderBottomColor: c.primary }, 
  tabText: { color: c.subText, fontSize: 14, fontWeight: '800' }, 
  activeText: { color: c.primary }, 
  content: { padding: 15, paddingBottom: 30, flexGrow: 1 }, 
  personCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginBottom: 12, borderRadius: 16, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, 
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, 
  initial: { fontSize: 20, fontWeight: '900' }, 
  personCopy: { flex: 1 }, 
  name: { color: c.text, fontSize: 16, fontWeight: '900' }, 
  detail: { color: c.subText, fontSize: 12, marginTop: 4 }, 
  center: { minHeight: 200, flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 25 }, 
  muted: { color: c.subText, fontSize: 14, lineHeight: 20, textAlign: 'center' }, 
  link: { color: c.primary, fontSize: 14, fontWeight: '900' } 
});
