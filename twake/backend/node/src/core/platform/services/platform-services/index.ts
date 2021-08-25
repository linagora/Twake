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

export interface PlatformServicesAPI extends TwakeServiceProvider, Initializable {
  fastify: WebServerAPI;
  database: DatabaseServiceAPI;
  search: SearchServiceAPI;
  console: ConsoleServiceAPI;
}

@ServiceName("platform-services")
@Consumes(["webserver", "database", "search"])
export default class PlatformService extends TwakeService<PlatformServicesAPI> {
  version = "1";
  name = "platform-services";

  public fastify: WebServerAPI;
  public database: DatabaseServiceAPI;
  public search: SearchServiceAPI;
  public console: ConsoleServiceAPI;

  public async doInit(): Promise<this> {
    this.fastify = this.context.getProvider<WebServerAPI>("webserver");
    this.database = this.context.getProvider<DatabaseServiceAPI>("database");
    this.search = this.context.getProvider<SearchServiceAPI>("search");
    this.console = this.context.getProvider<ConsoleServiceAPI>("console");
    return this;
  }

  api(): PlatformServicesAPI {
    return this;
  }
}
