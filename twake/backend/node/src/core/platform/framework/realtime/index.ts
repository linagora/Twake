import WebSocketAPI from "../../../../services/websocket/provider";
import { TwakeService } from "../api/service";
import { ServiceName } from "../decorators";
import { RealtimeEventBus, RealtimeServiceAPI, RealtimeRoomManager } from "./api";
import { eventBus } from "./bus";
import RealtimeEntityManager from "./services/entity-manager";
import RoomManagerImpl from "./services/room-manager";

export * from "./types";
export * from "./services/entity-manager";
export * from "./bus";

@ServiceName("realtime")
export class RealtimeService extends TwakeService<RealtimeServiceAPI> implements RealtimeServiceAPI {
  private ws: WebSocketAPI;
  private roomManager: RoomManagerImpl;
  private entityManager: RealtimeEntityManager;
  version = "1";

  api(): RealtimeServiceAPI {
    return this;
  }

  // TODO: This will have to be managed in doStart
  bind(ws: WebSocketAPI): void {
    this.ws = ws;
    this.roomManager = new RoomManagerImpl(this.ws);
    this.roomManager.init();
    this.entityManager = new RealtimeEntityManager(this.ws);
    this.entityManager.init();
  }

  getBus(): RealtimeEventBus {
    return eventBus;
  }

  getRoomManager(): RealtimeRoomManager {
    return this.roomManager;
  }

  getEntityManager(): RealtimeEntityManager {
    return this.entityManager;
  }
}
