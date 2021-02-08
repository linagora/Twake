import { logger } from "../../../framework/logger";
import { AmqpPubsubClient } from "./pubsubclient";
import { PubsubMessage, PubsubListener, PubsubClient } from "../api";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe(topic: string, listener: PubsubListener<any>): Promise<void> {
    logger.debug(`${LOG_PREFIX} Subscribing to topic ${topic}`);
    return this.client.subscribe(topic, (err, message, originalMessage) => {
      const data = err ? originalMessage : message;

      if (err) {
        logger.error(`${LOG_PREFIX} Received a message which can not be parsed on topic ${topic}`);
      }

      listener({
        data,
        ack: (): void => {
          this.client.ack(originalMessage);
        },
      });
    });
  }
}
