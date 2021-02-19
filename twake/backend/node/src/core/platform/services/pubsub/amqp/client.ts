import { logger } from "../../../framework/logger";
import { constants as CONSTANTS } from "./constants";
import { ConfirmChannel, Replies, Message, Options, ConsumeMessage } from "amqplib";

const LOG_PREFIX = "service.pubsub.amqp.AmqpClient -";

export type AmqpCallbackType = (
  err: Error,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsedMessage: any,
  originalMessage: ConsumeMessage,
) => void;

export type PublishOptions = {
  ttl?: number | null;
};

/**
 * Low level AMQP client using AMQP channel the right way.
 *
 * see http://www.squaremobius.net/amqp.node/ for the amqp documentation
 */
export class AmqpClient {
  protected _subscribeCallbackToConsumerTags: Map<AmqpCallbackType, string[]>;
  protected _connected = false;

  constructor(protected channel: ConfirmChannel) {
    this._subscribeCallbackToConsumerTags = new Map();
  }

  get connected(): boolean {
    return this._connected;
  }

  set connected(value: boolean) {
    this._connected = value;
  }

  async dispose(): Promise<void> {
    logger.info(`${LOG_PREFIX} Closing the connection`);

    try {
      this.channel.close();
    } catch (err) {
      logger.debug({ err }, `${LOG_PREFIX} Can not close the channel (probably already closed)`);
    }
  }

  assertExchange(
    exchange: string,
    type = CONSTANTS.EXCHANGE_TYPES.topic,
  ): Promise<Replies.AssertExchange> {
    return this.channel.assertExchange(exchange, type);
  }

  ack(message: Message, allUpTo = false): void {
    this.channel.ack(message, allUpTo);
  }

  assertQueue(name: string, options: Options.AssertQueue): Promise<Replies.AssertQueue> {
    return this.channel.assertQueue(name, options);
  }

  assertBinding(queue: string, exchange: string, routingPattern?: string): Promise<Replies.Empty> {
    return this.channel.bindQueue(queue, exchange, routingPattern);
  }

  send(exchange: string, data: unknown, routingKey = "", options?: Options.Publish): boolean {
    return this.channel.publish(exchange, routingKey, dataAsBuffer(data), options);
  }

  consume(queue: string, options: Options.Consume, callback: AmqpCallbackType): Promise<void> {
    return this.channel
      .consume(queue, onMessage, options)
      .then(res => this._registerNewConsumerTag(callback, res.consumerTag, queue));

    function onMessage(originalMessage: ConsumeMessage) {
      try {
        const message = JSON.parse(originalMessage.content.toString());
        callback(null, message, originalMessage);
      } catch (err) {
        logger.warn({ err }, `${LOG_PREFIX} Can not parse the incoming message`);
        callback(err, null, originalMessage);
      }
    }
  }

  _registerNewConsumerTag(
    callback: AmqpCallbackType,
    consumerTag: string,
    queueName: string,
  ): void {
    const sameCallbackTags = this._subscribeCallbackToConsumerTags.get(callback) || [];

    sameCallbackTags.push(consumerTag);
    this._subscribeCallbackToConsumerTags.set(callback, sameCallbackTags);

    logger.info(
      `${LOG_PREFIX} A new consumer has been created for queue ${queueName}: ${consumerTag}`,
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dataAsBuffer(data: any): Buffer {
  return Buffer.from(JSON.stringify(data));
}
