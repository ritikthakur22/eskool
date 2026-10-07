with open('apps/mobile/src/features/profile/screens/ProfileScreen.tsx', 'r') as f:
    content = f.read()

import_statement = "import { getCachedUserData } from '../../../core/networking/session';\n"
if "getCachedUserData" not in content:
    content = content.replace("import * as SecureStore from 'expo-secure-store';", "import * as SecureStore from 'expo-secure-store';\n" + import_statement)
    content = content.replace("await SecureStore.getItemAsync('user_data')", "await getCachedUserData()")
    with open('apps/mobile/src/features/profile/screens/ProfileScreen.tsx', 'w') as f:
        f.write(content)
