with open('apps/mobile/App.tsx', 'r') as f:
    content = f.read()

import_statement = "import { GlobalAlert, monkeyPatchAlert } from './src/core/components/CustomAlert';\nmonkeyPatchAlert();\n"
if "monkeyPatchAlert" not in content:
    content = content.replace("import { StatusBar } from 'expo-status-bar';", "import { StatusBar } from 'expo-status-bar';\n" + import_statement)

    content = content.replace("<ThemedApp />", "<ThemedApp />\n        <GlobalAlert />")

    with open('apps/mobile/App.tsx', 'w') as f:
        f.write(content)
