import os, glob

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if '<Modal' not in content:
        return

    # Replace <View style={s.overlay}> or <View style={styles.modalOverlay}>
    # with KeyboardAvoidingView
    import re
    
    # We must ensure KeyboardAvoidingView and Platform are imported
    if 'KeyboardAvoidingView' not in content:
        content = content.replace("import { ", "import { KeyboardAvoidingView, Platform, ")

    changed = False

    def replace_overlay(match):
        nonlocal changed
        changed = True
        inner = match.group(1) # style={...}
        return f'<KeyboardAvoidingView behavior={{Platform.OS === \'ios\' ? \'padding\' : \'height\'}} {inner}>'
        
    def replace_end_overlay(match):
        return f'</KeyboardAvoidingView>\n      </Modal>'
        
    content = re.sub(r'<View (style=\{s\.overlay\}|style=\{styles\.modalOverlay\})>', replace_overlay, content)
    
    if changed:
        # We need to replace the corresponding </View> inside the Modal.
        # This is a bit tricky with regex, but usually the overlay ends right before </Modal>.
        content = re.sub(r'</View>\n\s*</Modal>', replace_end_overlay, content)
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Patched {filepath}")

for root, _, files in os.walk('apps/mobile/src/features'):
    for file in files:
        if file.endswith('.tsx'):
            patch_file(os.path.join(root, file))
