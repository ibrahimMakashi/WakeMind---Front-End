/**
 * Central image registry for bundled puzzle artwork.
 * Easy to extend with additional bundled images.
 */

export const DEFAULT_PUZZLE_IMAGE_ID = 'moraine-lake';
export const DEFAULT_PUZZLE_IMAGE_TYPE = 'bundled';
export const DEFAULT_PUZZLE_IMAGE_TITLE = 'Moraine Lake';

export const DEFAULT_IMAGES = [
  {
    id: 'moraine-lake',
    title: 'Moraine Lake',
    category: 'Nature',
    description: 'Turquoise glacial lake in Banff National Park',
    asset: require('../assets/puzzle/sample.png'),
  },
  {
    id: 'mount-fuji',
    title: 'Mount Fuji',
    category: 'Landmark',
    description: 'Iconic snow-capped peak across Lake Kawaguchi',
    asset: require('../assets/puzzle/fuji.png'),
  },
  {
    id: 'yosemite-valley',
    title: 'Yosemite Valley',
    category: 'Landscape',
    description: 'Tunnel View looking out over El Capitan & Half Dome',
    asset: require('../assets/puzzle/yosemite.png'),
  },
];

export function getDefaultImage() {
  return DEFAULT_IMAGES[0];
}

export function findImageById(id) {
  if (!id) {
    return getDefaultImage();
  }
  return DEFAULT_IMAGES.find(img => img.id === id) || getDefaultImage();
}

/**
 * Resolve an image descriptor to its displayable object (including RN Image source).
 *
 * @param {string} id
 * @param {'bundled'|'custom'} [type]
 * @param {string} [uri]
 * @param {string} [title]
 * @returns {{id: string, type: 'bundled'|'custom', title: string, source: any, uri: string}}
 */
export function resolveImageSource(id, type = 'bundled', uri = '', title = '') {
  if (type === 'custom') {
    return {
      id: id || `custom_${Date.now()}`,
      type: 'custom',
      title: title || 'Custom Photo',
      uri: uri || '',
      source: uri ? {uri} : null,
    };
  }

  const bundled = findImageById(id || DEFAULT_PUZZLE_IMAGE_ID);
  return {
    id: bundled.id,
    type: 'bundled',
    title: bundled.title,
    uri: '',
    source: bundled.asset,
  };
}
