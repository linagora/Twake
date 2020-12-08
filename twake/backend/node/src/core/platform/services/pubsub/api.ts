import { TwakeServiceProvider } from "../../framework";

export interface PubsubMessage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface IncomingPubsubMessage extends PubsubMessage {
  ack: () => void;
}

export type PubsubListener = (message: IncomingPubsubMessage) => void;

export interface PubsubServiceAPI extends TwakeServiceProvider {
  publish(topic: string, message: PubsubMessage): Promise<void>;
  subscribe(topic: string, listener: PubsubListener): Promise<void>;
}
