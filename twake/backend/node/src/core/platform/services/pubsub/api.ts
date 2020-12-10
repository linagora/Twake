import { TwakeServiceProvider } from "../../framework";

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
}

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

export abstract class PubsubServiceSubscription<Service> {
  protected pubsub: PubsubServiceAPI;

  constructor(protected service: Service) {}

  async subscribe(pubsub: PubsubServiceAPI): Promise<void> {
    if (!pubsub) {
      throw new Error("pubsub service it not defined");
    }
    this.pubsub = pubsub;

    return this.doSubscribe();
  }

  abstract doSubscribe(): Promise<void>;
}
