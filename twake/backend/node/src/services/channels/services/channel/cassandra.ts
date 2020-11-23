import cassandra from "cassandra-driver";
import { plainToClass } from "class-transformer";
import { Channel } from "../../entities";
import { ChannelService, ChannelPrimaryKey } from "../../provider";
import {
  CassandraConnectionOptions,
  CassandraPagination,
} from "../../../../core/platform/services/database/services/connectors/cassandra";
import {
  CreateResult,
  DeleteResult,
  ListResult,
  OperationType,
  Pagination,
  SaveResult,
  UpdateResult,
} from "../../../../core/platform/framework/api/crud-service";
import { WorkspaceExecutionContext } from "../../types";
import { pick } from "../../../../utils/pick";

const ENTITY_KEYS = [
  "company_id",
  "workspace_id",
  "id",
  "owner",
  "icon",
  "name",
  "description",
  "channel_group",
  "visibility",
  "is_default",
  "archived",
  "archivation_date",
] as const;

const TYPE = "channel";

export class CassandraChannelService implements ChannelService {
  version = "1";
  private readonly table = `${TYPE}s`;

  constructor(private client: cassandra.Client, private options: CassandraConnectionOptions) {}

  async init(): Promise<this> {
    this.createTable();

    return this;
  }

  async createTable(): Promise<boolean> {
    let result = true;

    try {
      await this.client.execute(
        `CREATE TABLE IF NOT EXISTS ${this.options.keyspace}.${this.table}(company_id uuid, workspace_id uuid, id uuid, archivation_date date, archived boolean, channel_group text, description text, icon text, is_default boolean, name text, owner uuid, visibility text, PRIMARY KEY ((company_id, workspace_id), id));`,
      );
    } catch (err) {
      console.error("Table creation error for channels", err);
      result = false;
    }

    return result;
  }

  async save(channel: Channel, context: WorkspaceExecutionContext): Promise<SaveResult<Channel>> {
    const mode = channel.id ? OperationType.UPDATE : OperationType.CREATE;
    let resultChannel: Channel;

    if (mode === OperationType.CREATE) {
      resultChannel = (await this.create(channel, context)).entity;
    } else if (mode === OperationType.UPDATE) {
      resultChannel = (
        await this.update(
          {
            id: channel.id,
            company_id: channel.company_id,
            workspace_id: channel.workspace_id,
          },
          channel,
        )
      ).entity;
    }

    return new SaveResult<Channel>("channel", resultChannel, mode);
  }

  async update(pk: ChannelPrimaryKey, channel: Channel): Promise<UpdateResult<Channel>> {
    const mergeChannel = { ...channel, ...pk };
    const updatableChannel = pick(mergeChannel, ...ENTITY_KEYS);
    const columnList = ENTITY_KEYS.map(key => `"${key}"`).join(",");
    const columnValues = "?".repeat(ENTITY_KEYS.length).split("").join(",");
    const query = `INSERT INTO ${this.options.keyspace}.${this.table} (${columnList}) VALUES (${columnValues})`;

    await this.client.execute(query, pick(updatableChannel, ...ENTITY_KEYS));

    return new UpdateResult<Channel>(TYPE, updatableChannel);
  }

  async create(
    channel: Channel,
    context: WorkspaceExecutionContext,
  ): Promise<CreateResult<Channel>> {
    channel.id = String(cassandra.types.Uuid.random());
    channel.workspace_id = context.workspace.workspace_id;
    channel.company_id = context.workspace.company_id;
    channel.owner = context.user.id;

    const saveChannel = pick(channel, ...ENTITY_KEYS);
    const columnList = ENTITY_KEYS.map(key => `"${key}"`).join(",");
    const columnValues = "?".repeat(ENTITY_KEYS.length).split("").join(",");
    const query = `INSERT INTO ${this.options.keyspace}.${this.table} (${columnList}) VALUES (${columnValues})`;

    await this.client.execute(query, saveChannel, { prepare: false });

    return new CreateResult<Channel>(TYPE, saveChannel as Channel);
  }

  async get(key: ChannelPrimaryKey): Promise<Channel> {
    const query = `SELECT * FROM ${this.options.keyspace}.${this.table} WHERE id = ? AND company_id = ? AND workspace_id = ?`;
    const row = (await this.client.execute(query, key)).first();

    if (!row) {
      return;
    }

    return this.mapRowToChannel(row);
  }

  async delete(key: ChannelPrimaryKey): Promise<DeleteResult<Channel>> {
    const query = `DELETE FROM ${this.options.keyspace}.${this.table} WHERE id = ? AND company_id = ? AND workspace_id = ?`;
    await this.client.execute(query, key);

    return new DeleteResult<Channel>(TYPE, key as Channel, true);
  }

  async list(
    pagination: Pagination,
    context: WorkspaceExecutionContext,
  ): Promise<ListResult<Channel>> {
    const paginate = CassandraPagination.from(pagination);
    const query = `SELECT * FROM ${this.options.keyspace}.${this.table} WHERE company_id = ? AND workspace_id = ?`;
    const result = await this.client.execute(query, context.workspace, {
      fetchSize: paginate.limit,
      pageState: paginate.page_token,
    });

    if (!result.rowLength) {
      return new ListResult<Channel>(TYPE, []);
    }

    result.nextPage;

    return new ListResult<Channel>(
      TYPE,
      result.rows.map(row => this.mapRowToChannel(row)),
      CassandraPagination.next(paginate, result.pageState),
    );
  }

  mapRowToChannel(row: cassandra.types.Row): Channel {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel: { [column: string]: any } = {};

    (row.keys() || []).forEach(key => (channel[key] = row.get(key)));

    return plainToClass(Channel, channel);
  }
}
