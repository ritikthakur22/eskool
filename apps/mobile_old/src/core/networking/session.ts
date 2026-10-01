let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

export const setInMemoryAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getInMemoryAccessToken = () => inMemoryAccessToken;

export const setInMemoryRefreshToken = (token: string | null) => {
  inMemoryRefreshToken = token;
};

export const getInMemoryRefreshToken = () => inMemoryRefreshToken;
