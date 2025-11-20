import { useState, useCallback } from 'react';

/**
 * Hook to manage playlist state and tracks cache
 */
export function usePlaylist() {
  const [playlist, setPlaylist] = useState([]);
  const [tracksCache, setTracksCache] = useState(new Map());

  /**
   * Add a track to the playlist
   * @param {Object} track - Track metadata {id, name, size, duration}
   */
  const addTrack = useCallback((track) => {
    setPlaylist((prev) => {
      // Check if track already exists
      if (prev.find((t) => t.id === track.id)) {
        console.log('[usePlaylist] Track already in playlist:', track.id);
        return prev;
      }
      console.log('[usePlaylist] Adding track to playlist:', track);
      return [...prev, track];
    });
  }, []);

  /**
   * Remove a track from the playlist
   * @param {string} trackId - Track ID to remove
   */
  const removeTrack = useCallback((trackId) => {
    console.log('[usePlaylist] Removing track:', trackId);
    setPlaylist((prev) => prev.filter((t) => t.id !== trackId));
    setTracksCache((prev) => {
      const newCache = new Map(prev);
      newCache.delete(trackId);
      return newCache;
    });
  }, []);

  /**
   * Store track data in cache (ArrayBuffer and/or AudioBuffer)
   * @param {string} trackId - Track ID
   * @param {Object} data - { arrayBuffer?, audioBuffer? }
   */
  const cacheTrackData = useCallback((trackId, data) => {
    console.log('[usePlaylist] Caching track data:', trackId);
    setTracksCache((prev) => {
      const newCache = new Map(prev);
      const existing = newCache.get(trackId) || {};
      newCache.set(trackId, { ...existing, ...data });
      return newCache;
    });
  }, []);

  /**
   * Get track data from cache
   * @param {string} trackId - Track ID
   * @returns {Object|undefined} Cached data or undefined
   */
  const getTrackData = useCallback(
    (trackId) => {
      return tracksCache.get(trackId);
    },
    [tracksCache]
  );

  /**
   * Update track status (e.g., loading, ready, error)
   * @param {string} trackId - Track ID
   * @param {string} status - Status string
   */
  const updateTrackStatus = useCallback((trackId, status) => {
    setPlaylist((prev) =>
      prev.map((track) =>
        track.id === trackId ? { ...track, status } : track
      )
    );
  }, []);

  /**
   * Clear entire playlist and cache
   */
  const clearPlaylist = useCallback(() => {
    console.log('[usePlaylist] Clearing playlist');
    setPlaylist([]);
    setTracksCache(new Map());
  }, []);

  return {
    playlist,
    tracksCache,
    addTrack,
    removeTrack,
    cacheTrackData,
    getTrackData,
    updateTrackStatus,
    clearPlaylist,
  };
}
