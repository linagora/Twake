import { TwakeServiceProvider } from "../../framework";

export interface PubsubMessage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface PubsubEventMessage extends PubsubMessage {
  topic: string;
}

export interface IncomingPubsubMessage extends PubsubMessage {
  ack: () => void;
}

export type PubsubListener = (message: IncomingPubsubMessage) => void;

export interface PubsubServiceAPI extends TwakeServiceProvider {
  publish(topic: string, message: PubsubMessage): Promise<void>;
  subscribe(topic: string, listener: PubsubListener): Promise<void>;
}

export interface PubsubEventBus {
  /**
   * Subscribes to events
   */
  subscribe(listener: (message: PubsubEventMessage) => void): this;

  /**
   * Publish message in event bus
   */
  publish(message: PubsubEventMessage): boolean;
}
