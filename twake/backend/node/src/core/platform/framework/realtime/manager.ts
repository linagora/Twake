import WebSocketAPI from "../../../../services/websocket/provider";
import RealtimeTransport from "./transport";
import { eventBus } from "./bus";

export default class RealtimeManager {
  private transport: RealtimeTransport;

  constructor(private ws: WebSocketAPI) {
    this.transport = new RealtimeTransport(this.ws);
    this.init();
  }

  init(): void {
    this.ws.on("user:connected", (user) => {
      console.log("A new user is connected", user);
    });

    this.ws.on("user:disconnected", (user) => {
      console.log("User is disconnected", user);
    });

    eventBus.on("entity:created", (event) => {
      console.log("ENTITY CREATED", event);
    });

    eventBus.on("entity:updated", (event) => {
      console.log("ENTITY UPDATED", event);
    });

    eventBus.on("entity:deleted", (event) => {
      console.log("ENTITY DELETED", event);
    });
  }

  resourceCreated(): void {
    console.log("Resource created");
  }

  resourceUpdated(): void {
    console.log("Resource updated");
  }

  resourceDeleted(): void {
    console.log("Resource deleted");
  }
}