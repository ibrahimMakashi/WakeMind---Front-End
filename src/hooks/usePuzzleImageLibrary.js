import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  DEFAULT_IMAGES,
  DEFAULT_PUZZLE_IMAGE_ID,
  DEFAULT_PUZZLE_IMAGE_TYPE,
  findImageById,
  resolveImageSource,
} from '../puzzle/imageCatalog';
import {
  getCustomImageById,
  getRecentImages,
  recordRecentImage,
} from '../puzzle/imageStorage';

/**
 * Hook to manage the shared puzzle image library, recently selected artwork,
 * and resolution of alarm image assignments.
 */
export function usePuzzleImageLibrary() {
  const [recentImages, setRecentImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshRecents = useCallback(async () => {
    try {
      const recents = await getRecentImages();
      setRecentImages(recents || []);
      return recents;
    } catch (loadErr) {
      console.warn('Failed to load recent puzzle images', loadErr);
      return [];
    }
  }, []);

  useEffect(() => {
    let active = true;
    getRecentImages()
      .then(recents => {
        if (active) {
          setRecentImages(recents || []);
        }
      })
      .catch(loadErr => {
        console.warn('Failed to load recent puzzle images on mount', loadErr);
      });

    return () => {
      active = false;
    };
  }, []);

  const recordRecent = useCallback(async image => {
    if (!image || !image.id) {
      return;
    }
    try {
      const updated = await recordRecentImage(image);
      setRecentImages(updated || []);
    } catch (recordErr) {
      console.warn('Failed to record recent puzzle image', recordErr);
    }
  }, []);

  /**
   * Resolve an alarm's saved image assignment (id + type) to a full image object.
   */
  const resolveAlarmImage = useCallback(
    async (id, type) => {
      const imageId = id || DEFAULT_PUZZLE_IMAGE_ID;
      const imageType = type || DEFAULT_PUZZLE_IMAGE_TYPE;

      if (imageType === 'custom') {
        // First check in-memory recentImages
        const inRecents = recentImages.find(r => r.id === imageId && r.uri);
        if (inRecents) {
          return resolveImageSource(
            inRecents.id,
            'custom',
            inRecents.uri,
            inRecents.title || 'Custom Photo',
          );
        }

        // Otherwise query native custom store
        try {
          const stored = await getCustomImageById(imageId);
          if (stored && stored.uri) {
            return resolveImageSource(
              stored.id,
              'custom',
              stored.uri,
              stored.title || 'Custom Photo',
            );
          }
        } catch (lookupErr) {
          console.warn('Custom image lookup failed', lookupErr);
        }

        // Fallback to default bundled image if custom file missing
        const fallback = findImageById(DEFAULT_PUZZLE_IMAGE_ID);
        return {
          id: fallback.id,
          type: 'bundled',
          title: fallback.title,
          source: fallback.asset,
          uri: '',
        };
      }

      // Bundled image
      const bundled = findImageById(imageId);
      return {
        id: bundled.id,
        type: 'bundled',
        title: bundled.title,
        source: bundled.asset,
        uri: '',
      };
    },
    [recentImages],
  );

  return useMemo(
    () => ({
      recentImages,
      bundledImages: DEFAULT_IMAGES,
      loading,
      setLoading,
      refreshRecents,
      recordRecent,
      resolveAlarmImage,
    }),
    [loading, recentImages, recordRecent, refreshRecents, resolveAlarmImage],
  );
}
