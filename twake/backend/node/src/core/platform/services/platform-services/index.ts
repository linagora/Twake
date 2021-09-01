import {
  Consumes,
  Initializable,
  ServiceName,
  TwakeService,
  TwakeServiceProvider,
} from "../../framework";
import WebServerAPI from "../webserver/provider";
import { DatabaseServiceAPI } from "../database/api";
import { SearchServiceAPI } from "../search/api";
import { ConsoleServiceAPI } from "../../../../services/console/api";
import { PubsubServiceAPI } from "../pubsub/api";
import StorageService from "../storage";
import StorageAPI from "../storage/provider";
import { CounterAPI } from "../counter/types";

export interface PlatformServicesAPI extends TwakeServiceProvider, Initializable {
  fastify: WebServerAPI;
  database: DatabaseServiceAPI;
  search: SearchServiceAPI;
  storage: StorageAPI;
  pubsub: PubsubServiceAPI;
  counter: CounterAPI;
}

@ServiceName("platform-services")
@Consumes(["webserver", "database", "search", "storage", "pubsub", "counter"])
export default class PlatformService extends TwakeService<PlatformServicesAPI> {
  version = "1";
  name = "platform-services";

  public fastify: WebServerAPI;
  public database: DatabaseServiceAPI;
  public search: SearchServiceAPI;
  public storage: StorageAPI;
  public pubsub: PubsubServiceAPI;
  public counter: CounterAPI;

  public async doInit(): Promise<this> {
    this.fastify = this.context.getProvider<WebServerAPI>("webserver");
    this.database = this.context.getProvider<DatabaseServiceAPI>("database");
    this.search = this.context.getProvider<SearchServiceAPI>("search");
    this.storage = this.context.getProvider<StorageAPI>("storage");
    this.pubsub = this.context.getProvider<PubsubServiceAPI>("pubsub");
    this.counter = this.context.getProvider<CounterAPI>("counter");
    return this;
  }

  api(): PlatformServicesAPI {
    return this;
  }
}
