import { logger } from "../../../framework/logger";
import { RealtimeEntityActionType, RealtimeEntityEvent } from "../types";
import WebSocketAPI from "../../../services/websocket/provider";
import { eventBus } from "../bus";

export default class RealtimeEntityManager {
  constructor(private ws: WebSocketAPI) { }

  init(): void {
    eventBus.subscribe(RealtimeEntityActionType.Saved, event => {
      this.pushResourceEvent(event, RealtimeEntityActionType.Saved);
    });

    eventBus.subscribe(RealtimeEntityActionType.Deleted, event => {
      this.pushResourceEvent(event, RealtimeEntityActionType.Deleted);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pushResourceEvent(event: RealtimeEntityEvent<any>, action: RealtimeEntityActionType): boolean {
    logger.info(`Pushing ${action} entity to room ${event.path}`);

    return this.ws.getIo().to(event.path).emit("realtime:resource", {
      action,
      room: event.path,
      type: event.type,
      path: event.resourcePath,
      resource: event.entity
    });
  }
}