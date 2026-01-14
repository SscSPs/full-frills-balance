// Platform-specific adapter export
// This file allows TypeScript to resolve the import correctly

// Import both adapters
import nativeAdapter from './adapter.native';
import webAdapter from './adapter.web';

// Check if we're in a React Native environment
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

// Export the appropriate adapter
export default isReactNative ? nativeAdapter : webAdapter;
