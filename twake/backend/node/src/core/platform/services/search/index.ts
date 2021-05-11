import { TwakeService, logger, ServiceName } from "../../framework";
import { SearchServiceAPI } from "./api";
import SearchService from "./services";
import { SearchType } from "./services";
import { ConnectionOptions } from "./services/connectors";

@ServiceName("search")
export default class Search extends TwakeService<SearchServiceAPI> {
  version = "1";
  name = "search";
  service: SearchService;

  public async doInit(): Promise<this> {
    const driver = this.configuration.get<SearchType>("type");

    if (!driver) {
      throw new Error("Search driver name must be specified in 'search.type' contfiguration");
    }

    const configuration: ConnectionOptions = this.configuration.get<ConnectionOptions>(driver);

    this.service = new SearchService(driver, configuration);
    const searchConnector = this.service.getConnector();

    try {
      logger.info("Connecting to search middleware %s with conf %o", driver, configuration);
      await searchConnector.connect();
      await searchConnector.init();
      logger.info("Connected to %s", driver);
    } catch (err) {
      logger.error("Failed to connect to search", err);
      throw new Error("Failed to connect to search");
    }

    return this;
  }

  api(): SearchServiceAPI {
    return this.service;
  }
}
