import {
  DatabaseEntitiesRemovedEvent,
  DatabaseEntitiesSavedEvent,
  DatabaseTableCreatedEvent,
  EntityDefinition,
} from "../database/services/orm/types";

import { TwakeService, logger, ServiceName, Consumes } from "../../framework";
import { SearchAdapter, SearchConfiguration, SearchServiceAPI } from "./api";
import ElasticsearchService from "./adapters/elasticsearch";
import MongosearchService from "./adapters/mongosearch";
import { localEventBus } from "../../framework/pubsub";
import { DatabaseServiceAPI } from "../database/api";

@ServiceName("search")
@Consumes(["database"])
export default class Search extends TwakeService<SearchServiceAPI> {
  version = "1";
  name = "search";
  service: SearchAdapter;
  database: DatabaseServiceAPI;

  constructor() {
    super();

    const type = this.configuration.get("type") as SearchConfiguration["type"];
    this.database = this.context.getProvider<DatabaseServiceAPI>("database");

    if (type === "elasticsearch") {
      logger.info("Loaded Elasticsearch adapter for search.");
      this.service = new ElasticsearchService(
        this.database,
        this.configuration.get("elasticsearch") as SearchConfiguration["elasticsearch"],
      );
    } else {
      logger.info("Loaded Mongo adapter for search.");
      this.service = new MongosearchService(this.database);
    }
  }

  public async doInit(): Promise<this> {
    this.service.connect();
    return this;
  }

  public async doStart(): Promise<this> {
    //Subscribe to local event bus to get entities to store to es

    localEventBus.subscribe("database:table:saved", (event: DatabaseTableCreatedEvent) => {
      this.service.createIndex(event);
    });

    localEventBus.subscribe("database:entities:saved", (event: DatabaseEntitiesSavedEvent) => {
      this.service.upsert(event.entities);
    });

    localEventBus.subscribe("database:entities:removed", (event: DatabaseEntitiesRemovedEvent) => {
      this.service.remove(event.entities);
    });

    return this;
  }

  api(): SearchServiceAPI {
    return this;
  }
}
