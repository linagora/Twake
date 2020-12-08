import { TwakeService, logger, ServiceName } from "../../framework";
import { RabbitPubSub } from "./amqp";
import { PubsubServiceAPI } from "./api";

@ServiceName("pubsub")
export default class Pubsub extends TwakeService<PubsubServiceAPI> {
  version = "1";
  name = "pubsub";
  service: PubsubServiceAPI;

  async doInit(): Promise<this> {
    let urls: string[] = this.configuration.get<string[]>("urls", [
      "amqp://guest:guest@localhost:5672",
    ]);

    //For environment variables
    if (typeof urls === "string") {
      urls = (urls as string).split(",");
    }

    this.service = await RabbitPubSub.get(urls);
    return this;
  }

  api(): PubsubServiceAPI {
    return this.service;
  }
}
