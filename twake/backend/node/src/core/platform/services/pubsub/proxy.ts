import { logger } from "../../framework";
import { PubsubClient, PubsubListener, PubsubMessage, PubsubProxy } from "./api";

const LOG_PREFIX = "service.pubsub.PubsubProxyService -";

/**
 * The pubsub implementation managing underlaying pubsub layer mainly used to cache messages and subscriptions when layer is not ready.
 */
export default class PubsubProxyService implements PubsubProxy {
  version: "1";
  /**
   * Cache messages to be published to topic when layer is not ready
   * TODO: We may explode if we can not publish it accumulating messages, add a FIFO with limited size, or cache eviction system...
   */
  protected publicationsBuffer: Array<{ topic: string; message: PubsubMessage<any> }> = [];
  /**
   * Cache subscriptions to be created until a new client is set
   */
  protected subscriptionsCache: Map<string, Set<PubsubListener<any>>> = new Map<
    string,
    Set<PubsubListener<any>>
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
            await this.subscribe(topic, listener);
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
      this.client?.close();
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

  subscribe<T>(topic: string, listener: PubsubListener<T>): Promise<void> {
    this.addSubscriptionToCache(topic, listener);

    if (!this.client) {
      return;
    }

    return this.subscribeToClient(topic, listener);
  }

  private addSubscriptionToCache(topic: string, listener: PubsubListener<unknown>): void {
    logger.debug(`${LOG_PREFIX} Caching subscription to ${topic} topic`);
    if (!this.subscriptionsCache.get(topic)) {
      this.subscriptionsCache.set(topic, new Set<PubsubListener<unknown>>());
    }

    if (!this.subscriptionsCache.get(topic).has(listener)) {
      this.subscriptionsCache.get(topic).add(listener);
    }
  }

  private addPublishCache(topic: string, message: any): void {
    logger.debug(`${LOG_PREFIX} Caching publication to ${topic} topic`);
    this.publicationsBuffer.push({ topic, message });
  }

  private subscribeToClient(topic: string, listener: PubsubListener<any>): Promise<void> {
    logger.debug(`${LOG_PREFIX} Trying to subscribe to ${topic} topic`);
    return this.client?.subscribe(topic, listener);
  }
}
