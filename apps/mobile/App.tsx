import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/features/auth/screens/LoginScreen';
import DashboardScreen from './src/features/home/screens/DashboardScreen';
import RoutineScreen from './src/features/routine/screens/RoutineScreen';
import AttendanceScreen from './src/features/attendance/screens/AttendanceScreen';
import NoticeScreen from './src/features/notices/screens/NoticeScreen';
import HomeworkScreen from './src/features/homework/screens/HomeworkScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Routine" component={RoutineScreen} />
        <Stack.Screen name="Attendance" component={AttendanceScreen} />
        <Stack.Screen name="Notice" component={NoticeScreen} />
        <Stack.Screen name="Homework" component={HomeworkScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
