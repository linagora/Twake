import WebSocketService from "../WebSocket/WebSocketService";
import Logger from "../Logger";
import { RealtimeEventAction } from "../Realtime/types";

const logger = Logger.getLogger("OnlineUsersRealtimeAPI");

export type GetUserRequestType = string;
export type GetUsersRequestType = Array<GetUserRequestType>;
export type GetUserResponseType = [string, boolean];
export type GetUsersResponseType = Array<GetUserResponseType>;
export type RealtimeUpdateMessageType = GetUsersResponseType;
export type SubscribeReturn = {
  name: string;
  unsubscribe: () => void;
};

export type OnlineUserRealtimeAPIType = {
  getUserStatus: (id: GetUserRequestType) => Promise<GetUserResponseType>;
  getUsersStatus: (ids: GetUsersRequestType) => Promise<GetUsersResponseType>;
  subscribe: (onUpdate: (users: RealtimeUpdateMessageType) => void) => SubscribeReturn;
};

export const ONLINE_ROOM = '/users/online';

export const OnlineUserRealtimeAPI = (websocket: WebSocketService): OnlineUserRealtimeAPIType => {

  const getUserStatus = (id: GetUserRequestType): Promise<GetUserResponseType> => {
    logger.debug(`Get user online status ${id}`);
    return getUsersStatus([id]).then(response => response?.[0] || []);
  };

  const getUsersStatus = (ids: GetUsersRequestType = []): Promise<GetUsersResponseType> => {
    logger.debug(`Get users statuses ${ids.join(',')}`);
    return websocket.get<GetUsersRequestType, GetUsersResponseType>("online:get", ids).then(result => result || []);
  };

  const subscribe = (onUpdate: (users: RealtimeUpdateMessageType) => void): SubscribeReturn => {
    const name = `${ONLINE_ROOM}@OnlineUsersRealtimeAPI`;

    websocket.join(ONLINE_ROOM, name, (type: string, event: { action: RealtimeEventAction, resource: RealtimeUpdateMessageType}) => {
      if (type === 'realtime:resource') {
        if (event.action === 'event') {
          onUpdate(event.resource || []);
        }
      } else if (type === 'realtime:join:success') {
        logger.debug(`Room ${ONLINE_ROOM} has been joined`);
      } else {
        logger.debug('Event type is not supported', type);
      }
    });

    return {
      name,
      unsubscribe: () => websocket.leave(ONLINE_ROOM, name),
    };
  };

  return {
    getUserStatus,
    getUsersStatus,
    subscribe,
  };
};
