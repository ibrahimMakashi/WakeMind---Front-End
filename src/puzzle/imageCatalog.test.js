import {
  DEFAULT_IMAGES,
  DEFAULT_PUZZLE_IMAGE_ID,
  DEFAULT_PUZZLE_IMAGE_TITLE,
  DEFAULT_PUZZLE_IMAGE_TYPE,
  findImageById,
  getDefaultImage,
  resolveImageSource,
} from './imageCatalog';

describe('imageCatalog', () => {
  test('constants have expected defaults', () => {
    expect(DEFAULT_PUZZLE_IMAGE_ID).toBe('moraine-lake');
    expect(DEFAULT_PUZZLE_IMAGE_TYPE).toBe('bundled');
    expect(DEFAULT_PUZZLE_IMAGE_TITLE).toBe('Moraine Lake');
  });
  test('DEFAULT_IMAGES contains valid bundled artwork entries', () => {
    expect(DEFAULT_IMAGES.length).toBeGreaterThanOrEqual(1);
    DEFAULT_IMAGES.forEach(item => {
      expect(typeof item.id).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.category).toBe('string');
      expect(item.asset).toBeDefined();
    });
  });

  test('getDefaultImage returns the first default image', () => {
    const defaultImg = getDefaultImage();
    expect(defaultImg).toBe(DEFAULT_IMAGES[0]);
    expect(defaultImg.id).toBe('moraine-lake');
  });

  test('findImageById returns matching image or falls back to default', () => {
    const fuji = findImageById('mount-fuji');
    expect(fuji.id).toBe('mount-fuji');
    expect(fuji.title).toBe('Mount Fuji');

    const unknown = findImageById('non-existent-image-id');
    expect(unknown).toBe(getDefaultImage());

    const empty = findImageById(null);
    expect(empty).toBe(getDefaultImage());
  });

  test('resolveImageSource resolves bundled and custom images', () => {
    const bundled = resolveImageSource('mount-fuji', 'bundled');
    expect(bundled.id).toBe('mount-fuji');
    expect(bundled.title).toBe('Mount Fuji');
    expect(bundled.type).toBe('bundled');
    expect(bundled.source).toBeDefined();

    const fallbackBundled = resolveImageSource('missing-id');
    expect(fallbackBundled.id).toBe('moraine-lake');

    const custom = resolveImageSource('custom_456', 'custom', 'file:///custom.jpg', 'My Trip');
    expect(custom.id).toBe('custom_456');
    expect(custom.type).toBe('custom');
    expect(custom.title).toBe('My Trip');
    expect(custom.source).toEqual({uri: 'file:///custom.jpg'});
  });
});
