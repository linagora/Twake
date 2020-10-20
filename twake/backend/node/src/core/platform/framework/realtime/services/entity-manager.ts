import { logger } from "../../logger";
import WebSocketAPI from "../../../../../services/websocket/provider";
import { eventBus } from "../bus";

export default class RealtimeEntityManager {
  constructor(private ws: WebSocketAPI) {}

  init(): void {
    eventBus.subscribe("entity:created", event => {
      logger.debug("Entity has been created");
      this.ws.getIo().to(event.path).emit("resource:created", {
        path: event.path,
        resource: event.entity
      });
    });

    eventBus.subscribe("entity:updated", (event) => {
      logger.debug("Entity has been updated");
      this.ws.getIo().to(event.path).emit("resource:updated", {
        path: event.path,
        resource: event.entity
      });
    });

    eventBus.subscribe("entity:deleted", (event) => {
      logger.debug("Entity has been deleted");
      this.ws.getIo().to(event.path).emit("resource:deleted", {
        path: event.path,
        resource: event.entity
      });
    });
  }
}