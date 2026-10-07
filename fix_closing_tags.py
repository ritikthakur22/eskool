import re

files = [
    'apps/mobile/src/features/management/screens/StaffManagementScreen.tsx',
    'apps/mobile/src/features/management/screens/EnrollmentScreen.tsx',
    'apps/mobile/src/features/management/screens/AcademicManagementScreen.tsx'
]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
        
    content = content.replace("</View></View></Modal>", "</View></KeyboardAvoidingView></Modal>")
    
    with open(filepath, 'w') as f:
        f.write(content)
