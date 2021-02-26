import { Consumes, ServiceName, TwakeService } from "../../framework";
import WebSocketAPI from "../../services/websocket/provider";
import { RealtimeEventBus, RealtimeServiceAPI, RealtimeRoomManager } from "./api";
import { eventBus } from "./bus";
import RealtimeEntityManager from "./services/entity-manager";
import RoomManagerImpl from "./services/room-manager";

@Consumes(["websocket"])
@ServiceName("realtime")
export default class RealtimeService
  extends TwakeService<RealtimeServiceAPI>
  implements RealtimeServiceAPI {
  private roomManager: RoomManagerImpl;
  private entityManager: RealtimeEntityManager;
  version = "1";

  api(): RealtimeServiceAPI {
    return this;
  }

  async doStart(): Promise<this> {
    const ws = this.context.getProvider<WebSocketAPI>("websocket");

    this.roomManager = new RoomManagerImpl(ws);
    this.roomManager.init();
    this.entityManager = new RealtimeEntityManager(ws);
    this.entityManager.init();

    return this;
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
