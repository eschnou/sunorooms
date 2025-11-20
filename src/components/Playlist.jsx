import { formatTime, formatFileSize } from '../utils/audioUtils';

function Playlist({ tracks, isDJ, currentTrackId, onRemoveTrack }) {
  if (!tracks || tracks.length === 0) {
    return (
      <div className="dj-playlist-empty">
        No tracks yet. {isDJ && 'Upload some music to get started!'}
      </div>
    );
  }

  return (
    <div className="dj-playlist">
      {tracks.map((track) => {
        const isPlaying = track.id === currentTrackId;
        return (
          <div
            key={track.id}
            className={`dj-track-item ${isPlaying ? 'playing' : ''}`}
          >
            <span className="dj-track-emoji">🎵</span>
            <div className="dj-track-info">
              <div className="dj-track-name">{track.name}</div>
              <div className="dj-track-duration">
                {formatTime(track.duration)}
                {track.size && ` • ${formatFileSize(track.size)}`}
                {track.status && track.status !== 'ready' && (
                  <span style={{ marginLeft: '0.5rem', color: getStatusColor(track.status) }}>
                    • {track.status}
                  </span>
                )}
              </div>
            </div>
            {isDJ && onRemoveTrack && (
              <button
                onClick={() => onRemoveTrack(track.id)}
                className="dj-track-remove"
                title="Remove track"
              >
                Remove
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'ready':
      return '#28a745';
    case 'loading':
    case 'downloading':
      return '#ffc107';
    case 'error':
      return '#dc3545';
    default:
      return '#888';
  }
}

export default Playlist;
