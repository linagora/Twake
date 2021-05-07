import { TwakeService, ServiceName, logger } from "../../framework";
import {
  PubsubClient,
  PubsubClientManager,
  PubsubListener,
  PubsubMessage,
  PubsubServiceAPI,
  PubsubSubscriptionOptions,
} from "./api";
import { eventBus } from "./bus";
import { Processor } from "./processor";
import PubsubProxy from "./proxy";
import pubsubManager from "./amqp";
import { Subscription } from "rxjs";
import { SkipCLI } from "../../framework/decorators/skip";

const LOG_PREFIX = "service.pubsub -";

@ServiceName("pubsub")
export default class Pubsub extends TwakeService<PubsubServiceAPI> {
  version = "1";
  name = "pubsub";
  service: PubsubService;

  async doInit(): Promise<this> {
    let urls: string[] = this.configuration.get<string[]>("urls", [
      "amqp://guest:guest@localhost:5672",
    ]);

    //For environment variables
    if (typeof urls === "string") {
      urls = (urls as string).split(",");
    }

    this.service = new PubsubService(pubsubManager, urls);
    await this.service.init();

    eventBus.subscribe(message => {
      logger.info(`${LOG_PREFIX} - Event bus publishing message to ${message.topic}`);
      this.service.publish(message.topic, { data: message.data });
    });

    return this;
  }

  async doStart(): Promise<this> {
    await this.service.start();

    return this;
  }

  api(): PubsubServiceAPI {
    return this.service;
  }
}

class PubsubService implements PubsubServiceAPI {
  version: "1";
  processor: Processor;
  clientProxy: PubsubProxy;
  availableSubscription: Subscription;
  unavailableSubscription: Subscription;

  constructor(private manager: PubsubClientManager, private urls: string[]) {
    this.processor = new Processor(this);
    this.clientProxy = new PubsubProxy();
  }

  @SkipCLI()
  async init(): Promise<this> {
    logger.info(`${LOG_PREFIX} Initializing pubsub service implementation with urls %o`, this.urls);
    await this.manager.createClient(this.urls);

    this.availableSubscription = this.manager.getClientAvailable().subscribe({
      next: (client: PubsubClient) => {
        logger.info(`${LOG_PREFIX} A new pubsub client is available`);
        this.clientProxy.setClient(client);
      },
      error: () => {
        logger.error(`${LOG_PREFIX} Error while listening to pubsub client availability`);
      },
    });

    this.unavailableSubscription = this.manager.getClientUnavailable().subscribe({
      next: (err: Error) => {
        logger.warn({ err }, `${LOG_PREFIX} Client is not available anymore`);
        this.clientProxy.unsetClient();
      },
      error: () => {
        logger.error(`${LOG_PREFIX} Error while listening to pubsub client unavailability`);
      },
    });

    return this;
  }

  @SkipCLI()
  async start(): Promise<this> {
    await this.processor.start();

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
