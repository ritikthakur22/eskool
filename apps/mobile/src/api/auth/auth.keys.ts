// 
export const authKeys = {
  all: ["auth"] as const,

  getuserProfile: () => [...authKeys.all, "profiel"] as const,
};


// like this if you are performing other query using useQuery then use the keys from here.