import { Initializable, logger, TwakeServiceProvider } from "../../framework";
import { Processor } from "./processor";

export interface PubsubMessage<T> {
  data: T;
}

export interface PubsubEventMessage<T> extends PubsubMessage<T> {
  topic: string;
}

export interface IncomingPubsubMessage<T> extends PubsubMessage<T> {
  ack: () => void;
}

export type PubsubListener<T> = (message: IncomingPubsubMessage<T>) => void;

export interface PubsubServiceAPI extends TwakeServiceProvider {
  publish<T>(topic: string, message: PubsubMessage<T>): Promise<void>;
  subscribe<T>(topic: string, listener: PubsubListener<T>): Promise<void>;
  processor: Processor;
}

export type PubsubLayer = Pick<PubsubServiceAPI, "publish" | "subscribe" | "version">;

export interface PubsubEventBus {
  /**
   * Subscribes to events
   */
  subscribe<T>(listener: (message: PubsubEventMessage<T>) => void): this;

  /**
   * Publish message in event bus
   */
  publish<T>(message: PubsubEventMessage<T>): boolean;
}

export abstract class PubsubServiceSubscription {
  protected pubsub: PubsubServiceAPI;

  async subscribe(pubsub: PubsubServiceAPI): Promise<void> {
    if (!pubsub) {
      throw new Error("pubsub service it not defined");
    }
    this.pubsub = pubsub;

    return this.doSubscribe();
  }

  abstract doSubscribe(): Promise<void>;
}

export class PubsubServiceProcessor<In, Out>
  extends PubsubServiceSubscription
  implements Initializable {
  constructor(protected handler: PubsubHandler<In, Out>, protected pubsub: PubsubServiceAPI) {
    super();
  }

  async init(): Promise<this> {
    try {
      await this.subscribe(this.pubsub);
    } catch (err) {
      logger.warn({ err }, "Not able to start the PubsubServiceProcessor");
    }

    return this;
  }

  async stop(): Promise<this> {
    // TODO
    return this;
  }

  async process(message: IncomingPubsubMessage<In>): Promise<Out> {
    const result = await this.handler.process(message.data);

    return result;
  }

  async doSubscribe(): Promise<void> {
    await this.pubsub.subscribe(this.handler.topics.in, this.processMessage.bind(this));
  }

  private async processMessage(message: IncomingPubsubMessage<In>): Promise<void> {
    try {
      const result = await this.process(message);

      if (result) {
        await this.doPublish(result);
      }
    } catch (error) {
      if (this.handler.topics.error) {
        this.pubsub.publish(this.handler.topics.error, {
          data: {
            type: "error",
            message: error instanceof Error ? (error as Error).message : String(error),
          },
        });
      }
    }
  }

  private async doPublish(message: Out): Promise<void> {
    if (!this.handler.topics.out) {
      return;
    }

    return this.pubsub.publish(this.handler.topics.out, {
      data: message,
    });
  }
}

/**
 * A pubsub handler is in charge of processing message from a topic and publishing the processing result to another topic
 */
export interface PubsubHandler<InputMessage, OutputMessage> extends Initializable {
  readonly topics: {
    // The topic to subscribe to
    in: string;
    // The topic to push process result to
    out: string;
    // The topic to push error to. When topic is undefined, do not push the error
    error?: string;
  };

  /**
   * The handler name
   */
  readonly name: string;

  /**
   * Process the message and potentially produces result which will be published elsewhere
   * @param message
   */
  process(message: InputMessage): Promise<OutputMessage>;
}
