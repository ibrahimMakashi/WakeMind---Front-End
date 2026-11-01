import React from 'react';
import {act, create} from 'react-test-renderer';
import {
  _resetFallbackStateForTest,
  registerCustomImage,
} from '../puzzle/imageStorage';
import {usePuzzleImageLibrary} from './usePuzzleImageLibrary';

describe('usePuzzleImageLibrary', () => {
  let hookValue;

  function TestComponent() {
    hookValue = usePuzzleImageLibrary();
    return null;
  }

  beforeEach(() => {
    _resetFallbackStateForTest();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('initializes with default bundled images and empty recents', async () => {
    await act(async () => {
      create(<TestComponent />);
    });

    expect(hookValue.bundledImages.length).toBeGreaterThanOrEqual(3);
    expect(hookValue.recentImages).toEqual([]);
  });

  test('records and refreshes recent images', async () => {
    await act(async () => {
      create(<TestComponent />);
    });

    await act(async () => {
      await hookValue.recordRecent({
        id: 'mount-fuji',
        type: 'bundled',
        title: 'Mount Fuji',
      });
    });

    expect(hookValue.recentImages).toHaveLength(1);
    expect(hookValue.recentImages[0].id).toBe('mount-fuji');
  });

  test('resolves bundled alarm image correctly', async () => {
    await act(async () => {
      create(<TestComponent />);
    });

    let resolved;
    await act(async () => {
      resolved = await hookValue.resolveAlarmImage('yosemite-valley', 'bundled');
    });

    expect(resolved.id).toBe('yosemite-valley');
    expect(resolved.title).toBe('Yosemite Valley');
    expect(resolved.type).toBe('bundled');
    expect(resolved.source).toBeDefined();
  });

  test('resolves custom alarm image correctly or falls back to default if not found', async () => {
    await registerCustomImage({
      id: 'custom_777',
      uri: 'file:///custom_777.jpg',
      title: 'Graduation',
    });

    await act(async () => {
      create(<TestComponent />);
    });

    let resolved;
    await act(async () => {
      resolved = await hookValue.resolveAlarmImage('custom_777', 'custom');
    });

    expect(resolved.id).toBe('custom_777');
    expect(resolved.title).toBe('Graduation');
    expect(resolved.type).toBe('custom');
    expect(resolved.source).toEqual({uri: 'file:///custom_777.jpg'});

    let missing;
    await act(async () => {
      missing = await hookValue.resolveAlarmImage('missing_custom', 'custom');
    });
    expect(missing.id).toBe('moraine-lake');
    expect(missing.type).toBe('bundled');
  });
});
