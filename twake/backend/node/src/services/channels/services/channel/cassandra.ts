import cassandra from "cassandra-driver";
import { plainToClass } from "class-transformer";
import { Channel } from "../../entities";
import { ChannelService, ChannelPrimaryKey } from "../../provider";
import {
  CassandraConnectionOptions,
  CassandraPagination,
  waitForTable,
} from "../../../../core/platform/services/database/services/orm/connectors/cassandra/cassandra";
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
import { logger } from "../../../../core/platform/framework";
import { DirectChannel } from "../../entities/direct-channel";
import { ChannelListOptions, ChannelSaveOptions } from "../../web/types";

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
  "members",
  "connectors",
] as const;

const TYPE = "channel";

export class CassandraChannelService implements ChannelService {
  version = "1";
  private readonly table = `${TYPE}s`;
  private readonly directChannelsTableName = `direct_${this.table}`;

  constructor(private client: cassandra.Client, private options: CassandraConnectionOptions) {}

  async init(): Promise<this> {
    await Promise.all([this.createChannelTable(), this.createDirectChannelTable()]);

    if (this.options.wait) {
      await waitForTable(
        this.client,
        this.options.keyspace,
        this.table,
        this.options.retries,
        this.options.delay,
      );
      await waitForTable(
        this.client,
        this.options.keyspace,
        this.directChannelsTableName,
        this.options.retries,
        this.options.delay,
      );
    }

    return this;
  }

  protected async createChannelTable(): Promise<boolean> {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.options.keyspace}.${this.table}
        (
          company_id uuid,
          workspace_id text,
          id uuid,
          archivation_date date,
          archived boolean,
          channel_group text,
          description text,
          icon text,
          is_default boolean,
          name text,
          owner uuid,
          visibility text,
          members text,
          connectors text,
          PRIMARY KEY ((company_id, workspace_id), id)
        );`;

    return this.createTable(this.table, query);
  }

  protected async createDirectChannelTable(): Promise<boolean> {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.options.keyspace}.${this.directChannelsTableName}
        (
          company_id uuid,
          channel_id uuid,
          users text,
          PRIMARY KEY ((company_id), users, channel_id)
        );`;

