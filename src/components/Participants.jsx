function Participants({ participants, currentUserId }) {
  if (!participants || participants.length === 0) {
    return (
      <div className="dj-participants-list">
        <p style={{ color: '#666', textAlign: 'center' }}>No one here yet...</p>
      </div>
    );
  }

  return (
    <div className="dj-participants-list">
      {participants.map((participant) => {
        const isCurrentUser = participant.userId === currentUserId;
        const isDJ = participant.isDJ;
        return (
          <div key={participant.userId} className="dj-participant-item">
            <span className="dj-participant-emoji">
              {isDJ ? '🎧' : '👤'}
            </span>
            <div className="dj-participant-info">
              <div className="dj-participant-name">
                {participant.nickname}
                {isCurrentUser && <span style={{ opacity: 0.7 }}> (you)</span>}
              </div>
              {isDJ && <div className="dj-participant-badge">DJ</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Participants;
