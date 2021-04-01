import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";

export function getService(databaseService: DatabaseServiceAPI, pubsub: PubsubServiceAPI): Service {
  return getServiceInstance(databaseService, pubsub);
}

function getServiceInstance(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
): Service {
  return new Service(databaseService, pubsub);
}

class Service {
  version: "1";

  constructor(databaseService: DatabaseServiceAPI, pubsub: PubsubServiceAPI) {}

  async init(context: TwakeContext): Promise<this> {
    return this;
  }
}
