import { Subject } from "rxjs";
import { logger as rootLogger } from "../../../framework/logger";
import {
  IncomingPubsubMessage,
  PubsubAdapter,
  PubsubListener,
  PubsubMessage,
  PubsubSubscriptionOptions,
} from "../api";
import PubsubProxy from "../proxy";

const logger = rootLogger.child({
  component: "twake.core.platform.services.pubsub.local",
});

/**
 * A pubsub service implementation based on RXJS.
 */
export class LocalPubsubService implements PubsubAdapter {
  private subjects: Map<string, Subject<IncomingPubsubMessage<unknown>>>;
  private clientProxy: PubsubProxy;
  type: "local";

  constructor() {
    this.subjects = new Map<string, Subject<IncomingPubsubMessage<unknown>>>();
    this.clientProxy = new PubsubProxy();
  }

  async init(): Promise<PubsubAdapter> {
    this.clientProxy.setClient({
      publish: async <T>(topic: string, message: PubsubMessage<T>): Promise<void> => {
        return this.doPublish(topic, message);
      },
      subscribe: async <T>(topic: string, listener: PubsubListener<T>): Promise<void> => {
        return this.doSubscribe(topic, listener);
      },
      async close(): Promise<void> {
        logger.info("Closing the local pubsub");
        return this;
      },
    });

    return this;
  }

  async stop(): Promise<PubsubAdapter> {
    logger.info("Closing pubsub service");
    await this.clientProxy.close();
    return this;
  }

  async subscribe<T>(topic: string, listener: PubsubListener<T>): Promise<void> {
    return this.clientProxy.subscribe(topic, listener);
  }

  async publish<T>(topic: string, message: PubsubMessage<T>): Promise<void> {
    return this.clientProxy.publish(topic, message);
  }

  private async doSubscribe<T>(
    topic: string,
    listener: PubsubListener<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: PubsubSubscriptionOptions,
  ): Promise<void> {
    if (!this.subjects.has(topic)) {
      this.subjects.set(topic, new Subject<IncomingPubsubMessage<T>>());
    }

    this.subjects.get(topic).subscribe({
      next: (value: IncomingPubsubMessage<T>) => {
        logger.debug("Got a new value to dispatch to topic '%s': %o", topic, value);
        try {
          listener(value);
        } catch (err) {
          logger.warn({ err }, "Error while calling listener");
        }
      },
    });
  }

  private async doPublish<T>(topic: string, message: PubsubMessage<T>): Promise<void> {
    if (!this.subjects.has(topic)) {
      return;
    }

    logger.debug("Publish new value to topic '%s': %o", topic, message);
    this.subjects.get(topic)?.next({
      ...message,
      ...{
        ack: () => {
          logger.debug("ACK message %o", message);
        },
      },
    });
  }
}
