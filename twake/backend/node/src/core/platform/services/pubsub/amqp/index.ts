import { ConfirmChannel } from "amqplib";
import { AmqpConnectionManager, connect } from "amqp-connection-manager";
import { logger } from "../../../framework/logger";
import { AmqpPubsubClient } from "./pubsubclient";
import { PubsubMessage, PubsubListener, PubsubServiceAPI } from "../api";

export class RabbitPubSub implements PubsubServiceAPI {
  version: "1";

  constructor(private client: AmqpPubsubClient) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async publish(topic: string, message: PubsubMessage<any>): Promise<void> {
    await this.client.publish(topic, message.data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe(topic: string, listener: PubsubListener<any>): Promise<void> {
    return this.client.subscribe(topic, (err, message, originalMessage) => {
      const data = err ? originalMessage : message;

      if (err) {
        logger.error(`Received a message which can not be parsed on topic ${topic}`);
      }

      listener({
        data,
        ack: (): void => {
          this.client.ack(originalMessage);
        },
      });
    });
  }

  static get(urls: string[]): Promise<PubsubServiceAPI> {
    return createClient(urls).then(client => new RabbitPubSub(client));
  }
}

function createClient(urls: string[]): Promise<AmqpPubsubClient> {
  logger.info(`Creating AMQP client ${urls}`);
  const connection = connect(urls);

  connection.on("connect", () => {
    logger.info("Connected to RabbitMQ");
  });

  // disconnect is called when going from "connected" to "disconnected",
  // and also at every unsuccessfull connection attempt
  connection.on("disconnect", (err: Error) => {
    logger.warn({ err }, "RabbitMQ connection lost");
  });

  return onConnection(connection).catch((err: Error) => {
    logger.error({ err }, "Unable to create the AMQP connection");
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
