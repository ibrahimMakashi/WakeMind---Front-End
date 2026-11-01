import {NativeModules, Platform} from 'react-native';
import {
  _resetFallbackStateForTest,
  cropSquareImage,
  getCustomImageById,
  getRecentImages,
  loadSavedImagePreference,
  pickImageFromPhone,
  recordRecentImage,
  registerCustomImage,
  saveImagePreference,
} from './imageStorage';

describe('imageStorage', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Platform.OS = originalPlatform;
    delete NativeModules.PuzzleImageModule;
    _resetFallbackStateForTest();
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

  test('handles recents and custom image lookup in fallback environment', async () => {
    Platform.OS = 'android';
    delete NativeModules.PuzzleImageModule;

    const initialRecents = await getRecentImages();
    expect(initialRecents).toEqual([]);

    await recordRecentImage({
      id: 'moraine-lake',
      type: 'bundled',
      title: 'Moraine Lake',
    });
    const updated = await getRecentImages();
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe('moraine-lake');

    const registered = await registerCustomImage({
      id: 'custom_999',
      uri: 'file:///photo.jpg',
      title: 'Graduation',
    });
    expect(registered.id).toBe('custom_999');

    const lookedUp = await getCustomImageById('custom_999');
    expect(lookedUp.uri).toBe('file:///photo.jpg');

    const notFound = await getCustomImageById('unknown');
    expect(notFound).toBeNull();
  });

  test('delegates recents and custom image lookup to native module', async () => {
    Platform.OS = 'android';
    const fakeRecents = [{id: 'fuji', type: 'bundled', title: 'Mount Fuji', timestamp: 1000}];
    NativeModules.PuzzleImageModule = {
      getRecentImages: jest.fn(async () => fakeRecents),
      recordRecentImage: jest.fn(async () => fakeRecents),
      getCustomImageById: jest.fn(async id => (id === 'custom_1' ? {id: 'custom_1', uri: 'file:///1.jpg'} : null)),
      registerCustomImage: jest.fn(async img => ({...img, type: 'custom'})),
    };

    const recents = await getRecentImages();
    expect(recents).toBe(fakeRecents);

    await recordRecentImage({id: 'fuji', type: 'bundled'});
    expect(NativeModules.PuzzleImageModule.recordRecentImage).toHaveBeenCalledWith({
      id: 'fuji',
      type: 'bundled',
      uri: '',
      title: '',
    });

    const custom = await getCustomImageById('custom_1');
    expect(custom.uri).toBe('file:///1.jpg');

    const registered = await registerCustomImage({id: 'custom_2', uri: 'file:///2.jpg'});
    expect(registered.id).toBe('custom_2');
  });
});
