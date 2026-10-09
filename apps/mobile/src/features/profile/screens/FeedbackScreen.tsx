import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../core/theme/ThemeContext';

export default function FeedbackScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const [feedback, setFeedback] = useState('');
  const isLeaveRequest = route?.params?.mode === 'leave';
  const isComplaint = route?.params?.mode === 'complaint';
  const title = isLeaveRequest ? 'Request Leave' : isComplaint ? 'Submit a Complaint' : 'Send Feedback';
  const prompt = isLeaveRequest ? 'Describe the dates and reason for your leave request.' : isComplaint ? 'Tell the school what happened and how it can help.' : 'How can we improve the app?';
  const placeholder = isLeaveRequest ? 'Leave dates and reason…' : isComplaint ? 'Write your complaint…' : 'Type your suggestions here…';
  const emailSubject = isLeaveRequest ? 'eSkool leave request' : isComplaint ? 'eSkool school complaint' : 'eSkool app feedback';

  const submitFeedback = async () => {
    if (!feedback.trim()) { Alert.alert('Write a message', 'Add your feedback before opening your email app.'); return; }
    const url = `mailto:contact@eskool.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(feedback.trim())}`;
    try { await Linking.openURL(url); }
    catch { Alert.alert('Email unavailable', 'Set up an email app, then try sending your feedback again.'); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <Text style={[styles.label, { color: colors.text }]}>{prompt}</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          multiline 
          placeholder={placeholder}
          placeholderTextColor={colors.subText}
          value={feedback}
          onChangeText={setFeedback}
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.submitBtn} onPress={submitFeedback}>
          <Text style={styles.submitText}>{isLeaveRequest ? 'Continue to email' : isComplaint ? 'Send complaint' : 'Submit'}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  content: { padding: 24, flex: 1 },
  label: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 12 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, height: 150, padding: 16, fontSize: 15, color: '#1F2937', marginBottom: 24 },
  submitBtn: { backgroundColor: '#2F80ED', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' }
});
