
// Import Jest Native matchers for better assertions
// Import Jest Native matchers for better assertions
import '@testing-library/jest-native/extend-expect';

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

// Mock WatermelonDB
jest.mock('@nozbe/watermelondb', () => ({
    Database: jest.fn(() => ({
        collections: {
            get: jest.fn(),
        },
        action: jest.fn(),
    })),
    Model: class Model { },
    tableSchema: jest.fn(),
    appSchema: jest.fn(),
}));

jest.mock('@nozbe/watermelondb/adapters/sqlite', () => jest.fn());

// Mock UUID
jest.mock('react-native-get-random-values', () => ({}));
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid'),
}));
