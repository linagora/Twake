import { TwakeService, logger, ServiceName, Consumes } from "../../framework";
import {
  DatabaseEntitiesRemovedEvent,
  DatabaseEntitiesSavedEvent,
  DatabaseTableCreatedEvent,
  EntityTarget,
  SearchAdapter,
  SearchConfiguration,
  SearchServiceAPI,
} from "./api";
import ElasticsearchService from "./adapters/elasticsearch";
import MongosearchService from "./adapters/mongosearch";
import { localEventBus } from "../../framework/pubsub";
import { DatabaseServiceAPI } from "../database/api";
import { ListResult, Paginable, Pagination } from "../../framework/api/crud-service";
import { FindFilter, FindOptions, getEntityDefinition } from "./api";

@ServiceName("search")
@Consumes(["database"])
export default class Search extends TwakeService<SearchServiceAPI> {
  version = "1";
  name = "search";
  service: SearchAdapter;
  database: DatabaseServiceAPI;

  constructor() {
    super();
  }

  public async doInit(): Promise<this> {
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

  /** Execute a search over defined search database (mongo or elastic search) */
  public async search<EntityType>(
    table: string,
    entityType: EntityTarget<EntityType>,
    filters: FindFilter,
    options: FindOptions = {},
  ) {
    logger.debug(
      `${this.name} Run search for table ${table} with filter ${JSON.stringify(
        filters,
      )} and options ${JSON.stringify(options)}`,
    );

    const instance = new (entityType as any)();
    const { entityDefinition } = getEntityDefinition(instance);
    const repository = await this.database.getRepository(table, entityType);

    let results: EntityType[] = [];
    let nextPage: Paginable = new Pagination();
    try {
      //1. Get objects primary keys from search connector
      const searchResults = await this.service.search(table, entityType, filters, options);

      //2. Get database original objects from theses primary keys
      for (const searchEntity of searchResults.getEntities()) {
        const sourceEntity = await repository.findOne(searchEntity.primaryKey);
        if (sourceEntity) {
          results.push(sourceEntity);
        } else {
          logger.error(
            `${this.name} Missing source entity for pk ${JSON.stringify(
              searchEntity.primaryKey,
            )} in table ${table}`,
          );
        }
      }
      nextPage = searchResults.nextPage;
    } catch (err) {
      logger.error(`${this.name} An error occurred while searching, returning zero results:`);
      logger.error(err);
    }

    logger.debug(`${this.name} Found ${results.length} results for table ${table}`);

    return new ListResult(entityDefinition.type, results, nextPage);
  }

  api(): SearchServiceAPI {
    return this;
  }
}
