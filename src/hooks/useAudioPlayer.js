import { useState, useRef, useCallback } from 'react';

/**
 * Hook to manage audio playback with synchronization
 */
export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);
  const syncIntervalRef = useRef(null);

  /**
   * Load and play a track from URL with timestamp synchronization
   * @param {string} trackId - Track ID
   * @param {string} url - Public URL of the audio file
   * @param {number} startPosition - Position to start in seconds
   * @param {number} timestamp - Timestamp when play was initiated
   */
  const playTrack = useCallback((trackId, url, startPosition = 0, timestamp = Date.now()) => {
    console.log('[useAudioPlayer] Playing track:', { trackId, url, startPosition, timestamp });

    // Stop current track if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Clear sync interval
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    // Create new audio element
    const audio = new Audio(url);
    audioRef.current = audio;

    // Calculate synced position based on timestamp
    const now = Date.now();
    const offset = (now - timestamp) / 1000; // seconds elapsed since play command
    const syncedPosition = startPosition + offset;

    console.log('[useAudioPlayer] Synced position:', syncedPosition, 'offset:', offset);

    // Event listeners
    audio.addEventListener('loadedmetadata', () => {
      console.log('[useAudioPlayer] Track loaded, duration:', audio.duration);
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      console.log('[useAudioPlayer] Track ended');
      setIsPlaying(false);
      setCurrentTrackId(null);
      // TODO: Auto-play next track
    });

    audio.addEventListener('error', (e) => {
      console.error('[useAudioPlayer] Playback error:', e);
      setIsPlaying(false);
      alert('Error playing audio');
    });

    // Wait for audio to be ready before playing
    audio.addEventListener('canplay', () => {
      console.log('[useAudioPlayer] Audio ready, starting playback');

      // Set position now that audio is ready
      audio.currentTime = Math.max(0, syncedPosition);

      // Start playback
      audio.play()
        .then(() => {
          console.log('[useAudioPlayer] Playback started');
          setIsPlaying(true);
          setCurrentTrackId(trackId);
        })
        .catch((error) => {
          console.error('[useAudioPlayer] Play failed:', error);
          alert('Failed to play audio. ' + error.message);
        });
    }, { once: true }); // Only fire once

    // Load the audio
    audio.load();

    // Update current time periodically
    syncIntervalRef.current = setInterval(() => {
      if (audio && !audio.paused) {
        setCurrentTime(audio.currentTime);
      }
    }, 100);
  }, []);

  /**
   * Pause current playback
   */
  const pause = useCallback(() => {
    console.log('[useAudioPlayer] Pausing');
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  /**
   * Resume playback from current position
   */
  const resume = useCallback(() => {
    console.log('[useAudioPlayer] Resuming');
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('[useAudioPlayer] Resume failed:', error);
        });
    }
  }, []);

  /**
   * Stop playback and clear
   */
  const stop = useCallback(() => {
    console.log('[useAudioPlayer] Stopping');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    setIsPlaying(false);
    setCurrentTrackId(null);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  /**
   * Seek to position
   * @param {number} position - Position in seconds
   */
  const seek = useCallback((position) => {
    console.log('[useAudioPlayer] Seeking to:', position);
    if (audioRef.current) {
      audioRef.current.currentTime = position;
      setCurrentTime(position);
    }
  }, []);

  return {
    isPlaying,
    currentTrackId,
    currentTime,
    duration,
    playTrack,
    pause,
    resume,
    stop,
    seek,
  };
}
