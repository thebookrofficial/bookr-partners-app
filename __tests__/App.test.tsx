/**
 * @format
 */

import React from "react";
import ReactTestRenderer from "react-test-renderer";
import App from "../App";

// Mock Firebase Messaging to prevent native module errors in Jest
jest.mock("@react-native-firebase/messaging", () => {
  const mockMessaging = () => ({
    requestPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve("mock-token")),
    onMessage: jest.fn(() => jest.fn()), // returns unsubscribe function
    setBackgroundMessageHandler: jest.fn(),
  });
  mockMessaging.AuthorizationStatus = { AUTHORIZED: 1, PROVISIONAL: 2 };
  return mockMessaging;
});

// Mock Firebase App since it's a core dependency
jest.mock("@react-native-firebase/app", () => ({
  app: jest.fn(),
}));

test("renders correctly", async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
