import {NativeModules, Platform} from 'react-native';
import {
  cropSquareImage,
  loadSavedImagePreference,
  pickImageFromPhone,
  saveImagePreference,
} from './imageStorage';

describe('imageStorage', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Platform.OS = originalPlatform;
    delete NativeModules.PuzzleImageModule;
  });

  test('falls back gracefully when native module is unavailable', async () => {
    Platform.OS = 'android';
    delete NativeModules.PuzzleImageModule;

    const pick = await pickImageFromPhone();
    expect(pick).toEqual({cancelled: true});

    const crop = await cropSquareImage({
      uri: 'file:///path/to/test.jpg',
      cropX: 10,
      cropY: 20,
      cropSize: 200,
      targetSize: 1024,
    });
    expect(crop.uri).toBe('file:///path/to/test.jpg');
    expect(crop.width).toBe(1024);
    expect(crop.height).toBe(1024);

    const loaded = await loadSavedImagePreference();
    expect(loaded).toBeNull();

    const saved = await saveImagePreference({id: 'test', type: 'bundled'});
    expect(saved).toBe(true);
  });

  test('delegates to native module when available on android', async () => {
    Platform.OS = 'android';
    NativeModules.PuzzleImageModule = {
      pickImage: jest.fn(async () => ({uri: 'file:///test.jpg', width: 800, height: 600, cancelled: false})),
      cropSquareImage: jest.fn(async opts => ({
        id: 'custom_123',
        uri: 'file:///cropped.jpg',
        width: opts.targetSize,
        height: opts.targetSize,
      })),
      getSelectedImage: jest.fn(async () => ({
        id: 'custom_123',
        type: 'custom',
        uri: 'file:///cropped.jpg',
        title: 'My Custom Photo',
      })),
      saveSelectedImage: jest.fn(async () => true),
    };

    const pick = await pickImageFromPhone();
    expect(NativeModules.PuzzleImageModule.pickImage).toHaveBeenCalledTimes(1);
    expect(pick.uri).toBe('file:///test.jpg');

    const crop = await cropSquareImage({
      uri: 'file:///test.jpg',
      cropX: 50.4,
      cropY: 20.8,
      cropSize: 400.1,
      targetSize: 1024,
    });
    expect(NativeModules.PuzzleImageModule.cropSquareImage).toHaveBeenCalledWith({
      uri: 'file:///test.jpg',
      cropX: 50,
      cropY: 21,
      cropSize: 400,
      targetSize: 1024,
    });
    expect(crop.id).toBe('custom_123');

    const loaded = await loadSavedImagePreference();
    expect(loaded.title).toBe('My Custom Photo');

    const saved = await saveImagePreference({
      id: 'custom_123',
      type: 'custom',
      uri: 'file:///cropped.jpg',
      title: 'My Custom Photo',
    });
    expect(saved).toBe(true);
  });
});
