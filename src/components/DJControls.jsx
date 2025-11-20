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
    <div>
      {trackToPlay && (
        <div style={{ marginBottom: '15px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>
            {trackToPlay.name}
          </div>
          <div style={{ color: '#888', fontSize: '14px' }}>
            {formatTime(currentTime)} / {formatTime(duration || trackToPlay.duration)}
          </div>
        </div>
      )}

      <div className="dj-controls">
        {!isPlaying ? (
          <button
            onClick={onPlay}
            disabled={!canPlay}
            className="dj-control-btn play"
          >
            ▶ Play
          </button>
        ) : (
          <button
            onClick={onPause}
            className="dj-control-btn pause"
          >
            ⏸ Pause
          </button>
        )}

        <button
          onClick={onSkip}
          disabled={!hasNextTrack || !isPlaying}
          className="dj-control-btn stop"
        >
          ⏭ Skip
        </button>
      </div>

      {playlist.length === 0 && (
        <p style={{ color: '#666', textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
          Upload tracks to start playing
        </p>
      )}
    </div>
  );
}

export default DJControls;
