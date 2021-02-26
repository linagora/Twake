import { logger } from "../../../framework/logger";
import { AmqpPubsubClient } from "./pubsubclient";
import { PubsubMessage, PubsubListener, PubsubClient, PubsubSubscriptionOptions } from "../api";
import { AmqpCallbackType } from "./client";

const LOG_PREFIX = "service.pubsub.amqp.AMQPPubSub -";

/**
 * Implementation of PubsubClient based on AMQP
 */
export class AMQPPubSub implements PubsubClient {
  constructor(private client: AmqpPubsubClient) {}

  close(): Promise<void> {
    return this.client.dispose();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async publish(topic: string, message: PubsubMessage<any>): Promise<void> {
    logger.debug(`${LOG_PREFIX} Publishing message to topic ${topic}`);
    await this.client.publish(topic, message.data);
  }

  subscribe(
    topic: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: PubsubListener<any>,
    options: PubsubSubscriptionOptions = { unique: false, queue: null },
  ): Promise<void> {
    logger.debug(`${LOG_PREFIX} Subscribing to topic ${topic} with options %o`, options);

    const callback: AmqpCallbackType = (err, message, originalMessage) => {
      const data = err ? originalMessage : message;

      if (err) {
        logger.error(`${LOG_PREFIX} Received a message which can not be parsed on topic ${topic}: %o`, originalMessage?.content.toString());
      }

      listener({
        data,
        ack: (): void => {
          logger.debug(`${LOG_PREFIX} Ack message on topic ${topic}`);
          this.client.ack(originalMessage);
        },
      });
    };

    return options?.unique
      ? this.client.subscribeToDurableQueue(topic, options?.queue || topic, callback)
      : this.client.subscribe(topic, callback);
  }
}
