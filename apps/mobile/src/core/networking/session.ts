let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let cachedUserData: string | null = null;

export const setInMemoryAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getInMemoryAccessToken = () => inMemoryAccessToken;

export const setInMemoryRefreshToken = (token: string | null) => {
  inMemoryRefreshToken = token;
};

export const getInMemoryRefreshToken = () => inMemoryRefreshToken;

export const getCachedUserData = async () => {
  if (cachedUserData) return cachedUserData;
  const SecureStore = await import('expo-secure-store');
  cachedUserData = await SecureStore.getItemAsync('user_data');
  return cachedUserData;
};

export const setCachedUserData = async (data: string | null) => {
  cachedUserData = data;
  const SecureStore = await import('expo-secure-store');
  if (data) {
    await SecureStore.setItemAsync('user_data', data);
  } else {
    await SecureStore.deleteItemAsync('user_data');
  }
};
