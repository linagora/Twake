import { useEffect, useRef, useState } from 'react';
import useWebSocket from 'app/services/WebSocket/hooks/useWebSocket';
import Logger from 'app/services/Logger';
import { RealtimeEventAction } from './types';

const logger = Logger.getLogger('useRealtimeRoom');

export type RealtimeRoomService<T> = {
  lastEvent: T;
  send: (data: T) => void;
  emit: (event: string, data: T) => void;
};

/**
 * Subscribe to a room using websocket channel.
 *
 * Note: It will subscribe only once, even if the component using it re renders. If you need to unsubscribe and subscribe again, call unsubscribe on the returned object.
 *
 * @param roomName
 * @param tagName
 * @param onEvent
 * @returns
 */
const useRealtimeRoom = <T>(
  roomName: string,
  tagName: string,
  onEvent: (action: RealtimeEventAction, event: T) => void,
) => {
  const { websocket } = useWebSocket();
  const [lastEvent, setLastEvent] = useState<{ action: RealtimeEventAction; resource: T }>();
  const [room] = useState(roomName);
  const [tag] = useState(tagName);
  // subscribe once
  const subscribed = useRef(false);

  useEffect(() => {
    if (room && websocket && !subscribed.current) {
      websocket.join(
        room,
        tag,
        (type: string, event: { action: RealtimeEventAction; resource: T }) => {
          logger.debug('Received WebSocket event', type, event);
          if (type === 'realtime:resource') {
            setLastEvent(event);
          } else if (type === 'realtime:join:success') {
            logger.debug(`Room ${room} has been joined`);
          } else {
            logger.debug('Event type is not supported', type);
          }
        },
      );
      subscribed.current = true;
    }
  }, [websocket, tag, room, onEvent]);

  useEffect(() => {
    if (lastEvent) {
      onEvent(lastEvent.action, lastEvent.resource);
    }
  }, [lastEvent]);

  return {
    lastEvent,
    send: (data: any) => websocket?.send(room, data),
    unsubscribe: () => {
      subscribed.current = false;
      websocket?.leave(roomName, tagName);
    },
  };
};

export { useRealtimeRoom };
