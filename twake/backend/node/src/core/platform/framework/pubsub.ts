import { EventEmitter } from "events";
import { TrackerEventActions } from "../../../core/platform/services/tracker/types";

/**
 * Event bus is used by the Pubsub decorators to publish data to be send to pubsub service.
 * The pubsub service is the only subscriber of the event bus.
 * By decoupling decorator and service, events will not be published when the service is not enabled.
 */

class TrackedEventBus extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Subscribe is MUST only be used by the pubsub service
   *
   * @param listener
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe<T>(name: TrackerEventActions, listener: (data: T) => void): this {
    return this.on(name, listener);
  }

  /**
   * Publish must only be used by the Pubsub decorators
   *
   * @param data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publish<T>(name: TrackerEventActions, data: T): boolean {
    return this.emit(name, data);
  }
}

export const trackedEventBus = new TrackedEventBus();
