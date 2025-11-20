import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useRealtimeRoom } from '../hooks/useRealtimeRoom';
import { usePlaylist } from '../hooks/usePlaylist';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { supabase } from '../utils/supabase';
import Participants from './Participants';
import TrackUploader from './TrackUploader';
import Playlist from './Playlist';
import DJControls from './DJControls';

function RoomView() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isDJ = searchParams.get('dj') === 'true';

  const { participants, isConnected, currentUser, sendBroadcast, onBroadcast } = useRealtimeRoom(slug, isDJ);
  const {
    playlist,
    addTrack,
    removeTrack,
    updateTrackStatus,
  } = usePlaylist();
  const {
    isPlaying,
    currentTrackId,
    currentTime,
    duration,
    playTrack,
    pause,
    stop,
  } = useAudioPlayer();

  // Listen for track-added broadcasts
  useEffect(() => {
    if (!onBroadcast) return;

    onBroadcast('track-added', ({ payload }) => {
      console.log('[RoomView] Received track-added:', payload);
      // Payload now contains: { id, name, size, duration, url }
      addTrack({ ...payload, status: 'ready' });
    });
  }, [onBroadcast, addTrack]);

  // Listen for playback broadcasts (spectators only - DJ controls locally)
  useEffect(() => {
    if (!onBroadcast || isDJ) return; // DJ doesn't listen to broadcasts

    // Listen for play commands
    onBroadcast('playback-play', ({ payload }) => {
      console.log('[RoomView] Spectator received playback-play:', payload);
      const { trackId, url, startPosition, timestamp } = payload;
      playTrack(trackId, url, startPosition, timestamp);
    });

    // Listen for pause commands
    onBroadcast('playback-pause', () => {
      console.log('[RoomView] Spectator received playback-pause');
      pause();
    });

    // Listen for stop commands
    onBroadcast('playback-stop', () => {
      console.log('[RoomView] Spectator received playback-stop');
      stop();
    });
  }, [onBroadcast, isDJ, playTrack, pause, stop]);

  const handleTrackUpload = async (track, arrayBuffer) => {
    console.log('[RoomView] DJ uploading track to Supabase Storage:', track);

    try {
      // Convert ArrayBuffer to File for Supabase upload
      const file = new File([arrayBuffer], track.name, { type: 'audio/mpeg' });

      // Upload to Supabase Storage
      const filePath = `${track.id}.mp3`;
      const { data, error } = await supabase.storage
        .from('audio')
        .upload(filePath, file, {
          contentType: 'audio/mpeg',
          upsert: false,
        });

      if (error) {
        console.error('[RoomView] Upload error:', error);
        updateTrackStatus(track.id, 'error');
        alert('Failed to upload track: ' + error.message);
        return;
      }

      console.log('[RoomView] Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audio')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('[RoomView] Public URL:', publicUrl);

      // Add track to local playlist with URL
      const trackWithUrl = { ...track, url: publicUrl, status: 'ready' };
      addTrack(trackWithUrl);

      // Broadcast track metadata + URL to all participants
      sendBroadcast('track-added', trackWithUrl);

      console.log('[RoomView] Track uploaded and broadcasted');
    } catch (err) {
      console.error('[RoomView] Upload exception:', err);
      updateTrackStatus(track.id, 'error');
      alert('Failed to upload track');
    }
  };

  const handleRemoveTrack = (trackId) => {
    console.log('[RoomView] Removing track:', trackId);
    removeTrack(trackId);
    // TODO: Broadcast track removal in future phase
  };

  const handlePlay = () => {
    console.log('[RoomView] DJ playing track');

    // Get the track to play (current or first in playlist)
    const trackToPlay = currentTrackId
      ? playlist.find((t) => t.id === currentTrackId)
      : playlist[0];

    if (!trackToPlay || !trackToPlay.url) {
      console.error('[RoomView] No track to play or missing URL');
      return;
    }

    const timestamp = Date.now();
    const startPosition = isPlaying ? currentTime : 0;

    // Play locally
    playTrack(trackToPlay.id, trackToPlay.url, startPosition, timestamp);

    // Broadcast to all participants
    sendBroadcast('playback-play', {
      trackId: trackToPlay.id,
      url: trackToPlay.url,
      startPosition,
      timestamp,
    });
  };

  const handlePause = () => {
    console.log('[RoomView] DJ pausing playback');

    // Pause locally
    pause();

    // Broadcast to all participants
    sendBroadcast('playback-pause', {});
  };

  const handleSkip = () => {
    console.log('[RoomView] DJ skipping to next track');

    const currentIndex = playlist.findIndex((t) => t.id === currentTrackId);
    const nextTrack = playlist[currentIndex + 1];

    if (!nextTrack || !nextTrack.url) {
      console.error('[RoomView] No next track available');
      return;
    }

    const timestamp = Date.now();

    // Play next track locally
    playTrack(nextTrack.id, nextTrack.url, 0, timestamp);

    // Broadcast to all participants
    sendBroadcast('playback-play', {
      trackId: nextTrack.id,
      url: nextTrack.url,
      startPosition: 0,
      timestamp,
    });
  };

  if (!slug) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Invalid room URL</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', color: '#fff' }}>🎵 SunoRooms</h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          <span style={{ color: '#888' }}>Room:</span>
          <code
            style={{
              backgroundColor: '#2a2a3e',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              flex: 1,
              color: '#fff',
            }}
          >
            {slug}
          </code>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#28a745' : '#dc3545',
          }}
        />
        <span style={{ color: '#888' }}>
          {isConnected ? 'Connected' : 'Connecting...'}
        </span>
      </div>

      {isDJ && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#2a2a3e',
            borderRadius: '4px',
            marginBottom: '2rem',
          }}
        >
          <p style={{ margin: 0, color: '#ffd700' }}>
            🎧 You are the DJ for this room
          </p>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <Participants participants={participants} currentUserId={currentUser.userId} />
      </div>

      {isDJ && (
        <div style={{ marginBottom: '2rem' }}>
          <TrackUploader onTrackUpload={handleTrackUpload} disabled={!isConnected} />
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <Playlist
          tracks={playlist}
          isDJ={isDJ}
          onRemoveTrack={isDJ ? handleRemoveTrack : null}
        />
      </div>

      {isDJ ? (
        <div style={{ marginBottom: '2rem' }}>
          <DJControls
            playlist={playlist}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlay={handlePlay}
            onPause={handlePause}
            onSkip={handleSkip}
            disabled={!isConnected || playlist.length === 0}
          />
        </div>
      ) : (
        <>
          {currentTrackId && (
            <div
              style={{
                padding: '1rem',
                border: '1px solid #444',
                borderRadius: '4px',
                marginBottom: '2rem',
              }}
            >
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Now Playing</h3>
              {playlist.find((t) => t.id === currentTrackId) && (
                <>
                  <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {playlist.find((t) => t.id === currentTrackId).name}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.9rem' }}>
                    {isPlaying ? '▶ Playing' : '⏸ Paused'}
                  </div>
                </>
              )}
            </div>
          )}
          <div
            style={{
              padding: '1rem',
              border: '1px solid #444',
              borderRadius: '4px',
              textAlign: 'center',
              color: '#888',
            }}
          >
            <p style={{ margin: 0 }}>
              Share the room name "<strong style={{ color: '#fff' }}>{slug}</strong>" with friends to invite them!
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default RoomView;
