/* eslint-env jest */
import "react-native-gesture-handler/jestSetup";
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

// Mock Supabase
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: null } })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: "mock-url" } })),
      })),
    },
  })),
}));

// Mock Camera Kit
jest.mock("react-native-camera-kit", () => ({
  Camera: "Camera",
}));

// Mock Nitro Modules
jest.mock("react-native-nitro-modules", () => ({
  NitroModules: {
    createHybridObject: jest.fn(() => ({})),
  },
}));

// Mock Nitro Image
jest.mock("react-native-nitro-image", () => ({
  Images: {
    loadFromFileAsync: jest.fn(() =>
      Promise.resolve({
        width: 100,
        height: 100,
        resizeAsync: jest.fn().mockReturnThis(),
        toRawPixelData: jest.fn(() =>
          Promise.resolve({
            buffer: new ArrayBuffer(0),
            width: 100,
            height: 100,
            pixelFormat: "RGBA",
          }),
        ),
      }),
    ),
  },
}));

// Mock Image Picker
jest.mock("react-native-image-picker", () => ({
  launchImageLibrary: jest.fn(() =>
    Promise.resolve({
      didCancel: false,
      assets: [{ uri: "mock-uri" }],
    }),
  ),
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

// Mock react-native-blob-util
jest.mock("react-native-blob-util", () => ({
  fs: {
    dirs: {
      CacheDir: "/mock/cache/dir",
    },
    writeFile: jest.fn(() => Promise.resolve()),
  },
}));

// Mock react-native-share
jest.mock("react-native-share", () => ({
  open: jest.fn(() => Promise.resolve()),
}));

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

// Mock Firebase Perf
jest.mock("@react-native-firebase/perf", () => {
  return () => ({
    startTrace: jest.fn(() =>
      Promise.resolve({
        stop: jest.fn(() => Promise.resolve()),
        putAttribute: jest.fn(),
        incrementMetric: jest.fn(),
      }),
    ),
  });
});
