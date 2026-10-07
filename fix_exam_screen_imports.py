with open('apps/mobile/src/features/exams/screens/ExamsScreen.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';",
    "import { KeyboardAvoidingView, Platform, StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';"
)

with open('apps/mobile/src/features/exams/screens/ExamsScreen.tsx', 'w') as f:
    f.write(content)
