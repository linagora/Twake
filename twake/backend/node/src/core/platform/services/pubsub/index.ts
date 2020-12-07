import { TwakeService, logger, ServiceName } from "../../framework";
import { RabbitPubSub } from "./amqp";
import { PubsubServiceAPI } from "./api";

@ServiceName("pubsub")
export default class Pubsub extends TwakeService<PubsubServiceAPI> {
  version = "1";
  name = "pubsub";
  service: PubsubServiceAPI;

  async doInit(): Promise<this> {
    const urls = this.configuration.get<string[]>("urls", ["amqp://guest:guest@localhost:5672"]);

    this.service = await RabbitPubSub.get(urls);
    return this;
  }

  api(): PubsubServiceAPI {
    return this.service;
  }
}
