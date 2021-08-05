import { TwakeService, logger, ServiceName, Consumes } from "../../framework";
import {
  DatabaseEntitiesRemovedEvent,
  DatabaseEntitiesSavedEvent,
  EntityTarget,
  SearchAdapterInterface,
  SearchConfiguration,
  SearchServiceAPI,
} from "./api";
import ElasticsearchService from "./adapters/elasticsearch";
import MongosearchService from "./adapters/mongosearch";
import { localEventBus } from "../../framework/pubsub";
import { DatabaseServiceAPI } from "../database/api";
import SearchRepository from "./repository";

@ServiceName("search")
@Consumes(["database"])
export default class Search extends TwakeService<SearchServiceAPI> {
  version = "1";
  name = "search";
  service: SearchAdapterInterface;
  database: DatabaseServiceAPI;

  public async doInit(): Promise<this> {
    const type = this.configuration.get("type") as SearchConfiguration["type"];
    this.database = this.context.getProvider<DatabaseServiceAPI>("database");

    if (type === "elasticsearch") {
      logger.info("Loaded Elasticsearch adapter for search.");
      this.service = new ElasticsearchService(
        this.database,
        this.configuration.get("elasticsearch") as SearchConfiguration["elasticsearch"],
      );
    } else if (type === "mongodb") {
      logger.info("Loaded Mongo adapter for search.");
      this.service = new MongosearchService(this.database);
    } else {
      logger.warning("No adapter for search was loaded.");
      this.service = null;
    }

    if (this.service) this.service.connect();
    return this;
  }

  //Subscribe to local event bus to get entities to store to es
  public async doStart(): Promise<this> {
    if (!this.service) return this;

    localEventBus.subscribe("database:entities:saved", (event: DatabaseEntitiesSavedEvent) => {
      this.service.upsert(event.entities);
    });

    localEventBus.subscribe("database:entities:removed", (event: DatabaseEntitiesRemovedEvent) => {
      this.service.remove(event.entities);
    });

    return this;
  }

  public getRepository<EntityType>(table: string, entityType: EntityTarget<EntityType>) {
    return new SearchRepository(this, table, entityType);
  }

  api(): SearchServiceAPI {
    return this;
  }
}
