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

// Mock React Native Skia
jest.mock("@shopify/react-native-skia", () => ({
  Canvas: "Canvas",
  Skia: {
    Skottie: {
      Make: jest.fn(() => ({
        duration: jest.fn(() => 1),
        fps: jest.fn(() => 60),
        size: jest.fn(() => ({ width: 48, height: 48 })),
      })),
    },
  },
  Skottie: "Skottie",
  Group: "Group",
  useClock: jest.fn(() => ({ value: 0 })),
}));

// Mock Worklets
jest.mock("react-native-worklets", () => ({
  Worklets: {
    createRunOnJS: jest.fn(fn => fn),
    createRunOnWorklet: jest.fn(fn => fn),
  },
}));

// Mock Vision Camera
jest.mock("react-native-vision-camera", () => ({
  Camera: "Camera",
  useCameraDevice: jest.fn(() => ({})),
  useObjectOutput: jest.fn(() => ({})),
  useCameraPermission: jest.fn(() => ({
    hasPermission: true,
    requestPermission: jest.fn(() => Promise.resolve(true)),
  })),
}));

// Mock Nitro Modules
jest.mock("react-native-nitro-modules", () => ({
  NitroModules: {},
}));

// Mock Reanimated
jest.mock("react-native-reanimated", () => {
  return {
    useSharedValue: jest.fn(val => ({ value: val })),
    useDerivedValue: jest.fn(fn => ({ value: fn() })),
    withTiming: jest.fn((val, config, cb) => {
      if (cb) cb(true);
      return val;
    }),
    useAnimatedStyle: jest.fn(fn => fn()),
    interpolate: jest.fn((val, input, output) => output[0]),
    Extrapolation: { CLAMP: "clamp" },
    runOnJS: jest.fn(fn => fn),
    runOnWorklet: jest.fn(fn => fn),
    makeMutable: jest.fn(val => ({ value: val })),
  };
});

// Mock Stallion OTA wrapper
jest.mock(
  "react-native-stallion",
  () => {
    return {
      withStallion: Component => Component,
    };
  },
  { virtual: true },
); // <-- This tells Jest to skip verifying if the module exists
