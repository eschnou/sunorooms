import { useMemo, useRef, memo } from 'react';
import { generateCharacter } from '../../character-generator/src/index.js';
import './DanceFloor.css';

/**
 * DanceFloor component - displays all participant avatars at their positions
 * @param {Array} participants - List of participants from presence
 * @param {boolean} isPlaying - Whether music is currently playing (to trigger dancing animation)
 */
function DanceFloorComponent({ participants, isPlaying = false }) {
  const danceFloorRef = useRef(null);

  // Helper function to add dancing class to SVG string
  const addDancingClass = (svgString, shouldDance) => {
    if (!shouldDance) return svgString;

    // Debug: log SVG structure once
    if (!window.__svgLogged) {
      console.log('[DanceFloor] SVG structure:', svgString.substring(0, 500));
      window.__svgLogged = true;
    }

    // Add 'dancing' class to the character-root element in the SVG
    const modifiedSVG = svgString.replace(
      'class="character-root"',
      'class="character-root dancing"'
    );

    return modifiedSVG;
  };

  // Generate avatars for all participants
  const avatars = useMemo(() => {
    return participants
      .filter(p => p.avatarSeed && p.position)
      .map(participant => {
        try {
          const character = generateCharacter({ seed: participant.avatarSeed });
          return {
            userId: participant.userId,
            nickname: participant.nickname,
            svg: character.svg, // Will be modified with dancing class in render
            position: participant.position,
            isDJ: participant.isDJ,
          };
        } catch (error) {
          console.error('[DanceFloor] Error generating avatar for participant:', participant.userId, error);
          return null;
        }
      })
      .filter(Boolean); // Remove any null entries
  }, [participants]);

  return (
    <div className="dance-floor" ref={danceFloorRef}>
      {avatars.map(avatar => (
        <div
          key={avatar.userId}
          className={`avatar-container ${avatar.isDJ ? 'avatar-dj' : ''}`}
          style={{
            left: `${avatar.position.x}%`,
            top: `${avatar.position.y}%`,
          }}
        >
          <div
            className="avatar-display"
            dangerouslySetInnerHTML={{ __html: addDancingClass(avatar.svg, isPlaying) }}
          />
          <div className="avatar-label">
            {avatar.isDJ && '🎧 '}
            {avatar.nickname}
          </div>
        </div>
      ))}
    </div>
  );
}

// Custom comparison function to prevent unnecessary re-renders
const areEqual = (prevProps, nextProps) => {
  // Only re-render if isPlaying changes or number of participants changes
  if (prevProps.isPlaying !== nextProps.isPlaying) {
    console.log('[DanceFloor] Re-rendering: isPlaying changed');
    return false;
  }

  if (prevProps.participants.length !== nextProps.participants.length) {
    console.log('[DanceFloor] Re-rendering: participant count changed');
    return false;
  }

  // Check if participant IDs changed (someone joined/left)
  const prevIds = prevProps.participants.map(p => p.userId).sort().join(',');
  const nextIds = nextProps.participants.map(p => p.userId).sort().join(',');

  if (prevIds !== nextIds) {
    console.log('[DanceFloor] Re-rendering: participant IDs changed');
    return false;
  }

  // Don't re-render if only presence metadata changed
  console.log('[DanceFloor] Skipping re-render: no significant changes');
  return true;
};

// Memoized component to prevent re-renders on every presence sync
const DanceFloor = memo(DanceFloorComponent, areEqual);

export default DanceFloor;
