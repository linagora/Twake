import { isEqual } from "lodash";
import { logger } from "../../framework";
import {
  PubsubClient,
  PubsubListener,
  PubsubMessage,
  PubsubProxy,
  PubsubSubscriptionOptions,
} from "./api";

const LOG_PREFIX = "service.pubsub.PubsubProxyService -";

type ListenerCache = {
  listener: PubsubListener<unknown>;
  options?: PubsubSubscriptionOptions;
};

/**
 * The pubsub implementation managing underlaying pubsub layer mainly used to cache messages and subscriptions when layer is not ready.
 */
export default class PubsubProxyService implements PubsubProxy {
  version: "1";
  /**
   * Cache messages to be published to topic when layer is not ready
   * TODO: We may explode if we can not publish it accumulating messages, add a FIFO with limited size, or cache eviction system...
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected publicationsBuffer: Array<{ topic: string; message: PubsubMessage<any> }> = [];
  /**
   * Cache subscriptions to be created until a new client is set
   */
  protected subscriptionsCache: Map<string, Set<ListenerCache>> = new Map<
    string,
    Set<ListenerCache>
  >();

  /**
   * @param client optional initial client
   */
  constructor(private client?: PubsubClient) {}

  async setClient(client: PubsubClient): Promise<void> {
    logger.info(`${LOG_PREFIX} Setting new pubsub client`);
    // TODO: The client can be removed or replaced while we are looping here
    // We may wait until things are done, or discard some...
    if (!client) {
      return;
    }

    if (this.client) {
      logger.info(`${LOG_PREFIX} Pubsub client already set. Overriding`);
    }

    this.client = client;

    await Promise.all(
      Array.from(this.subscriptionsCache).map(entries => {
        const topic = entries[0];
        const listeners = entries[1];

        return Array.from(listeners).map(async listener => {
          logger.debug(`${LOG_PREFIX} Subscribing to topic ${topic} from cache`);
          try {
            await this.subscribe(topic, listener.listener, listener.options);
          } catch (err) {
            logger.warn(
              { err },
              `${LOG_PREFIX} Error while subscribing with cached subscription to topic ${topic}`,
            );
          }
        });
      }),
    );

    await Promise.all(
      this.publicationsBuffer.map(async publication => {
        try {
          logger.debug(`${LOG_PREFIX} Publishing to topic ${publication.topic} from cache`);
          await this.publish(publication.topic, publication.message);
        } catch (err) {
          logger.warn(
            { err },
            `${LOG_PREFIX} Error while publishing cached data on topic ${publication.topic}`,
          );
        }
      }),
    );

    this.publicationsBuffer = [];
  }

  async unsetClient(): Promise<void> {
    await this.close();
    this.client = undefined;
  }

  /**
   * Close never fails
   */
  async close(): Promise<void> {
    try {
      await this.client?.close?.();
    } catch (err) {
      logger.debug({ err }, `${LOG_PREFIX} Error on closing the pubsub layer`);
    }
  }

  publish<T>(topic: string, message: PubsubMessage<T>): Promise<void> {
    if (!this.client) {
      this.addPublishCache(topic, message);

      return;
    }

    return this.client.publish(topic, message);
  }

  subscribe<T>(
    topic: string,
    listener: PubsubListener<T>,
    options?: PubsubSubscriptionOptions,
  ): Promise<void> {
    this.addSubscriptionToCache(topic, listener, options);

    if (!this.client) {
      return;
    }

    return this.subscribeToClient(topic, listener, options);
  }

  private addSubscriptionToCache(
    topic: string,
    listener: PubsubListener<unknown>,
    options: PubsubSubscriptionOptions,
  ): void {
    if (!this.subscriptionsCache.get(topic)) {
      this.subscriptionsCache.set(topic, new Set<ListenerCache>());
    }

    const subscriptions = this.subscriptionsCache.get(topic);
    logger.debug(`${LOG_PREFIX} Subscriptions for topic ${topic}: ${subscriptions.size}`);

    const values = [...subscriptions];
    const cachedListener = values.find(
      entry => listener === entry.listener && isEqual(options, entry.options),
    );

    if (!cachedListener) {
      logger.debug(`${LOG_PREFIX} Caching subscription to ${topic} topic: Yes`);
      this.subscriptionsCache.get(topic).add({ listener, options });
    } else {
      logger.debug(`${LOG_PREFIX} Caching subscription to ${topic} topic: No`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private addPublishCache(topic: string, message: any): void {
    logger.debug(`${LOG_PREFIX} Caching publication to ${topic} topic`);
    this.publicationsBuffer.push({ topic, message });
  }

  private subscribeToClient(
    topic: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: PubsubListener<any>,
    options?: PubsubSubscriptionOptions,
  ): Promise<void> {
    logger.debug(`${LOG_PREFIX} Trying to subscribe to ${topic} topic with options %o`, options);
    return this.client?.subscribe(topic, listener, options);
  }
}
