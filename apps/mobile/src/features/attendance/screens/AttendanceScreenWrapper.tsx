import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AttendanceScreen from './AttendanceScreen';
import StaffAttendanceScreen from './StaffAttendanceScreen';

export default function AttendanceScreenWrapper(props: any) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('user_data').then(data => {
      if (data) {
        setRole(JSON.parse(data).role || 'STUDENT');
      } else {
        setRole('STUDENT');
      }
    });
  }, []);

  if (!role) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  }

  if (role === 'TEACHER' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return <StaffAttendanceScreen {...props} />;
  }
  return <AttendanceScreen {...props} />;
}
