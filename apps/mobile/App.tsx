import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GoogleSignin } from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId: "228295306473-t6cv4gac9pn81pbcgk6av05roi9j2662.apps.googleusercontent.com",
});
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/features/auth/screens/LoginScreen';
import DashboardScreen from './src/features/home/screens/DashboardScreen';
import RoutineScreen from './src/features/routine/screens/RoutineScreen';
import AttendanceScreen from './src/features/attendance/screens/AttendanceScreen';
import NoticeScreen from './src/features/notices/screens/NoticeScreen';
import HomeworkScreen from './src/features/homework/screens/HomeworkScreen';
import ResultScreen from './src/features/results/screens/ResultScreen';
import ProfileScreen from './src/features/profile/screens/ProfileScreen';
import ChatScreen from './src/features/chat/screens/ChatScreen';
import OnlineClassScreen from './src/features/classes/screens/OnlineClassScreen';
import OnboardingScreen from './src/features/onboarding/screens/OnboardingScreen';
import SplashScreen from "./src/features/onboarding/screens/SplashScreen";
import LibraryScreen from './src/features/library/screens/LibraryScreen';
import ExamsScreen from './src/features/exams/screens/ExamsScreen';
import CalendarScreen from './src/features/calendar/screens/CalendarScreen';
import GeneralSettingsScreen from "./src/features/profile/screens/GeneralSettingsScreen";
import TermsScreen from "./src/features/profile/screens/TermsScreen";
import FeedbackScreen from "./src/features/profile/screens/FeedbackScreen";
import AppInfoScreen from "./src/features/profile/screens/AppInfoScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Routine" component={RoutineScreen} />
        <Stack.Screen name="Attendance" component={AttendanceScreen} />
        <Stack.Screen name="Notice" component={NoticeScreen} />
        <Stack.Screen name="Homework" component={HomeworkScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="OnlineClass" component={OnlineClassScreen} />
        <Stack.Screen name="Library" component={LibraryScreen} />
        <Stack.Screen name="Exams" component={ExamsScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="General Settings" component={GeneralSettingsScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="Feedback" component={FeedbackScreen} />
        <Stack.Screen name="App Info" component={AppInfoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
