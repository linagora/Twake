import { logger } from "../../../framework/logger";
import { constants as CONSTANTS } from "./constants";
import { ConfirmChannel, Replies, Message, Options, ConsumeMessage } from "amqplib";

export type AmqpCallbackType = (
  err: Error,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsedMessage: any,
  originalMessage: ConsumeMessage,
) => void;

// see http://www.squaremobius.net/amqp.node/ for the amqp documentation
export class AmqpClient {
  protected _subscribeCallbackToConsumerTags: Map<AmqpCallbackType, string[]>;

  constructor(protected channel: ConfirmChannel) {
    this._subscribeCallbackToConsumerTags = new Map();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dispose(): Promise<void> {
    logger.info("AMQP: closing the connection");

    return this.channel.close();
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

  send(exchange: string, data: unknown, routingKey = ""): boolean {
    return this.channel.publish(exchange, routingKey, dataAsBuffer(data));
  }

  consume(queue: string, options: Options.Consume, callback: AmqpCallbackType): Promise<void> {
    return this.channel
      .consume(queue, onMessage, options)
      .then(res => this._registerNewConsumerTag(callback, res.consumerTag));

    function onMessage(originalMessage: ConsumeMessage) {
      try {
        const message = JSON.parse(originalMessage.content.toString());
        callback(null, message, originalMessage);
      } catch (err) {
        logger.warn({ err }, "Can not parse the incoming message");
        callback(err, null, originalMessage);
      }
    }
  }

  _registerNewConsumerTag(callback: AmqpCallbackType, consumerTag: string): void {
    const sameCallbackTags = this._subscribeCallbackToConsumerTags.get(callback) || [];

    sameCallbackTags.push(consumerTag);
    this._subscribeCallbackToConsumerTags.set(callback, sameCallbackTags);

    logger.info(`AMQP: A new consumer has been created: ${consumerTag}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dataAsBuffer(data: any): Buffer {
  return Buffer.from(JSON.stringify(data));
}
