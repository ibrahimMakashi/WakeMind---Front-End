import {useCallback, useEffect, useMemo, useState} from 'react';
import {findImageById, getDefaultImage, resolveImageSource} from '../puzzle/imageCatalog';
import {
  cropSquareImage,
  getRecentImages,
  loadSavedImagePreference,
  pickImageFromPhone,
  recordRecentImage,
  saveImagePreference,
} from '../puzzle/imageStorage';

export function usePuzzleImage() {
  const [currentImage, setCurrentImage] = useState(() => {
    const defaultItem = getDefaultImage();
    return {
      id: defaultItem.id,
      title: defaultItem.title,
      type: 'bundled',
      source: defaultItem.asset,
    };
  });

  const [recentImages, setRecentImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshRecents = useCallback(async () => {
    try {
      const recents = await getRecentImages();
      setRecentImages(recents || []);
    } catch (recentsErr) {
      console.warn('Failed to load recent puzzle images', recentsErr);
    }
  }, []);

  // Restore saved image preference on initial mount
  useEffect(() => {
    let active = true;
    loadSavedImagePreference()
      .then(saved => {
        if (!active || !saved) {
          return;
        }
        if (saved.type === 'bundled') {
          const found = findImageById(saved.id);
          setCurrentImage({
            id: found.id,
            title: found.title,
            type: 'bundled',
            source: found.asset,
          });
        } else if (saved.type === 'custom' && saved.uri) {
          setCurrentImage({
            id: saved.id,
            title: saved.title || 'Custom Photo',
            type: 'custom',
            source: {uri: saved.uri},
          });
        }
      })
      .catch(loadErr => {
        console.warn(
          'Failed to load saved puzzle image preference.',
          loadErr instanceof Error ? loadErr.message : loadErr,
        );
      });

    getRecentImages()
      .then(recents => {
        if (active && recents) {
          setRecentImages(recents);
        }
      })
      .catch(recentsErr => {
        console.warn('Failed to load recent puzzle images', recentsErr);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectBundled = useCallback(async id => {
    setError(null);
    const item = findImageById(id);
    const updated = {
      id: item.id,
      title: item.title,
      type: 'bundled',
      source: item.asset,
    };
    setCurrentImage(updated);
    try {
      await saveImagePreference({
        id: item.id,
        type: 'bundled',
        title: item.title,
      });
      const recents = await recordRecentImage({
        id: item.id,
        type: 'bundled',
        title: item.title,
      });
      setRecentImages(recents || []);
    } catch (saveErr) {
      console.warn(
        'Failed to save bundled image preference.',
        saveErr instanceof Error ? saveErr.message : saveErr,
      );
    }
    return updated;
  }, []);

  const selectRecent = useCallback(
    async recentItem => {
      setError(null);
      if (!recentItem || !recentItem.id) {
        return null;
      }
      const resolved = resolveImageSource(
        recentItem.id,
        recentItem.type,
        recentItem.uri,
        recentItem.title,
      );
      setCurrentImage(resolved);
      try {
        await saveImagePreference({
          id: resolved.id,
          type: resolved.type,
          uri: resolved.uri,
          title: resolved.title,
        });
        const recents = await recordRecentImage({
          id: resolved.id,
          type: resolved.type,
          uri: resolved.uri,
          title: resolved.title,
        });
        setRecentImages(recents || []);
      } catch (saveErr) {
        console.warn('Failed to save recent image preference.', saveErr);
      }
      return resolved;
    },
    [],
  );

  const chooseFromPhone = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await pickImageFromPhone();
      setLoading(false);
      if (result.cancelled || !result.uri) {
        return null;
      }
      return result;
    } catch (pickErr) {
      setLoading(false);
      const msg = pickErr instanceof Error ? pickErr.message : 'Photo selection failed';
      setError(msg);
      return null;
    }
  }, []);

  const confirmCroppedImage = useCallback(async ({uri, cropX, cropY, cropSize, title = 'Custom Photo'}) => {
    setError(null);
    setLoading(true);
    try {
      const cropped = await cropSquareImage({
        uri,
        cropX,
        cropY,
        cropSize,
        targetSize: 1024,
      });
      const updated = {
        id: cropped.id,
        title,
        type: 'custom',
        source: {uri: cropped.uri},
      };
      setCurrentImage(updated);
      await saveImagePreference({
        id: cropped.id,
        type: 'custom',
        uri: cropped.uri,
        title,
      });
      const recents = await recordRecentImage({
        id: cropped.id,
        type: 'custom',
        uri: cropped.uri,
        title,
      });
      setRecentImages(recents || []);
      setLoading(false);
      return updated;
    } catch (cropErr) {
      setLoading(false);
      const msg = cropErr instanceof Error ? cropErr.message : 'Cropping failed';
      setError(msg);
      throw cropErr;
    }
  }, []);

  return useMemo(
    () => ({
      currentImage,
      recentImages,
      loading,
      error,
      refreshRecents,
      selectBundled,
      selectRecent,
      chooseFromPhone,
      confirmCroppedImage,
      clearError: () => setError(null),
    }),
    [
      chooseFromPhone,
      confirmCroppedImage,
      currentImage,
      error,
      loading,
      recentImages,
      refreshRecents,
      selectBundled,
      selectRecent,
    ],
  );
}
