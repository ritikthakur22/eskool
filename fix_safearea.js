const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('SafeAreaView') && content.includes("'react-native'") && !content.includes("'react-native-safe-area-context'")) {
        // Remove SafeAreaView from react-native imports
        content = content.replace(/SafeAreaView,\s*/g, '');
        content = content.replace(/,\s*SafeAreaView/g, '');
        // Sometimes it's the only import, which is unlikely but possible
        content = content.replace(/import\s*{\s*SafeAreaView\s*}\s*from\s*['"]react-native['"];\n?/g, '');
        
        // Add SafeAreaView from react-native-safe-area-context
        const importStatement = "import { SafeAreaView } from 'react-native-safe-area-context';\n";
        // insert after the last react-native import
        content = importStatement + content;
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir('apps/mobile/src');
