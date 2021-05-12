import { CassandraConnectionOptions } from "..";
import { Client } from "@elastic/elasticsearch";
import { EntityDefinition } from "../../types";
import { getEntityDefinition, unwrapPrimarykey } from "../../utils";
import { Stream } from "stream";
import { logger } from "../../../../../../framework";
import _ from "lodash";

type Operation = {
  index: string;
  id: string;
  action: "remove" | "upsert";
  body?: any;
};

export default class Search {
  private client: Client;
  private buffer = new Stream.Readable();

  constructor(readonly configuration: CassandraConnectionOptions["elasticsearch"]) {}

  public async connect() {
    this.client = new Client({
      node: this.configuration.endpoint,
    });
    this.startBulkReader();
  }

  public async createIndex(entity: EntityDefinition) {
    await this.client.indices.create(
      {
        index: entity.options.search.index || entity.name,
        body: {
          mappings: { ...entity.options.search.mapping, _source: { enabled: false } },
        },
      },
      { ignore: [400] },
    );
  }

  public async upsert(entities: any[]) {
    entities.forEach(entity => {
      const { entityDefinition } = getEntityDefinition(entity);
      const pkColumns = unwrapPrimarykey(entityDefinition);
      const body = {
        ..._.pick(entity, ...pkColumns),
        ...entityDefinition.options.search.source(entity),
      };

      const record: Operation = {
        index: entity.options.search.index || entity.name,
        id: JSON.stringify(pkColumns.map(c => entity[c])),
        action: "upsert",
        body,
      };

      this.buffer.push(record);
    });
  }

  public async remove(entities: any[]) {
    entities.forEach(entity => {
      const { entityDefinition } = getEntityDefinition(entity);
      const pkColumns = unwrapPrimarykey(entityDefinition);

      const record: Operation = {
        index: entity.options.search.index || entity.name,
        id: JSON.stringify(pkColumns.map(c => entity[c])),
        action: "remove",
      };

      this.buffer.push(record);
    });
  }

  private startBulkReader() {
    this.client.helpers.bulk({
      datasource: this.buffer,
      onDocument: (doc: Operation) => {
        logger.info(
          `Operation ${doc.action} pushed to elasticsearch index ${doc.index} (doc.id: ${doc.id})`,
        );
        if (doc.action === "remove") {
          return { delete: { _index: doc.index, _id: doc.id } };
        }
        if (doc.action === "upsert") {
          return [
            { update: { _index: doc.index, _id: doc.id } },
            { doc: doc.body, doc_as_upsert: true },
          ];
        }
      },
      onDrop: res => {
        const doc = res.document;
        logger.error(
          `Operation ${doc.action} was droped while pushing to elasticsearch index ${doc.index} (doc.id: ${doc.id})`,
          res.error,
        );
      },
    });
  }
}
