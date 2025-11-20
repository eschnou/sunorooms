import { formatTime, formatFileSize } from '../utils/audioUtils';

function Playlist({ tracks, isDJ, onRemoveTrack }) {
  if (!tracks || tracks.length === 0) {
    return (
      <div style={{ padding: '1rem', border: '1px solid #444', borderRadius: '4px' }}>
        <h3 style={{ color: '#fff' }}>Playlist</h3>
        <p style={{ color: '#888', textAlign: 'center', margin: '2rem 0' }}>
          No tracks yet. {isDJ && 'Upload some music to get started!'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', border: '1px solid #444', borderRadius: '4px' }}>
      <h3 style={{ color: '#fff' }}>Playlist ({tracks.length})</h3>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
        {tracks.map((track, index) => (
          <li
            key={track.id}
            style={{
              padding: '0.75rem',
              marginBottom: '0.5rem',
              backgroundColor: '#2a2a3e',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span style={{ color: '#888', fontWeight: 'bold', minWidth: '2rem' }}>
              {index + 1}.
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 'bold',
                  color: '#fff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {track.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                {formatTime(track.duration)}
                {track.size && ` • ${formatFileSize(track.size)}`}
                {track.status && (
                  <span style={{ marginLeft: '0.5rem', color: getStatusColor(track.status) }}>
                    • {track.status}
                  </span>
                )}
              </div>
            </div>
            {isDJ && onRemoveTrack && (
              <button
                onClick={() => onRemoveTrack(track.id)}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
                title="Remove track"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
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
