import WebSocketService from "../WebSocket/WebSocketService";
import Logger from "../Logger";

const logger = Logger.getLogger("OnlineUsersRealtimeAPI");

type GetUserRequestType = string;
type GetUsersRequestType = Array<GetUserRequestType>;
type GetUserResponseType = [string, boolean];
type GetUsersResponseType = Array<GetUserResponseType>;

export type OnlineUserRealtimeAPIType = {
  getUserStatus: (id: GetUserRequestType) => Promise<GetUserResponseType>;
  getUsersStatus: (ids: GetUsersRequestType) => Promise<GetUsersResponseType>;
};

export const OnlineUserRealtimeAPI = (websocket: WebSocketService): OnlineUserRealtimeAPIType => {

  const getUserStatus = (id: GetUserRequestType): Promise<GetUserResponseType> => {
    logger.debug(`Get user online status ${id}`);
    return getUsersStatus([id]).then(response => response?.[0] || []);
  };

  const getUsersStatus = (ids: GetUsersRequestType = []): Promise<GetUsersResponseType> => {
    logger.debug(`Get users statuses ${ids.join(',')}`);
    return websocket.get<GetUsersRequestType, GetUsersResponseType>("online:get", ids).then(result => result || []);
  };

  return {
    getUserStatus,
    getUsersStatus,
  };
};
