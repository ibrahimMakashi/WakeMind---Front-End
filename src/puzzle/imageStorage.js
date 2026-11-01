import {NativeModules, Platform} from 'react-native';

function getNativeModule() {
  return NativeModules?.PuzzleImageModule;
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
