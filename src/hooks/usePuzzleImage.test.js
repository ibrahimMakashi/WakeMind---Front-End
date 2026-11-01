import {act, create} from 'react-test-renderer';
import {usePuzzleImage} from './usePuzzleImage';
import * as storage from '../puzzle/imageStorage';

describe('usePuzzleImage', () => {
  let hookValue;

  function TestComponent() {
    hookValue = usePuzzleImage();
    return null;
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('initializes with default bundled image', async () => {
    jest.spyOn(storage, 'loadSavedImagePreference').mockResolvedValue(null);

    await act(async () => {
      create(<TestComponent />);
    });

    expect(hookValue.currentImage.id).toBe('moraine-lake');
    expect(hookValue.currentImage.type).toBe('bundled');
    expect(hookValue.currentImage.title).toBe('Moraine Lake');
  });

  test('restores saved bundled image preference on mount', async () => {
    jest.spyOn(storage, 'loadSavedImagePreference').mockResolvedValue({
      id: 'mount-fuji',
      type: 'bundled',
      title: 'Mount Fuji',
    });

    await act(async () => {
      create(<TestComponent />);
    });

    expect(hookValue.currentImage.id).toBe('mount-fuji');
    expect(hookValue.currentImage.type).toBe('bundled');
    expect(hookValue.currentImage.title).toBe('Mount Fuji');
  });

  test('restores saved custom image preference on mount', async () => {
    jest.spyOn(storage, 'loadSavedImagePreference').mockResolvedValue({
      id: 'custom_999',
      type: 'custom',
      uri: 'file:///path/to/custom.jpg',
      title: 'Vacation Photo',
    });

    await act(async () => {
      create(<TestComponent />);
    });

    expect(hookValue.currentImage.id).toBe('custom_999');
    expect(hookValue.currentImage.type).toBe('custom');
    expect(hookValue.currentImage.source).toEqual({uri: 'file:///path/to/custom.jpg'});
  });

  test('selecting bundled image updates current image and persists preference', async () => {
    jest.spyOn(storage, 'loadSavedImagePreference').mockResolvedValue(null);
    const saveSpy = jest.spyOn(storage, 'saveImagePreference').mockResolvedValue(true);

    await act(async () => {
      create(<TestComponent />);
    });

    await act(async () => {
      await hookValue.selectBundled('yosemite-valley');
    });

    expect(hookValue.currentImage.id).toBe('yosemite-valley');
    expect(hookValue.currentImage.title).toBe('Yosemite Valley');
    expect(saveSpy).toHaveBeenCalledWith({
      id: 'yosemite-valley',
      type: 'bundled',
      title: 'Yosemite Valley',
    });
  });

  test('confirming cropped image updates current image with custom source', async () => {
    jest.spyOn(storage, 'loadSavedImagePreference').mockResolvedValue(null);
    jest.spyOn(storage, 'cropSquareImage').mockResolvedValue({
      id: 'custom_555',
      uri: 'file:///data/puzzle_555.jpg',
      width: 1024,
      height: 1024,
    });
    const saveSpy = jest.spyOn(storage, 'saveImagePreference').mockResolvedValue(true);

    await act(async () => {
      create(<TestComponent />);
    });

    await act(async () => {
      await hookValue.confirmCroppedImage({
        uri: 'file:///temp/raw.jpg',
        cropX: 10,
        cropY: 20,
        cropSize: 500,
        title: 'Sunset',
      });
    });

    expect(hookValue.currentImage.id).toBe('custom_555');
    expect(hookValue.currentImage.type).toBe('custom');
    expect(hookValue.currentImage.source).toEqual({uri: 'file:///data/puzzle_555.jpg'});
    expect(hookValue.currentImage.title).toBe('Sunset');
    expect(saveSpy).toHaveBeenCalledWith({
      id: 'custom_555',
      type: 'custom',
      uri: 'file:///data/puzzle_555.jpg',
      title: 'Sunset',
    });
  });
});
