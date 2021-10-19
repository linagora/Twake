import { Subscription } from "rxjs";
import { logger as rootLogger } from "../../../framework/logger";
import {
  PubsubAdapter,
  PubsubClient,
  PubsubListener,
  PubsubMessage,
  PubsubSubscriptionOptions,
} from "../api";
import PubsubProxy from "../proxy";
import { AMQPPubsubManager } from "./manager";
import { SkipCLI } from "../../../framework/decorators/skip";

const logger = rootLogger.child({
  component: "twake.core.platform.services.pubsub.amqp",
});

export class AMQPPubsubService implements PubsubAdapter {
  version: "1";
  clientProxy: PubsubProxy;
  availableSubscription: Subscription;
  unavailableSubscription: Subscription;
  manager: AMQPPubsubManager;
  type: "amqp";

  constructor(private urls: string[]) {
    this.manager = new AMQPPubsubManager();
    this.clientProxy = new PubsubProxy();
  }

  @SkipCLI()
  async init(): Promise<this> {
    logger.info("Initializing pubsub service implementation with urls %o", this.urls);
    await this.manager.createClient(this.urls);

    this.availableSubscription = this.manager.getClientAvailable().subscribe({
      next: (client: PubsubClient) => {
        logger.info("A new pubsub client is available");
        this.clientProxy.setClient(client);
      },
      error: () => {
        logger.error("Error while listening to pubsub client availability");
      },
    });

    this.unavailableSubscription = this.manager.getClientUnavailable().subscribe({
      next: (err: Error) => {
        logger.warn({ err }, "Client is not available anymore");
        this.clientProxy.unsetClient();
      },
      error: () => {
        logger.error("Error while listening to pubsub client unavailability");
      },
    });

    return this;
  }

  async stop(): Promise<PubsubAdapter> {
    logger.info("Closing pubsub service");
    await this.clientProxy.close();
    return this;
  }

  publish<T>(topic: string, message: PubsubMessage<T>): Promise<void> {
    return this.clientProxy.publish(topic, message);
  }

  subscribe<T>(
    topic: string,
    listener: PubsubListener<T>,
    options?: PubsubSubscriptionOptions,
  ): Promise<void> {
    return this.clientProxy.subscribe(topic, listener, options);
  }
}
