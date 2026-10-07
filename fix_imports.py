import os, glob, re

files = [
    'apps/mobile/src/features/chat/screens/ChatScreen.tsx',
    'apps/mobile/src/features/results/screens/ResultScreen.tsx',
    'apps/mobile/src/features/management/screens/EnrollmentScreen.tsx',
    'apps/mobile/src/features/management/screens/AcademicManagementScreen.tsx',
    'apps/mobile/src/features/management/screens/StaffManagementScreen.tsx',
    'apps/mobile/src/features/exams/screens/ExamQuestionsScreen.tsx',
    'apps/mobile/src/features/attendance/screens/StaffAttendanceScreen.tsx',
    'apps/mobile/src/features/homework/screens/HomeworkScreen.tsx'
]

for filepath in files:
    if not os.path.exists(filepath): continue
    
    with open(filepath, 'r') as f:
        lines = f.readlines()
        
    new_lines = []
    has_in_rn = False
    
    for line in lines:
        if line.startswith('import {') and 'KeyboardAvoidingView, Platform, ' in line:
            # Remove the bad injection
            line = line.replace('KeyboardAvoidingView, Platform, ', '')
            
            # Re-inject it ONLY into react-native
            if 'react-native\';' in line or 'react-native"' in line:
                line = line.replace('import { ', 'import { KeyboardAvoidingView, Platform, ')
                has_in_rn = True
                
        new_lines.append(line)
        
    # If we somehow missed injecting into react-native, do it manually
    if not has_in_rn:
        for i, line in enumerate(new_lines):
            if line.startswith('import {') and ('react-native\';' in line or 'react-native"' in line):
                if 'KeyboardAvoidingView' not in line:
                    new_lines[i] = line.replace('import { ', 'import { KeyboardAvoidingView, Platform, ')
                break

    with open(filepath, 'w') as f:
        f.writelines(new_lines)

