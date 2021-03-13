import { ConfirmChannel } from "amqplib";
import { AmqpConnectionManager, connect } from "amqp-connection-manager";
import { ReplaySubject, Subject } from "rxjs";
import { logger } from "../../../framework/logger";
import { AmqpPubsubClient } from "./pubsubclient";
import { PubsubClientManager, PubsubClient } from "../api";
import { AMQPPubSub } from "./pubsub";

const LOG_PREFIX = "service.pubsub.amqp.AMQPPubsubManager -";

export class AMQPPubsubManager implements PubsubClientManager {
  // using ReplaySubjects will allow to get the data which has been published before the subscriptions
  private clientAvailable: Subject<PubsubClient> = new ReplaySubject<PubsubClient>(1);
  private clientUnavailable: Subject<Error> = new ReplaySubject<Error>(1);
  private connected = false;

  getClientAvailable(): Subject<PubsubClient> {
    return this.clientAvailable;
  }

  getClientUnavailable(): Subject<Error> {
    return this.clientUnavailable;
  }

  async createClient(urls: string[]): Promise<Subject<PubsubClient>> {
    logger.info(`${LOG_PREFIX} Creating AMQP client %o`, urls);
    const connection = connect(urls);
    const client = await this.create(connection);
    const pubsub = new AMQPPubSub(client);

    // For the first connection
    this.clientAvailable.next(pubsub);

    // Connect event is not sent on first connection
    // so we have to deal with the `connected` flag
    connection.on("connect", ({ url }) => {
      logger.info(`${LOG_PREFIX} Connected to RabbitMQ on ${url}`);
      if (this.connected) {
        return;
      }
      this.connected = true;
    });

    // disconnect is called when going from "connected" to "disconnected",
    // and also at every unsuccessfull connection attempt
    connection.on("disconnect", (err: Error) => {
      logger.warn({ err }, `${LOG_PREFIX} RabbitMQ connection lost`);
      this.connected = false;
      this.clientUnavailable.next(err);
    });

    return this.clientAvailable;
  }

  private create(connection: AmqpConnectionManager): Promise<AmqpPubsubClient> {
    logger.info(`${LOG_PREFIX} Creating AMQP Channel`);
    const channel = connection.createChannel({ name: "Twake" });

    channel.on("close", () => {
      logger.info(`${LOG_PREFIX} Channel is closed`);
    });

    channel.on("connect", () => {
      logger.info(`${LOG_PREFIX} Channel is connected`);
    });

    channel.on("error", () => {
      logger.info(`${LOG_PREFIX} Channel creation error`);
    });

    return new Promise<AmqpPubsubClient>(resolve => {
      channel.addSetup((channel: ConfirmChannel) => {
        logger.info(`${LOG_PREFIX} Channel setup is complete`);
        const client = new AmqpPubsubClient(channel);

        // First attempt
        if (!this.connected) {
          this.connected = true;
          resolve(client);
        } else {
          this.clientAvailable.next(new AMQPPubSub(client));
        }
      });
    });
  }
}
