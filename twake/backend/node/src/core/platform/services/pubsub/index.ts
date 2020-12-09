import { TwakeService, ServiceName, logger } from "../../framework";
import { RabbitPubSub } from "./amqp";
import { PubsubServiceAPI } from "./api";
import { eventBus } from "./bus";

@ServiceName("pubsub")
export default class Pubsub extends TwakeService<PubsubServiceAPI> {
  version = "1";
  name = "pubsub";
  service: PubsubServiceAPI;

  async doInit(): Promise<this> {
    const urls = this.configuration.get<string[]>("urls", ["amqp://guest:guest@localhost:5672"]);

    this.service = await RabbitPubSub.get(urls);

    eventBus.subscribe(message => {
      logger.info(`service.pubsub - Publishing message to ${message.topic}`);
      this.service.publish(message.topic, { data: message.data });
    });

    return this;
  }

  api(): PubsubServiceAPI {
    return this.service;
  }
}
