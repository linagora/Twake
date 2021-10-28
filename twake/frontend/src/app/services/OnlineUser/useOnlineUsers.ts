import { useCallback, useEffect } from 'react';
import { useRecoilState } from 'recoil';

import Logger from 'app/services/Logger';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import { OnlineUsersState, OnlineUserType } from '../../state/recoil/atoms/OnlineUsers';
import useWebSocket from '../WebSocket/hooks/useWebSocket';
import { OnlineUserRealtimeAPI, ONLINE_ROOM, RealtimeUpdateMessageType } from './OnlineUserRealtimeAPIClient';

const logger = Logger.getLogger('useOnlineUsers');

const INTERVAL = 10000;

export const useOnlineUsers = (): void => {
  logger.trace("Running online hook");
  const { websocket } = useWebSocket();
  const [onlineUsers, setOnlineUsersState] = useRecoilState(OnlineUsersState);

  const updateOnline = useCallback((statuses: Array<[string, boolean]> = []): void => {
    logger.debug(`Update online status for ${statuses.length} users`);
    const lastSeen = Date.now();
    setOnlineUsersState(users => {
      if (!statuses.length) {
        return users;
      }

      const previousStateMap = new Map<string, OnlineUserType>(users.map(u => [u.id!, u]));

      for (const statusTuple of statuses) {
        previousStateMap.set(statusTuple[0], { id: statusTuple[0], connected: statusTuple[1], lastSeen, initialized: true,});
      }

      return [...previousStateMap.entries()].map(entry => ({
        id: entry[0],
        connected: entry[1].connected,
        lastSeen: entry[1].lastSeen,
        initialized: true,
      }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let id: any;
    if (websocket) {
      // got some local users, ask if there are still online
      const api = OnlineUserRealtimeAPI(websocket);
      id = setInterval(async () => {
        const users = onlineUsers.map(u => u.id).filter(<T>(n?: T): n is T => Boolean(n));
        const status = await api.getUsersStatus(users);
        updateOnline(status);
      }, INTERVAL);
    }

    return () => {
      id && clearInterval(id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websocket, onlineUsers]);

  // listen to room events in which online events are pushed
  useRealtimeRoom<RealtimeUpdateMessageType>(ONLINE_ROOM, 'useOnlineUsers', (action, resource) => {
    if (action === 'event' && resource?.length) {
      logger.trace('Updating online users');
      updateOnline(resource);
    } else {
      logger.warn('Received unsupported event', action);
    }
  });
};
