#!/bin/bash
sed -i "s/import { KeyboardAvoidingView/import * as DocumentPicker from 'expo-document-picker';\nimport * as Linking from 'expo-linking';\nimport { KeyboardAvoidingView/" apps/mobile/src/features/homework/screens/HomeworkScreen.tsx
