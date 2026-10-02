import * as SecureStore from 'expo-secure-store';

export const selectedChildKey = 'selected_child_id';

export async function getSelectedChildId() {
  return SecureStore.getItemAsync(selectedChildKey);
}

export async function setSelectedChildId(id: string) {
  await SecureStore.setItemAsync(selectedChildKey, id);
}
