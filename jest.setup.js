/* eslint-env jest */

jest.mock("react-native-config", () => ({
  SUPABASE_URL: "https://mock.supabase.co",
  SUPABASE_ANON_KEY: "mock-anon-key",
}));

// Manually mock the AsyncStorage functions that Supabase needs to operate
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock Google Sign In
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ data: { idToken: "mock-id-token" } })),
    signOut: jest.fn(() => Promise.resolve()),
    revokeAccess: jest.fn(() => Promise.resolve()),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
    IN_PROGRESS: "IN_PROGRESS",
    PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  },
  isSuccessResponse: jest.fn(() => true),
  isErrorWithCode: jest.fn(() => false),
}));
