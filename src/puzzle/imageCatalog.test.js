import {DEFAULT_IMAGES, findImageById, getDefaultImage} from './imageCatalog';

describe('imageCatalog', () => {
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
});
