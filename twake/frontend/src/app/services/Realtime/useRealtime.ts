import { useEffect, useRef, useState } from 'react';
import useWebSocket from 'app/services/WebSocket/hooks/useWebSocket';
import Logger from 'app/services/Logger';
import { RealtimeEventAction } from './types';
import { WebsocketRoom } from '../WebSocket/WebSocket';

const logger = Logger.getLogger('useRealtimeRoom');

export type RealtimeRoomService<T> = {
  lastEvent: T;
  send: (data: T) => void;
  emit: (event: string, data: T) => void;
};

type RealtimeSimpleEvent = { data: any };
type RealtimeResourceEvent<T> = { action: RealtimeEventAction; resource: T };

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
  roomConf: WebsocketRoom,
  tagName: string,
  onEvent: (action: RealtimeEventAction, event: T) => void,
) => {
  const { websocket } = useWebSocket();
  const [lastEvent, setLastEvent] = useState<{ action: RealtimeEventAction; payload: T }>();
  const [room, setRoom] = useState(roomConf);
  const [tag] = useState(tagName);
  // subscribe once
  const subscribed = useRef(false);

  useEffect(() => {
    if (room !== roomConf) {
      setRoom(roomConf);
      if (subscribed.current && websocket) {
        websocket.leave(room.room, tag);
        subscribed.current = false;
      }
    }
  }, [roomConf?.room, roomConf?.token, tagName]);

  useEffect(() => {
    if (room && websocket && !subscribed.current) {
      websocket.join(
        room.room,
        room.token,
        tag,
        (type: string, event: RealtimeResourceEvent<T> | RealtimeSimpleEvent) => {
          logger.debug('Received WebSocket event', type, event);
          if (type === 'realtime:resource') {
            setLastEvent({
              action: (event as RealtimeResourceEvent<T>).action,
              payload: (event as RealtimeResourceEvent<T>).resource,
            });
          } else if (type === 'realtime:event') {
            setLastEvent({ action: 'event', payload: (event as RealtimeSimpleEvent).data });
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
      onEvent(lastEvent.action, lastEvent.payload);
    }
  }, [lastEvent]);

  return {
    lastEvent,
    send: (data: any) => websocket?.send(room.room, room.token, data),
    unsubscribe: () => {
      subscribed.current = false;
      websocket?.leave(room.room, tagName);
    },
  };
};

export { useRealtimeRoom };
