import { Subject } from "rxjs";
import { logger as rootLogger } from "./logger";

const logger = rootLogger.child(
  {
    component: "twake.core.platform.framework.pubsub"
  }
)

/**
 * A local event bus in the platform. Used by platform components and services to communicate using publish subscribe.
 */
class EventBus {
  private subjects: Map<string, Subject<any>>;
  constructor() {
    this.subjects = new Map<string, Subject<any>>();
  }

  subscribe<T>(name: string, listener: (data: T) => void): this {
    if (!this.subjects.has(name)) {
      this.subjects.set(name, new Subject<T>());
    }

    this.subjects.get(name).subscribe({
      next: (value: T) => {
        logger.trace("Got a new value to dispatch to topic '%s': %o", name, value);
        try {
          listener(value);
        } catch (err) {
          logger.warn({ err }, "Error while calling listener");
        }
      }
    });

    return this;
  }

  publish<T>(name: string, data: T): boolean {
    if (!this.subjects.has(name)) {
      return false;
    }

    logger.trace("Publish new value to topic '%s': %o", name, data);
    this.subjects.get(name)?.next(data);

    return true;
  }
}

export const localEventBus = new EventBus();
