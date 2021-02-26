import { EventEmitter } from "events";

/**
 * A local event bus in the platform. Used by platform components and services to communicate using publish subscribe.
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
  }

  subscribe<T>(name: string, listener: (data: T) => void): this {
    return this.on(name, listener);
  }

  publish<T>(name: string, data: T): boolean {
    return this.emit(name, data);
  }
}

export const localEventBus = new EventBus();
