import { useEffect, useState } from 'react';
import useWebSocket from 'app/services/WebSocket/hooks/useWebSocket';
import Logger from 'app/services/Logger';
import { Maybe } from 'app/types';
import { RealtimeEventAction } from './types';

const logger = Logger.getLogger('useRealtimeRoom');

export type RealtimeRoomService<T> = {
  lastEvent: T;
  send: (data: T) => void;
  emit: (event: string, data: T) => void;
};

const useRealtimeRoom = <T>(roomName: Maybe<string>, tag: string, onEvent: (action: RealtimeEventAction, event: T) => void) => {
  const { websocket } = useWebSocket();
  const [lastEvent, setLastEvent] = useState<{ action: string; resource: T }>();

  useEffect(() => {
    // TODO: Do not subscribe/unsubscribe everytime
    if (roomName && websocket) {
      websocket.join(roomName, tag, (type: string, event: { action: RealtimeEventAction, resource: T }) => {
        logger.debug('Received WebSocket event', type, event);
        if (type === 'realtime:resource') {
          setLastEvent(event);
          onEvent(event.action, event.resource);
        } else if (type === 'realtime:join:success') {
          logger.debug(`Room ${roomName} has been joined`);
        } else {
          logger.debug('Event type is not supported', type);
        }
      });
    }

    return () => {
      logger.debug(`Destroy for room ${roomName}`);
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websocket, tag, roomName]);

  return {
    lastEvent,
    send: (data: any) => websocket?.getSocket()?.send(data),
  };
};

export {
  useRealtimeRoom,
};