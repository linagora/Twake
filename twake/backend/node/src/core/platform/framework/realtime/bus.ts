/**
 * EventBus is used internally to exchange events between decorators and realtime manager
 */
import { EventEmitter } from "events";

class EventBus extends EventEmitter {
  constructor() {
    super();
  }
}

export const eventBus = new EventBus();
