import { ConfirmChannel } from "amqplib";
import { AmqpConnectionManager, connect } from "amqp-connection-manager";
import { logger } from "../../../framework/logger";
import { AmqpPubsubClient } from "./pubsubclient";
import { PubsubMessage, PubsubListener, PubsubLayer } from "../api";

const LOG_PREFIX = "service.pubsub.amqp -";

export class RabbitPubSub implements PubsubLayer {
  version: "1";

  constructor(private client: AmqpPubsubClient) {}

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

  static get(urls: string[]): Promise<PubsubLayer> {
    return createClient(urls).then(client => new RabbitPubSub(client));
  }
}

function createClient(urls: string[]): Promise<AmqpPubsubClient> {
  logger.info(`${LOG_PREFIX} Creating AMQP client ${urls}`);
  const connection = connect(urls);

  connection.on("connect", () => {
    logger.info(`${LOG_PREFIX} Connected to RabbitMQ`);
  });

  // disconnect is called when going from "connected" to "disconnected",
  // and also at every unsuccessfull connection attempt
  connection.on("disconnect", (err: Error) => {
    logger.warn({ err }, `${LOG_PREFIX} RabbitMQ connection lost`);
  });

  return onConnection(connection).catch((err: Error) => {
    logger.error({ err }, `${LOG_PREFIX} Unable to create the AMQP connection`);
    throw err;
  });
}

function onConnection(connection: AmqpConnectionManager): Promise<AmqpPubsubClient> {
  return new Promise(resolve => {
    connection.createChannel({
      name: "AMQP default Twake channel",
      setup: (channel: ConfirmChannel) => {
        const client = new AmqpPubsubClient(channel);

        resolve(client);
      },
    });
  });
}
