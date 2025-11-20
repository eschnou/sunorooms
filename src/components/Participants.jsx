function Participants({ participants, currentUserId }) {
  if (!participants || participants.length === 0) {
    return (
      <div style={{ padding: '1rem', border: '1px solid #444' }}>
        <h3>Participants: 0</h3>
        <p style={{ color: '#888' }}>No one here yet...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', border: '1px solid #444' }}>
      <h3 style={{ color: '#fff' }}>Participants: {participants.length}</h3>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
        {participants.map((participant) => {
          const isCurrentUser = participant.userId === currentUserId;
          const isDJ = participant.isDJ;
          return (
            <li
              key={participant.userId}
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                backgroundColor: isCurrentUser ? '#2a2a3e' : 'transparent',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: isDJ && isCurrentUser ? '2px solid #ffd700' : 'none',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>
                {isDJ ? '🎧' : '👤'}
              </span>
              <span style={{ flex: 1, color: '#fff' }}>
                {participant.nickname}
                {isCurrentUser && (
                  <span style={{ color: '#646cff', fontWeight: 'bold' }}> (you)</span>
                )}
              </span>
              {isDJ && (
                <span
                  style={{
                    backgroundColor: '#ffd700',
                    color: '#000',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  DJ
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Participants;
