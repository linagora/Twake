import { EventEmitter } from "events";
import { PubsubEventBus, PubsubEventMessage } from "./api";
const EVENT = Symbol("event");

/**
 * Event bus is used by the Pubsub decorators to publish data to be send to pubsub service.
 * The pubsub service is the only subscriber of the event bus.
 * By decoupling decorator and service, events will not be published when the service is not enabled.
 */
class EventBus extends EventEmitter implements PubsubEventBus {
  constructor() {
    super();
  }

  /**
   * Subscribe is MUST only be used by the pubsub service
   *
   * @param listener
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe(listener: (message: PubsubEventMessage<any>) => void): this {
    return this.on(EVENT, listener);
  }

  /**
   * Publish must only be used by the Pubsub decorators
   *
   * @param message
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publish(message: PubsubEventMessage<any>): boolean {
    return this.emit(EVENT, message);
  }
}

export const eventBus = new EventBus();
