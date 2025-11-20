import { formatTime } from '../utils/audioUtils';

function DJControls({
  playlist,
  currentTrackId,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onSkip,
  disabled,
}) {
  const currentTrackIndex = playlist.findIndex((t) => t.id === currentTrackId);
  const hasNextTrack = currentTrackIndex < playlist.length - 1;

  // Get first track if nothing is playing
  const trackToPlay = currentTrackId
    ? playlist.find((t) => t.id === currentTrackId)
    : playlist[0];

  const canPlay = playlist.length > 0 && !disabled;

  return (
    <div style={{ padding: '1rem', border: '1px solid #444', borderRadius: '4px' }}>
      <h3 style={{ color: '#fff', marginBottom: '1rem' }}>DJ Controls</h3>

      {trackToPlay && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ color: '#fff', fontWeight: 'bold' }}>
            Now Playing: {trackToPlay.name}
          </div>
          <div style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {formatTime(currentTime)} / {formatTime(duration || trackToPlay.duration)}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {!isPlaying ? (
          <button
            onClick={onPlay}
            disabled={!canPlay}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: canPlay ? '#28a745' : '#444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: canPlay ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            ▶ Play
          </button>
        ) : (
          <button
            onClick={onPause}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#ffc107',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ⏸ Pause
          </button>
        )}

        <button
          onClick={onSkip}
          disabled={!hasNextTrack || !isPlaying}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: hasNextTrack && isPlaying ? '#646cff' : '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: hasNextTrack && isPlaying ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
          }}
        >
          ⏭ Skip
        </button>
      </div>

      {playlist.length === 0 && (
        <p style={{ color: '#888', margin: 0 }}>Upload tracks to start playing</p>
      )}
    </div>
  );
}

export default DJControls;
