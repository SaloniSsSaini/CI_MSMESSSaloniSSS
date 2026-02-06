// Jest matchers are now built into @testing-library/react-native v12.4+
import 'react-native-gesture-handler/jestSetup';

// Many RN components schedule timers (e.g. Animated). Use fake timers and flush them
// to avoid "Jest environment has been torn down" errors at the end of the run.
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  // Avoid timers firing after Jest teardown (common with Animated/react-native-paper).
  // Clearing timers is safer than running them, since running them can trigger React
  // state updates outside of act().
  jest.clearAllTimers();
  jest.useRealTimers();
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-animatable
jest.mock('react-native-animatable', () => ({
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  createAnimatableComponent: (component: any) => component,
}));

// Mock react-native-linear-gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-paper
jest.mock('react-native-paper', () => {
  const actual = jest.requireActual('react-native-paper');
  return {
    ...actual,
    Portal: ({ children }: any) => children,
  };
});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: jest.fn(),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock axios
const mockAxios = jest.fn((config) => {
  return Promise.resolve({
    data: { success: true, message: 'Mock response' },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
});

jest.mock('axios', () => ({
  __esModule: true,
  default: mockAxios,
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');