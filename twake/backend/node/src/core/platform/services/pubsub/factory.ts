import { PubsubAdapter, PubsubType } from "./api";
import { AMQPPubsubService } from "./amqp";
import { LocalPubsubService } from "./local";
import { TwakeServiceConfiguration, logger as rootLogger } from "../../framework";

const logger = rootLogger.child({
  component: "twake.core.platform.services.pubsub.factory",
});

const DEFAULT_AMQP_URL = "amqp://guest:guest@localhost:5672";
const DEFAULT_ADAPTER = "amqp";

export class PubsubAdapterFactory {
  public create(configuration: TwakeServiceConfiguration): PubsubAdapter {
    const type: PubsubType = configuration.get<PubsubType>("type", DEFAULT_ADAPTER);

    logger.info("Building Adapter %o", type);

    switch (type) {
      case "local":
        return new LocalPubsubService();
      case "amqp":
        let urls: string[] = configuration.get<string[]>("urls", [DEFAULT_AMQP_URL]);

        //For environment variables
        if (typeof urls === "string") {
          urls = (urls as string).split(",");
        }

        return new AMQPPubsubService(urls);
      default:
        logger.error("Adapter '%o' is not supported", type);
        throw new Error(`${type} is not supported`);
    }
  }
}

export default new PubsubAdapterFactory();
