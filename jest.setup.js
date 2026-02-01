// Mock database adapter to use LokiJS for tests
jest.mock('@/src/data/database/adapter', () => jest.requireActual('./src/data/database/adapter.ts'));

import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Native Modules and Device Info
jest.mock('react-native/Libraries/Utilities/NativeDeviceInfo', () => ({
    default: {
        getConstants: () => ({
            Dimensions: {
                window: { fontScale: 1, height: 1334, scale: 2, width: 750 },
                screen: { fontScale: 1, height: 1334, scale: 2, width: 750 },
            },
        }),
    },
}));

jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
    __esModule: true,
    default: {
        get: (key) => ({ width: 750, height: 1334, scale: 2, fontScale: 1 }),
        set: () => { },
        addEventListener: () => ({ remove: () => { } }),
        removeEventListener: () => { },
    }
}));

jest.mock('react-native/Libraries/Utilities/PixelRatio', () => ({
    __esModule: true,
    default: {
        get: () => 2,
        getFontScale: () => 1,
        getPixelSizeForLayoutSize: (size) => size * 2,
        roundToNearestPixel: (size) => size,
    }
}));




jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock Expo modules
jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    Link: 'Link',
    Stack: {
        Screen: 'Screen',
    },
}));

jest.mock('expo-file-system', () => ({
    documentDirectory: 'test-dir/',
    writeAsStringAsync: jest.fn(),
    readAsStringAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    shareAsync: jest.fn().mockResolvedValue({}),
}));

// Mock native crypto and nitro modules
jest.mock('react-native-quick-crypto', () => ({
    randomUUID: () => 'test-uuid-' + Math.random(),
    default: {
        randomUUID: () => 'test-uuid-' + Math.random(),
    }
}));

// Mock NitroModules TurboModule
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
    getEnforcing: (name) => ({}),
    get: (name) => ({}),
}));

jest.mock('react-native-nitro-modules', () => ({
    NitroModules: {},
}));

// Global fetch mock to prevent network hangs
global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
    })
);

// Flush rebuild queue and clear all mocks between tests
afterEach(async () => {
    jest.clearAllMocks();
    try {
        // Only require if already loaded to avoid side effects in minimal tests
        const { rebuildQueueService } = require('./src/data/repositories/RebuildQueue');
        if (rebuildQueueService) {
            await rebuildQueueService.flush();
            rebuildQueueService.stop();
        }
    } catch (e) {
        // Service may not be available in all test contexts
    }
});
