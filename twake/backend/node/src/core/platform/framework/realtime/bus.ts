/**
 * EventBus is used internally to exchange events between decorators and realtime manager
 */
import { EventEmitter } from "events";
import { RealtimeEntityEvent } from "./types";

class EventBus extends EventEmitter {
  constructor() {
    super();
  }

  subscribe<Entity>(topic: string, listener: (event: RealtimeEntityEvent<Entity>) => void): this {
    return this.on(topic, listener);
  }

  publish<Entity>(topic: string, event: RealtimeEntityEvent<Entity>): boolean {
    return this.emit(topic, event);
  }
}

export const eventBus = new EventBus();