    return this.createTable(this.table, query);
  }

  private async createTable(tableName: string, query: string): Promise<boolean> {
    let result = true;

    try {
      logger.debug(`service.channel.createTable - Creating table ${tableName} : ${query}`);
      await this.client.execute(query);
    } catch (err) {
      logger.warn(
        { err },
        `service.channel.createTable creation error for table ${tableName} : ${err.message}`,
      );
      result = false;
    }

    return result;
  }

  async save(
    channel: Channel,
    options: ChannelSaveOptions,
    context: WorkspaceExecutionContext,
  ): Promise<SaveResult<Channel>> {
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
    const updatableChannel: any = pick(mergeChannel, ...ENTITY_KEYS);
    const columnList = ENTITY_KEYS.map(key => `"${key}"`).join(",");
    const columnValues = "?".repeat(ENTITY_KEYS.length).split("").join(",");
    const query = `INSERT INTO ${this.options.keyspace}.${this.table} (${columnList}) VALUES (${columnValues})`;

    updatableChannel.connectors = JSON.stringify(updatableChannel.connectors);
    updatableChannel.members = JSON.stringify(updatableChannel.members);

    await this.client.execute(query, pick(updatableChannel, ...ENTITY_KEYS), { prepare: true });

    return new UpdateResult<Channel>(TYPE, updatableChannel);
  }

  async create(
    _channel: Channel,
    context: WorkspaceExecutionContext,
  ): Promise<CreateResult<Channel>> {
    const channel: any = { ..._channel };

    channel.id = String(cassandra.types.Uuid.random());
    channel.workspace_id = context.workspace.workspace_id;
    channel.company_id = context.workspace.company_id;
    channel.owner = context.user.id;

    channel.connectors = JSON.stringify(channel.connectors);
    channel.members = JSON.stringify(channel.members);

    const saveChannel = pick(channel, ...ENTITY_KEYS);
    const columnList = ENTITY_KEYS.map(key => `"${key}"`).join(",");
    const columnValues = "?".repeat(ENTITY_KEYS.length).split("").join(",");
    const query = `INSERT INTO ${this.options.keyspace}.${this.table} (${columnList}) VALUES (${columnValues})`;

    logger.info("service.channel.create - %s - %o", query, saveChannel);

    await this.client.execute(query, saveChannel, { prepare: true });

    saveChannel.connectors = _channel.connectors;
    saveChannel.members = _channel.connectors;

    return new CreateResult<Channel>(TYPE, saveChannel as Channel);
  }

  async get(key: ChannelPrimaryKey): Promise<Channel> {
    const query = `SELECT * FROM ${this.options.keyspace}.${this.table} WHERE id = ? AND company_id = ? AND workspace_id = ?`;
    logger.debug("service.channel.get - %s - %o", query, key);
    const row = (await this.client.execute(query, key, { prepare: true })).first();

    if (!row) {
      return;
    }

    return this.mapRowToChannel(row);
  }

  async delete(key: ChannelPrimaryKey): Promise<DeleteResult<Channel>> {
    const query = `DELETE FROM ${this.options.keyspace}.${this.table} WHERE id = ? AND company_id = ? AND workspace_id = ?`;
    await this.client.execute(query, key, { prepare: true });

    return new DeleteResult<Channel>(TYPE, key as Channel, true);
  }

  async list(
    pagination: Pagination,
    options: ChannelListOptions,
    context: WorkspaceExecutionContext,
  ): Promise<ListResult<Channel>> {
    if (options.channels?.length === 0) {
      return new ListResult<Channel>(TYPE, []);
    }
    const inChannels = options.channels?.length ? ` AND id IN (${options.channels.join(",")})` : "";
    const paginate = CassandraPagination.from(pagination);
    const query = `SELECT ${ENTITY_KEYS.join(", ")} FROM ${this.options.keyspace}.${
      this.table
    } WHERE company_id = ? AND workspace_id = ?${inChannels};`;
    const result = await this.client.execute(query, context.workspace, {
      fetchSize: paginate.limit,
      pageState: paginate.page_token,
      prepare: true,
    });

    if (!result.rowLength) {
      return new ListResult<Channel>(TYPE, []);
    }

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

    try {
      channel.connectors = JSON.parse(channel.connectors);
      channel.members = JSON.parse(channel.members);
    } catch (e) {
      channel.connectors = [];
      channel.members = [];
    }

    return plainToClass(Channel, channel);
  }

  mapRowToDirectChannel(row: cassandra.types.Row): DirectChannel {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel: { [column: string]: any } = {};

    (row.keys() || []).forEach(key => (channel[key] = row.get(key)));

    try {
      channel.connectors = JSON.parse(channel.connectors);
      channel.members = JSON.parse(channel.members);
    } catch (e) {
      channel.connectors = [];
      channel.members = [];
    }

    return plainToClass(DirectChannel, channel);
  }

  async createDirectChannel(directChannel: DirectChannel): Promise<DirectChannel> {
    const query = `INSERT INTO ${this.options.keyspace}.${this.directChannelsTableName} (company_id, channel_id, users) VALUES (?, ?, ?)`;

    await this.client.execute(query, directChannel, { prepare: true });

    return directChannel;
  }

  async getDirectChannel(directChannel: DirectChannel): Promise<DirectChannel> {
    const query = `SELECT * FROM ${this.options.keyspace}.${this.directChannelsTableName} WHERE company_id = ? AND channel_id = ? AND users = ?;`;
    const result = await this.client.execute(query, directChannel);

    if (!result.rowLength) {
      return;
    }

    return this.mapRowToDirectChannel(result.rows[0]);
  }

  async getDirectChannelInCompany(
    company_id: string,
    users: string[] = [],
  ): Promise<DirectChannel> {
    const query = `SELECT * FROM ${this.options.keyspace}.${this.directChannelsTableName} WHERE company_id = ? AND users = ?`;

    const result = await this.client.execute(
      query,
      { company_id, users: DirectChannel.getUsersAsString(users) },
      { prepare: true },
    );

    if (!result.rowLength) {
      return;
    }

    return this.mapRowToDirectChannel(result.rows[0]);
  }

  async getDirectChannelsForUsersInCompany(
    companyId: string,
    userId: string,
  ): Promise<DirectChannel[]> {
    const query = `SELECT * FROM ${this.options.keyspace}.${this.directChannelsTableName} WHERE company_id = ${companyId} AND users LIKE '%${userId}%`;

    const result = await this.client.execute(query, {}, { prepare: true });

    if (!result.rowLength) {
      return [];
    }

    return result.rows.map(row => this.mapRowToDirectChannel(row));
  }

  markAsRead(): Promise<boolean> {
    throw new Error("Not implemented");
  }

  markAsUnread(): Promise<boolean> {
    throw new Error("Not implemented");
  }
}
