import { TwakeService, ServiceName, logger as rootLogger } from "../../framework";
import {
  PubsubAdapter,
  PubsubListener,
  PubsubMessage,
  PubsubServiceAPI,
  PubsubSubscriptionOptions,
} from "./api";
import { eventBus } from "./bus";
import { Processor } from "./processor";
import adapterFactory from "./factory";
import { SkipCLI } from "../../framework/decorators/skip";

const logger = rootLogger.child({
  component: "twake.core.platform.services.pubsub",
});
@ServiceName("pubsub")
export default class Pubsub extends TwakeService<PubsubServiceAPI> {
  version = "1";
  name = "pubsub";
  service: PubsubService;

  async doInit(): Promise<this> {
    this.service = new PubsubService(adapterFactory.create(this.configuration));
    await this.service.init();

    eventBus.subscribe(message => {
      logger.info(`Event bus publishing message to ${message.topic}`);
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

export class PubsubService implements PubsubServiceAPI {
  version: "1";
  processor: Processor;

  constructor(private adapter: PubsubAdapter) {
    this.processor = new Processor(this);
  }

  @SkipCLI()
  async init(): Promise<this> {
    logger.info("Initializing pubsub adapter %o", this.adapter.type);
    await this.adapter?.init?.();

    return this;
  }

  @SkipCLI()
  async start(): Promise<this> {
    logger.info("Starting pubsub adapter %o", this.adapter.type);
    await this.adapter?.start?.();
    await this.processor.start();

    return this;
  }

  publish<T>(topic: string, message: PubsubMessage<T>): Promise<void> {
    return this.adapter.publish(topic, message);
  }

  subscribe<T>(
    topic: string,
    listener: PubsubListener<T>,
    options?: PubsubSubscriptionOptions,
  ): Promise<void> {
    return this.adapter.subscribe(topic, listener, options);
  }
}
