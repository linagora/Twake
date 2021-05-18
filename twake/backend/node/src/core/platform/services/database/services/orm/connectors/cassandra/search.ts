import { CassandraConnectionOptions } from "..";
import { Client } from "@elastic/elasticsearch";
import { EntityDefinition } from "../../types";
import { getEntityDefinition, unwrapPrimarykey } from "../../utils";
import { Readable } from "stream";
import { logger } from "../../../../../../framework";
import _ from "lodash";
import streamToIterator from "stream-to-iterator";

type Operation = {
  index: string;
  id: string;
  action: "remove" | "upsert";
  body?: any;
};

export default class Search {
  private client: Client;
  private buffer: Readable;

  constructor(readonly configuration: CassandraConnectionOptions["elasticsearch"]) {}

  public async connect() {
    this.client = new Client({
      node: this.configuration.endpoint,
    });
    this.startBulkReader();
  }

  public async createIndex(entity: EntityDefinition) {
    if (!entity.options?.search) {
      return;
    }

    const name = entity.options?.search?.index || entity.name;
    const mapping = entity.options?.search?.mapping;
    logger.info(`Create index ${name} with mapping %o`, mapping);
    await this.client.indices.create(
      {
        index: name,
        body: {
          mappings: { ...mapping, _source: { enabled: false } },
        },
      },
      { ignore: [400] },
    );
  }

  public async upsert(entities: any[]) {
    entities.forEach(entity => {
      const { entityDefinition } = getEntityDefinition(entity);
      const pkColumns = unwrapPrimarykey(entityDefinition);

      if (!entityDefinition.options?.search) {
        return;
      }

      if (!entityDefinition.options?.search?.source) {
        logger.info(`Unable to do operation upsert to elasticsearch for doc ${entity}`);
        return;
      }

      const body = {
        ..._.pick(entity, ...pkColumns),
        ...entityDefinition.options.search.source(entity),
      };

      const record: Operation = {
        index: entityDefinition.options?.search?.index || entityDefinition.name,
        id: JSON.stringify(pkColumns.map(c => entity[c])),
        action: "upsert",
        body,
      };

      logger.info(`Add operation upsert to elasticsearch for doc ${record.id}`);

      this.buffer.push(record);
    });
  }

  public async remove(entities: any[]) {
    entities.forEach(entity => {
      const { entityDefinition } = getEntityDefinition(entity);
      const pkColumns = unwrapPrimarykey(entityDefinition);

      if (!entityDefinition.options?.search) {
        return;
      }

      const record: Operation = {
        index: entityDefinition.options?.search?.index || entityDefinition.name,
        id: JSON.stringify(pkColumns.map(c => entity[c])),
        action: "remove",
      };

      logger.info(`Add operation remove from elasticsearch for doc ${record.id}`);

      this.buffer.push(record);
    });
  }

  private flush() {
    this.startBulkReader();
  }

  private startBulkReader() {
    logger.info(`Elasticsearch bulk flushed.`);

    if (this.buffer) this.buffer.push(null);
    this.buffer = new Readable({ objectMode: true, read: () => {} });

    this.client.helpers.bulk({
      flushInterval: this.configuration.flushInterval || 30000,
      datasource: streamToIterator(this.buffer),
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
