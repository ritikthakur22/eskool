import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

let setAlertState: any = null;

export const monkeyPatchAlert = () => {
  Alert.alert = (title, message, buttons) => {
    if (setAlertState) {
      setAlertState({ visible: true, title, message, buttons: buttons || [{ text: 'OK' }] });
    }
  };
};

export function GlobalAlert() {
  const { colors } = useTheme();
  const [state, setState] = useState<{ visible: boolean, title?: string, message?: string, buttons?: any[] }>({ visible: false });
  const [scale] = useState(new Animated.Value(0.9));
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    setAlertState = setState;
  }, []);

  useEffect(() => {
    if (state.visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true })
      ]).start();
    } else {
      scale.setValue(0.9);
      opacity.setValue(0);
    }
  }, [state.visible]);

  if (!state.visible) return null;

  return (
    <Modal transparent visible={state.visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { backgroundColor: colors.card, transform: [{ scale }], opacity }]}>
          {!!state.title && <Text style={[styles.title, { color: colors.text }]}>{state.title}</Text>}
          {!!state.message && <Text style={[styles.message, { color: colors.subText }]}>{state.message}</Text>}
          <View style={styles.buttonRow}>
            {state.buttons?.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.button, { backgroundColor: btn.style === 'cancel' ? colors.border : colors.primary }]}
                onPress={() => {
                  setState({ visible: false });
                  if (btn.onPress) setTimeout(btn.onPress, 150);
                }}
              >
                <Text style={[styles.buttonText, { color: btn.style === 'cancel' ? colors.text : '#fff' }]}>{btn.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 340, borderRadius: 20, padding: 24, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  title: { fontSize: 20, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  message: { fontSize: 15, marginBottom: 24, textAlign: 'center', lineHeight: 22 },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '800' }
});
