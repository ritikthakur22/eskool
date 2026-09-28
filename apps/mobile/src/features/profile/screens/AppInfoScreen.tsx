import React, { useState } from 'react';
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';

const faqs = [
  { q: 'How do I reset my password?', a: 'Use Change app password in Settings while signed in. If you cannot sign in, contact your school administrator.' },
  { q: 'Why can’t I see my attendance or fees?', a: 'Your school controls which records are available in the app. Contact the school office if information looks incomplete.' },
  { q: 'How do I enable biometric login?', a: 'Open Settings → Biometric login and enable it after face or fingerprint unlock is set up on this device.' },
];

export default function AppInfoScreen({ navigation }: any) {
  const { colors } = useTheme(); const s = makeStyles(colors); const [openFaq, setOpenFaq] = useState<number | null>(null);
  const openSupport = () => Linking.openURL('mailto:contact@eskool.com?subject=eSkool%20support').catch(() => undefined);
  return <SafeAreaView style={s.screen}>
    <View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Ionicons name="chevron-back" size={24} color={colors.text} /></TouchableOpacity><Text style={s.headerTitle}>App info</Text><View style={{ width: 36 }} /></View>
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.brandCard}><View style={s.logo}><Ionicons name="school" size={31} color={colors.primary} /></View><Text style={s.appName}>eSkool</Text><Text style={s.tagline}>Your school, all in one place</Text></View>
      <Text style={s.section}>APPLICATION</Text><View style={s.card}><InfoRow label="Version" value="1.0.0" /><InfoRow label="Package name" value="com.eskool.crdy" last /></View>
      <Text style={s.section}>DEVELOPMENT & SUPPORT</Text><View style={s.card}><InfoRow label="Developed by" value="eSkool Team" /><TouchableOpacity onPress={openSupport} style={s.infoRow}><Text style={s.infoLabel}>Support email</Text><Text style={[s.infoValue, { color: colors.primary }]}>contact@eskool.com</Text></TouchableOpacity></View>
      <View style={s.faqHeading}><Text style={s.section}>FREQUENTLY ASKED QUESTIONS</Text><Ionicons name="help-circle-outline" size={20} color={colors.primary} /></View>
      <View style={s.card}>{faqs.map((item, i) => <TouchableOpacity key={item.q} onPress={() => setOpenFaq(openFaq === i ? null : i)} style={[s.faq, i === faqs.length - 1 && { borderBottomWidth: 0 }]}><View style={s.faqTop}><Text style={s.question}>{item.q}</Text><Ionicons name={openFaq === i ? 'remove' : 'add'} size={19} color={colors.primary} /></View>{openFaq === i && <Text style={s.answer}>{item.a}</Text>}</TouchableOpacity>)}</View>
      <Text style={s.footer}>For account access or school-record issues, please contact your school administrator.</Text>
    </ScrollView>
  </SafeAreaView>;
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const { colors } = useTheme(); const s = makeStyles(colors);
  return <View style={[s.infoRow, last && { borderBottomWidth: 0 }]}><Text style={s.infoLabel}>{label}</Text><Text style={s.infoValue}>{value}</Text></View>;
}

const makeStyles = (c: any) => StyleSheet.create({ screen: { flex: 1, backgroundColor: c.background }, header: { height: 58, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }, back: { width: 36, height: 38, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: c.text, fontSize: 19, fontWeight: '900' }, content: { padding: 17, paddingBottom: 32 }, brandCard: { alignItems: 'center', paddingVertical: 21, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 18 }, logo: { width: 58, height: 58, borderRadius: 19, backgroundColor: c.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, appName: { color: c.text, fontSize: 22, fontWeight: '900' }, tagline: { color: c.subText, fontSize: 12, marginTop: 4 }, section: { color: c.subText, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 22, marginBottom: 9, marginLeft: 3 }, card: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 16, paddingHorizontal: 14 }, infoRow: { minHeight: 52, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: c.border, gap: 12 }, infoLabel: { color: c.subText, fontSize: 12 }, infoValue: { color: c.text, fontSize: 12, fontWeight: '700', textAlign: 'right', flexShrink: 1 }, faqHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, faq: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border }, faqTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, question: { color: c.text, fontSize: 12, fontWeight: '700', flex: 1 }, answer: { color: c.subText, fontSize: 11, lineHeight: 18, marginTop: 9, paddingRight: 20 }, footer: { color: c.subText, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 18 } });
