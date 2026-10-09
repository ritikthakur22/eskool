import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../core/networking/api';
import { useTheme } from '../../../core/theme/ThemeContext';

const PAGE_SIZE = 15;

export default function AuditLogScreen({ navigation }: any) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  
  const [items, setItems] = useState<any[]>([]);
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/audit-logs', { 
        params: { action: action.trim() || undefined, entity: entity.trim() || undefined, limit: PAGE_SIZE, offset: 0 } 
      });
      setItems(Array.isArray(data?.items) ? data.items : []);
      setHasMore(data?.hasMore || false);
    } catch (e: any) {
      setError(e.response?.status === 403 ? 'Only administrators can view audit logs.' : 'Could not load audit logs.');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [action, entity]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const currentOffset = items.length;
      const { data } = await api.get('/audit-logs', { 
        params: { action: action.trim() || undefined, entity: entity.trim() || undefined, limit: PAGE_SIZE, offset: currentOffset } 
      });
      const newItems = Array.isArray(data?.items) ? data.items : [];
      if (newItems.length > 0) setItems(prev => [...prev, ...newItems]);
      setHasMore(data?.hasMore || false);
    } catch (e) {
      console.log('Failed to load more logs');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.icon}><Ionicons name="shield-checkmark-outline" size={19} color={colors.primary} /></View>
      <View style={s.copy}>
        <Text style={s.action}>{item.action}</Text>
        <Text style={s.detail}>{item.entity}{item.entityId ? ` · ${item.entityId.slice(0, 8)}…` : ''}</Text>
        <Text style={s.meta}>{item.user?.email || 'System'} · {new Date(item.createdAt).toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Ionicons name="chevron-back" size={23} color={colors.text} /></TouchableOpacity>
        <View style={s.headerCopy}><Text style={s.eyebrow}>SECURITY & OPERATIONS</Text><Text style={s.title}>Audit logs</Text></View>
        <TouchableOpacity onPress={() => load(true)} style={s.refresh}><Ionicons name="refresh-outline" size={20} color={colors.primary} /></TouchableOpacity>
      </View>
      <View style={s.filters}>
        <TextInput value={action} onChangeText={setAction} onSubmitEditing={() => load()} placeholder="Action, e.g. USER_UPDATED" placeholderTextColor={colors.subText} style={s.input} />
        <TextInput value={entity} onChangeText={setEntity} onSubmitEditing={() => load()} placeholder="Entity, e.g. User" placeholderTextColor={colors.subText} style={s.input} />
      </View>
      
      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.primary} /><Text style={s.muted}>Loading audit activity…</Text></View>
      ) : error ? (
        <View style={s.center}><Ionicons name="lock-closed-outline" size={33} color={colors.subText} /><Text style={s.muted}>{error}</Text><TouchableOpacity onPress={() => load()}><Text style={s.link}>Try again</Text></TouchableOpacity></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<View style={s.center}><Ionicons name="document-text-outline" size={34} color={colors.subText} /><Text style={s.muted}>No audit activity matches these filters.</Text></View>}
          ListFooterComponent={loadingMore ? <View style={{ padding: 20 }}><ActivityIndicator color={colors.primary} /></View> : null}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({ screen: { flex: 1, backgroundColor: c.background }, header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: c.card, borderBottomWidth: 1, borderColor: c.border }, back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 8 }, eyebrow: { color: c.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }, title: { color: c.text, fontSize: 21, fontWeight: '900', marginTop: 2 }, refresh: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, filters: { padding: 12, gap: 8, backgroundColor: c.background }, input: { height: 44, color: c.text, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 11, paddingHorizontal: 11, fontSize: 11 }, content: { padding: 15, paddingBottom: 30 }, card: { flexDirection: 'row', gap: 10, padding: 13, marginBottom: 8, borderRadius: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, icon: { width: 37, height: 37, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary + '14' }, copy: { flex: 1 }, action: { color: c.text, fontSize: 12, fontWeight: '900' }, detail: { color: c.subText, fontSize: 10, marginTop: 4 }, meta: { color: c.subText, fontSize: 9, marginTop: 5 }, center: { minHeight: 200, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 25 }, muted: { color: c.subText, fontSize: 12, textAlign: 'center' }, link: { color: c.primary, fontSize: 12, fontWeight: '900' } });
