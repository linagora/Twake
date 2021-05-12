import { Consumes, ServiceName, TwakeService } from "../../framework";
import { SkipCLI } from "../../framework/decorators/skip";
import { localEventBus } from "../../framework/pubsub";
import WebSocketAPI from "../../services/websocket/provider";
import { RealtimeEventBus, RealtimeServiceAPI, RealtimeRoomManager } from "./api";
import { eventBus } from "./bus";
import RealtimeEntityManager from "./services/entity-manager";
import RoomManagerImpl from "./services/room-manager";
import { RealtimeLocalBusEvent } from "./types";

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

  @SkipCLI()
  async doStart(): Promise<this> {
    const ws = this.context.getProvider<WebSocketAPI>("websocket");

    this.roomManager = new RoomManagerImpl(ws);
    this.roomManager.init();
    this.entityManager = new RealtimeEntityManager(ws);
    this.entityManager.init();

    localEventBus.subscribe("realtime:publish", (data: RealtimeLocalBusEvent<any>) => {
      this.getBus().publish(data.topic, data.event);
    });

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
