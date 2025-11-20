import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useRealtimeRoom } from '../hooks/useRealtimeRoom';
import { usePlaylist } from '../hooks/usePlaylist';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { supabase } from '../utils/supabase';
import Participants from './Participants';
import TrackUploader from './TrackUploader';
import Playlist from './Playlist';
import DJControls from './DJControls';
import DanceFloor from './DanceFloor';
import './RoomView.css';

function RoomView() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isDJ = searchParams.get('dj') === 'true';

  const { participants, isConnected, currentUser, sendBroadcast, onBroadcast, updatePresence } = useRealtimeRoom(slug, isDJ);
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

  // Use refs to store audio player functions to avoid useEffect re-runs
  const playTrackRef = useRef(playTrack);
  const pauseRef = useRef(pause);
  const stopRef = useRef(stop);

  // Keep refs updated
  useEffect(() => {
    playTrackRef.current = playTrack;
    pauseRef.current = pause;
    stopRef.current = stop;
  }, [playTrack, pause, stop]);

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

    console.log('[RoomView] Setting up spectator broadcast listeners');

    // Create handler functions using refs to avoid re-registering listeners
    const handlePlayBroadcast = ({ payload }) => {
      console.log('[RoomView] Spectator received playback-play:', payload);
      const { trackId, url, startPosition, timestamp } = payload;
      playTrackRef.current(trackId, url, startPosition, timestamp);
    };

    const handlePauseBroadcast = ({ payload }) => {
      console.log('[RoomView] Spectator received playback-pause:', payload);
      pauseRef.current();
    };

    const handleStopBroadcast = ({ payload }) => {
      console.log('[RoomView] Spectator received playback-stop:', payload);
      stopRef.current();
    };

    // Register listeners (only once when onBroadcast/isDJ changes)
    onBroadcast('playback-play', handlePlayBroadcast);
    onBroadcast('playback-pause', handlePauseBroadcast);
    onBroadcast('playback-stop', handleStopBroadcast);

    // Note: Supabase doesn't provide an off() method for broadcasts
    // Cleanup happens when channel unsubscribes
  }, [onBroadcast, isDJ]);

  // Late joiners: Check DJ's presence for current playback state
  useEffect(() => {
    if (isDJ || !isConnected || participants.length === 0) return;

    console.log('[RoomView] Spectator checking DJ presence for late joiner sync');
    console.log('[RoomView] All participants:', participants);

    // Find the DJ in participants
    const dj = participants.find((p) => p.isDJ);
    console.log('[RoomView] Found DJ:', dj);

    if (!dj) {
      console.log('[RoomView] No DJ found in participants');
      return;
    }

    if (!dj.playbackState) {
      console.log('[RoomView] DJ found but no playback state');
      return;
    }

    const { playbackState } = dj;
    console.log('[RoomView] DJ playback state:', playbackState);

    // If DJ is playing, sync playback
    if (playbackState.isPlaying && playbackState.trackId && playbackState.trackUrl) {
      const { trackId, trackUrl, startPosition, timestamp } = playbackState;
      console.log('[RoomView] Late joiner: Starting synced playback');
      playTrackRef.current(trackId, trackUrl, startPosition, timestamp);
    } else {
      console.log('[RoomView] DJ not playing or missing track info');
    }
  }, [isDJ, isConnected, participants]);

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
    // If resuming the same track, start from current position, otherwise start from 0
    const startPosition = (currentTrackId === trackToPlay.id && currentTime > 0) ? currentTime : 0;

    console.log('[RoomView] Starting playback from position:', startPosition);

    // Play locally
    playTrack(trackToPlay.id, trackToPlay.url, startPosition, timestamp);

    // Broadcast to all participants
    sendBroadcast('playback-play', {
      trackId: trackToPlay.id,
      url: trackToPlay.url,
      startPosition,
      timestamp,
    });

    // Update DJ presence for late joiners
    if (isDJ) {
      updatePresence({
        playbackState: {
          isPlaying: true,
          trackId: trackToPlay.id,
          trackUrl: trackToPlay.url,
          startPosition,
          timestamp,
        },
      });
    }
  };

  const handlePause = () => {
    console.log('[RoomView] DJ pausing playback');

    // Pause locally
    pause();

    // Broadcast to all participants
    sendBroadcast('playback-pause', {});

    // Update DJ presence for late joiners
    if (isDJ) {
      updatePresence({
        playbackState: {
          isPlaying: false,
          trackId: currentTrackId,
          pausedAt: currentTime,
        },
      });
    }
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

  // VISITOR VIEW - Full-screen background with minimal overlay
  if (!isDJ) {
    return (
      <div className="room-visitor">
        <DanceFloor participants={participants} isPlaying={isPlaying} />
        <div className="visitor-overlay">
          <h2>🎵 SunoRooms</h2>
          <p>
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'Connected' : 'Connecting...'}
          </p>
          <p>
            Room: <span className="room-code">{slug}</span>
          </p>
          <p>Participants: {participants.length}</p>
        </div>
      </div>
    );
  }

  // DJ VIEW - Split screen with control panel
  return (
    <div className="room-dj">
      {/* Left side - Background */}
      <div className="dj-background">
        <DanceFloor participants={participants} isPlaying={isPlaying} />
      </div>

      {/* Right side - Control Panel */}
      <div className="dj-panel">
        {/* Panel Header */}
        <div className="dj-panel-header">
          <h1>
            🎵 SunoRooms
            <span className="dj-badge">DJ</span>
          </h1>
          <div className="room-info">
            <div>Room: <span className="room-code">{slug}</span></div>
            <div className="connection-indicator">
              <span className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
              {isConnected ? 'Connected' : 'Connecting...'}
            </div>
          </div>
        </div>

        {/* Participants Section */}
        <div className="dj-panel-section">
          <h3>👥 Participants: {participants.length}</h3>
          <Participants participants={participants} currentUserId={currentUser.userId} />
        </div>

        {/* Upload Section */}
        <div className="dj-panel-section">
          <h3>🎵 Upload Music</h3>
          <TrackUploader onTrackUpload={handleTrackUpload} disabled={!isConnected} />
        </div>

        {/* Playlist Section */}
        <div className="dj-panel-section">
          <h3>📋 Playlist</h3>
          <Playlist
            tracks={playlist}
            isDJ={isDJ}
            currentTrackId={currentTrackId}
            onRemoveTrack={handleRemoveTrack}
          />
        </div>

        {/* DJ Controls Section */}
        <div className="dj-panel-section">
          <h3>🎧 DJ Controls</h3>
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
      </div>
    </div>
  );
}

export default RoomView;
