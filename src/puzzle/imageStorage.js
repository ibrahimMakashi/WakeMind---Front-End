import {NativeModules, Platform} from 'react-native';

let fallbackRecents = [];
let fallbackCustomMap = {};

function getNativeModule() {
  return NativeModules?.PuzzleImageModule;
}

export function _resetFallbackStateForTest() {
  fallbackRecents = [];
  fallbackCustomMap = {};
}

/**
 * Open the Android system photo picker (MediaStore.ACTION_PICK_IMAGES on API 33+,
 * or ACTION_GET_CONTENT fallback). No broad storage permissions required.
 *
 * @returns {Promise<{uri: string, width: number, height: number, cancelled: boolean}>}
 */
export async function pickImageFromPhone() {
  const nativeModule = getNativeModule();
  if (Platform.OS !== 'android' || !nativeModule || typeof nativeModule.pickImage !== 'function') {
    return {cancelled: true};
  }
  return nativeModule.pickImage();
}

/**
 * Crop the selected image into a square master image, applying EXIF rotation
 * and saving it into app-private storage.
 *
 * @param {{
 *   uri: string,
 *   cropX: number,
 *   cropY: number,
 *   cropSize: number,
 *   targetSize?: number
 * }} options
 * @returns {Promise<{id: string, uri: string, width: number, height: number}>}
 */
export async function cropSquareImage(options) {
  const nativeModule = getNativeModule();
  if (Platform.OS !== 'android' || !nativeModule || typeof nativeModule.cropSquareImage !== 'function') {
    // Test environment fallback: simulate successful square crop
    return {
      id: `custom_${Date.now()}`,
      uri: options.uri,
      width: options.targetSize || 1024,
      height: options.targetSize || 1024,
    };
  }
  return nativeModule.cropSquareImage({
    uri: options.uri,
    cropX: Math.round(options.cropX),
    cropY: Math.round(options.cropY),
    cropSize: Math.round(options.cropSize),
    targetSize: options.targetSize || 1024,
  });
}

/**
 * Load the saved puzzle image preference from SharedPreferences.
 *
 * @returns {Promise<{id: string, type: 'bundled'|'custom', uri: string, title: string}|null>}
 */
export async function loadSavedImagePreference() {
  const nativeModule = getNativeModule();
  if (Platform.OS !== 'android' || !nativeModule || typeof nativeModule.getSelectedImage !== 'function') {
    return null;
  }
  return nativeModule.getSelectedImage();
}

/**
 * Save the active puzzle image preference to SharedPreferences.
 *
 * @param {{id: string, type: 'bundled'|'custom', uri?: string, title?: string}} params
 * @returns {Promise<boolean>}
 */
export async function saveImagePreference(params) {
  const nativeModule = getNativeModule();
  if (Platform.OS !== 'android' || !nativeModule || typeof nativeModule.saveSelectedImage !== 'function') {
    return true;
  }
  return nativeModule.saveSelectedImage(params);
}

/**
 * Fetch recently selected puzzle images across all alarms and sessions.
 *
 * @returns {Promise<Array<{id: string, type: 'bundled'|'custom', uri: string, title: string, timestamp: number}>>}
 */
export async function getRecentImages() {
  const nativeModule = getNativeModule();
  if (Platform.OS !== 'android' || !nativeModule || typeof nativeModule.getRecentImages !== 'function') {
    return [...fallbackRecents];
  }
  return nativeModule.getRecentImages();
}

/**
 * Record an image selection into recents. Returns the updated list.
 *
 * @param {{id: string, type: 'bundled'|'custom', uri?: string, title?: string}} image
 * @returns {Promise<Array<{id: string, type: 'bundled'|'custom', uri: string, title: string, timestamp: number}>>}
 */
export async function recordRecentImage(image) {
  if (!image || !image.id) {
    return getRecentImages();
  }
  const nativeModule = getNativeModule();
  if (Platform.OS !== 'android' || !nativeModule || typeof nativeModule.recordRecentImage !== 'function') {
    fallbackRecents = [
      {
        id: image.id,
        type: image.type || 'bundled',
        uri: image.uri || '',
        title: image.title || '',
        timestamp: Date.now(),
      },
      ...fallbackRecents.filter(item => item.id !== image.id),
    ].slice(0, 8);
    return [...fallbackRecents];
  }
  return nativeModule.recordRecentImage({
    id: image.id,
    type: image.type || 'bundled',
    uri: image.uri || '',
    title: image.title || '',
  });
}

/**
 * Lookup a stored custom image metadata by its ID.
 *
 * @param {string} id
 * @returns {Promise<{id: string, type: string, uri: string, title: string}|null>}
 */
export async function getCustomImageById(id) {
  if (!id) {
    return null;
  }
  const nativeModule = getNativeModule();
  if (Platform.OS !== 'android' || !nativeModule || typeof nativeModule.getCustomImageById !== 'function') {
    return fallbackCustomMap[id] || null;
  }
  return nativeModule.getCustomImageById(id);
}

/**
 * Register a custom image in the shared library.
 *
 * @param {{id: string, uri: string, title?: string}} image
 * @returns {Promise<{id: string, type: string, uri: string, title: string}|null>}
 */
export async function registerCustomImage(image) {
  if (!image || !image.id) {
    return null;
  }
  const nativeModule = getNativeModule();
  if (Platform.OS !== 'android' || !nativeModule || typeof nativeModule.registerCustomImage !== 'function') {
    fallbackCustomMap[image.id] = {
      id: image.id,
      type: 'custom',
      uri: image.uri || '',
      title: image.title || 'Custom Photo',
    };
    return fallbackCustomMap[image.id];
  }
  return nativeModule.registerCustomImage({
    id: image.id,
    type: 'custom',
    uri: image.uri || '',
    title: image.title || 'Custom Photo',
  });
}
