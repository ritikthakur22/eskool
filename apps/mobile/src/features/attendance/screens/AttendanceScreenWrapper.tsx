import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AttendanceScreen from './AttendanceScreen';
import StaffAttendanceScreen from './StaffAttendanceScreen';
import { getCachedUserDataSync, getCachedUserData } from '../../../core/networking/session';

export default function AttendanceScreenWrapper(props: any) {
  const [role, setRole] = useState<string | null>(() => {
    const raw = getCachedUserDataSync();
    if (raw) {
      try { return JSON.parse(raw).role || 'STUDENT'; } catch {}
    }
    return null;
  });

  useEffect(() => {
    if (!role) {
      getCachedUserData().then(data => {
        if (data) {
          try { setRole(JSON.parse(data).role || 'STUDENT'); } catch { setRole('STUDENT'); }
        } else {
          setRole('STUDENT');
        }
      });
    }
  }, [role]);

  if (!role) {
    return <View style={{ flex: 1 }} />;
  }

  if (role === 'TEACHER' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return <StaffAttendanceScreen {...props} />;
  }
  return <AttendanceScreen {...props} />;
}
