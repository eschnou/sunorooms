import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { generateRoomSlug } from '../utils/slugGenerator';

function Home() {
  const navigate = useNavigate();
  const [roomSlug, setRoomSlug] = useState('');

  const handleCreateRoom = () => {
    const slug = generateRoomSlug();
    console.log('[Home] Creating room with slug:', slug);
    navigate(`/room/${slug}?dj=true`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomSlug.trim()) {
      console.log('[Home] Joining room:', roomSlug);
      navigate(`/room/${roomSlug.trim()}`);
    }
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff' }}>🎵 SunoRooms</h1>
      <p style={{ color: '#fff' }}>Listen to music together in sync</p>

      <div style={{ marginTop: '3rem' }}>
        <button
          onClick={handleCreateRoom}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            cursor: 'pointer',
            backgroundColor: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '300px',
          }}
        >
          Create New Room
        </button>
      </div>

      <div style={{ margin: '2rem 0', color: '#888' }}>
        — or —
      </div>

      <form onSubmit={handleJoinRoom} style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px', margin: '0 auto' }}>
          <input
            type="text"
            value={roomSlug}
            onChange={(e) => setRoomSlug(e.target.value)}
            placeholder="Enter room name (e.g. funky-tiger-42)"
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              border: '1px solid #444',
              borderRadius: '8px',
              backgroundColor: '#1a1a1a',
              color: 'white',
            }}
          />
          <button
            type="submit"
            disabled={!roomSlug.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              cursor: roomSlug.trim() ? 'pointer' : 'not-allowed',
              backgroundColor: roomSlug.trim() ? '#28a745' : '#444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
            }}
          >
            Join Room
          </button>
        </div>
      </form>

      <div style={{ marginTop: '3rem', color: '#888', fontSize: '0.9rem' }}>
        <p>Create a room or join an existing one by entering its name</p>
      </div>
    </div>
  );
}

export default Home;
