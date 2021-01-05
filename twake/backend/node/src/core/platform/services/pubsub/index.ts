import { TwakeService, ServiceName, logger } from "../../framework";
import { RabbitPubSub } from "./amqp";
import { PubsubLayer, PubsubListener, PubsubMessage, PubsubServiceAPI } from "./api";
import { eventBus } from "./bus";
import { Processor } from "./processor";

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

    const rabbit = await RabbitPubSub.get(urls);

    this.service = new PubsubService(rabbit);
    await this.service.init();

    eventBus.subscribe(message => {
      logger.info(`service.pubsub - Publishing message to ${message.topic}`);
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
  processor: Processor;
  version: "1";

  constructor(protected layer: PubsubLayer) {
    this.processor = new Processor(this);
  }

  async init(): Promise<this> {
    return this;
  }

  async start(): Promise<this> {
    await this.processor.start();

    return this;
  }

  publish<T>(topic: string, message: PubsubMessage<T>): Promise<void> {
    return this.layer.publish(topic, message);
  }

  subscribe<T>(topic: string, listener: PubsubListener<T>): Promise<void> {
    return this.layer.subscribe(topic, listener);
  }
}
