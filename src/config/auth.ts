export const authConfig = {
  accessToken: {
    expiresIn: "15m",
  },
  refreshToken: {
    expiresIn: "7d",
  },
};

export type AuthConfig = typeof authConfig;

