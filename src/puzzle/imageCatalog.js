/**
 * Central image registry for bundled puzzle artwork.
 * Easy to extend with additional bundled images.
 */

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
