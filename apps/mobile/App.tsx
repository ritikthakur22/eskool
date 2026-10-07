import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from "./src/core/theme/ThemeContext";
import { useTheme } from './src/core/theme/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { GlobalAlert, monkeyPatchAlert } from './src/core/components/CustomAlert';
monkeyPatchAlert();

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GOOGLE_WEB_CLIENT_ID } from './src/core/auth/google';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/features/auth/screens/LoginScreen';
import DashboardScreen from './src/features/home/screens/DashboardScreen';
import RoutineScreen from './src/features/routine/screens/RoutineScreen';
import AttendanceScreen from './src/features/attendance/screens/AttendanceScreenWrapper';
import NoticeScreen from './src/features/notices/screens/NoticeScreen';
import HomeworkScreen from './src/features/homework/screens/HomeworkScreen';
import ResultScreen from './src/features/results/screens/ResultScreen';
import ProfileScreen from './src/features/profile/screens/ProfileScreen';
import ChatScreen from './src/features/chat/screens/ChatScreen';
import ChatConversationScreen from './src/features/chat/screens/ChatConversationScreen';
import OnlineClassScreen from './src/features/classes/screens/OnlineClassScreen';
import OnboardingScreen from './src/features/onboarding/screens/OnboardingScreen';
import SplashScreen from "./src/features/onboarding/screens/SplashScreen";
import LibraryScreen from './src/features/library/screens/LibraryScreen';
import ExamsScreen from './src/features/exams/screens/ExamsScreen';
import ExamQuestionsScreen from './src/features/exams/screens/ExamQuestionsScreen';
import ExamTakingScreen from './src/features/exams/screens/ExamTakingScreen';
import CalendarScreen from './src/features/calendar/screens/CalendarScreen';
import GeneralSettingsScreen from "./src/features/profile/screens/GeneralSettingsScreen";
import TermsScreen from "./src/features/profile/screens/TermsScreen";
import FeedbackScreen from "./src/features/profile/screens/FeedbackScreen";
import AppInfoScreen from "./src/features/profile/screens/AppInfoScreen";
import ProfileDetailsScreen from './src/features/profile/screens/ProfileDetailsScreen';
import FeesScreen from './src/features/fees/screens/FeesScreen';
import EnrollmentScreen from "./src/features/management/screens/EnrollmentScreen";
import StaffManagementScreen from './src/features/management/screens/StaffManagementScreen';
import AcademicManagementScreen from './src/features/management/screens/AcademicManagementScreen';
import DirectoryScreen from './src/features/directory/screens/DirectoryScreen';
import AuditLogScreen from './src/features/audit/screens/AuditLogScreen';

const Stack = createNativeStackNavigator();

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
        <GlobalAlert />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={{
        dark: isDark,
        colors: { primary: colors.primary, background: colors.background, card: colors.card, text: colors.text, border: colors.border, notification: colors.danger },
        fonts: { regular: { fontFamily: 'System', fontWeight: '400' }, medium: { fontFamily: 'System', fontWeight: '500' }, bold: { fontFamily: 'System', fontWeight: '700' }, heavy: { fontFamily: 'System', fontWeight: '800' } },
      }}>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Routine" component={RoutineScreen} />
        <Stack.Screen name="Attendance" component={AttendanceScreen} />
        <Stack.Screen name="Enrollment" component={EnrollmentScreen} />
        <Stack.Screen name="Fees" component={FeesScreen} />
        <Stack.Screen name="StaffManagement" component={StaffManagementScreen} />
        <Stack.Screen name="AcademicManagement" component={AcademicManagementScreen} />
        <Stack.Screen name="Directory" component={DirectoryScreen} />
        <Stack.Screen name="AuditLogs" component={AuditLogScreen} />
        <Stack.Screen name="Notice" component={NoticeScreen} />
        <Stack.Screen name="Homework" component={HomeworkScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="ChatConversation" component={ChatConversationScreen} />
        <Stack.Screen name="OnlineClass" component={OnlineClassScreen} />
        <Stack.Screen name="Library" component={LibraryScreen} />
        <Stack.Screen name="Exams" component={ExamsScreen} />
        <Stack.Screen name="ExamQuestions" component={ExamQuestionsScreen} />
        <Stack.Screen name="ExamTaking" component={ExamTakingScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="General Settings" component={GeneralSettingsScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="Feedback" component={FeedbackScreen} />
        <Stack.Screen name="App Info" component={AppInfoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
}
