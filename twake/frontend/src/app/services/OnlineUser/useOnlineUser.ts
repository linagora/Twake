import { useEffect } from "react";
import { useRecoilCallback, useRecoilValue } from "recoil";

import { OnlineUserStateFamily, OnlineUserType } from "app/state/recoil/atoms/OnlineUsers";
import { OnlineUserRealtimeAPI } from "./OnlineUserRealtimeAPIClient";
import WebSocketFactory from "../WebSocket/WebSocketFactory";
import Logger from "app/services/Logger";

const logger = Logger.getLogger("useOnlineUser");
const OnlineAPI = OnlineUserRealtimeAPI(WebSocketFactory.get());

export const useOnlineUser = (id: string): OnlineUserType => {
  const updateUser = useRecoilCallback(({ set }) => ((status: {id: string, connected: boolean}) => {
    logger.debug(`Update status for user ${id}`);
    set(OnlineUserStateFamily(status.id), {...status, lastSeen: Date.now(), initialized: true,});
  }), []);

  const state = useRecoilValue(OnlineUserStateFamily(id));

  useEffect(() => {
    if (state && !state.initialized) {
      OnlineAPI.getUserStatus(id).then(status => {
        updateUser({ id: status[0], connected: status[1] });
      });
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, id]);

  return state;
};
