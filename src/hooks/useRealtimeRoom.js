import { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { getUserId, generateNickname } from '../utils/userUtils';

/**
 * Hook to manage Supabase Realtime room connection and presence
 * @param {string} slug - Room slug identifier
 * @param {boolean} isDJ - Whether the current user is the DJ
 */
export function useRealtimeRoom(slug, isDJ = false) {
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef(null);
  const userId = getUserId();
  const nickname = generateNickname();

  useEffect(() => {
    if (!slug) return;

    console.log(`[useRealtimeRoom] Connecting to room: ${slug}, isDJ: ${isDJ}`);

    // Create channel
    const channel = supabase.channel(slug, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    // Listen for presence sync (full state)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('[Presence] Sync:', state);

      // Convert presence state to participants array
      const participantsList = [];
      Object.keys(state).forEach((key) => {
        state[key].forEach((presence) => {
          participantsList.push({
            userId: key,
            nickname: presence.nickname,
            isDJ: presence.isDJ,
            joinedAt: presence.joinedAt,
          });
        });
      });

      setParticipants(participantsList);
    });

    // Listen for presence join
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('[Presence] User joined:', key, newPresences);
    });

    // Listen for presence leave
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('[Presence] User left:', key, leftPresences);
    });

    // Subscribe to the channel
    channel.subscribe(async (status) => {
      console.log('[Channel] Subscription status:', status);

      if (status === 'SUBSCRIBED') {
        setIsConnected(true);

        // Track our presence
        const presenceData = {
          nickname,
          isDJ,
          joinedAt: Date.now(),
        };

        console.log('[Presence] Tracking:', presenceData);
        await channel.track(presenceData);
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('[useRealtimeRoom] Cleaning up channel:', slug);
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [slug, isDJ, userId, nickname]);

  /**
   * Send a broadcast event to all clients in the room
   */
  const sendBroadcast = (event, payload) => {
    if (!channelRef.current) {
      console.error('[sendBroadcast] Channel not initialized');
      return;
    }

    console.log(`[Broadcast] Sending event: ${event}`, payload);
    channelRef.current.send({
      type: 'broadcast',
      event,
      payload,
    });
  };

  /**
   * Subscribe to a broadcast event
   */
  const onBroadcast = (event, callback) => {
    if (!channelRef.current) {
      console.error('[onBroadcast] Channel not initialized');
      return;
    }

    channelRef.current.on('broadcast', { event }, callback);
  };

  return {
    channel: channelRef.current,
    participants,
    isConnected,
    sendBroadcast,
    onBroadcast,
    currentUser: {
      userId,
      nickname,
      isDJ,
    },
  };
}
