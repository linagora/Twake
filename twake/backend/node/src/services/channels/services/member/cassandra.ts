import cassandra from "cassandra-driver";
import { pick } from "../../../../utils/pick";
import {
  CreateResult,
  UpdateResult,
  DeleteResult,
  Paginable,
  ListResult,
  SaveResult,
  OperationType,
} from "../../../../core/platform/framework/api/crud-service";
import {
  CassandraConnectionOptions,
  CassandraPagination,
  waitForTable,
} from "../../../../core/platform/services/database/services/orm/connectors";
import { ChannelMember, ChannelMemberPrimaryKey } from "../../entities";
import { MemberService } from "../../provider";
import { ChannelExecutionContext, WorkspaceExecutionContext } from "../../types";
import { plainToClass } from "class-transformer";
import { logger } from "../../../../core/platform/framework";
import { Channel, User } from "../../../../services/types";
import { ChannelListOptions, ChannelMemberSaveOptions } from "../../web/types";

const TYPE = "channel_member";
const USER_CHANNEL_KEYS = [
  "company_id",
  "workspace_id",
  "user_id",
  "channel_id",
  "type",
  "last_access",
  "last_increment",
  "favorite",
  "notification_level",
  "expiration",
] as const;
const CHANNEL_MEMBERS_KEYS = [
  "company_id",
  "workspace_id",
  "user_id",
  "channel_id",
  "type",
] as const;

// TODO: Generate it from primary key
const WHERE_COMPANY_WORKSPACE = "company_id = ? AND workspace_id = ?";
const WHERE_CHANNEL = `${WHERE_COMPANY_WORKSPACE} AND channel_id = ?`;
const WHERE = `${WHERE_CHANNEL} AND user_id = ?`;

export class CassandraMemberService implements MemberService {
  version: "1";
  readonly userChannelsTableName = "user_channels";
  readonly channelMembersTableName = "channel_members";

  constructor(private client: cassandra.Client, private options: CassandraConnectionOptions) {}

  async init(): Promise<this> {
    // TODO: Await for the table to be created with some RXJS magic
    await this.createTables();

    return this;
  }

  async createTables(): Promise<boolean> {
    let result = true;

    try {
      await Promise.all([this.createUserChannelsTable(), this.createChannelMembersTable()]);
    } catch (err) {
      result = false;
    }

    if (this.options.wait) {
      await waitForTable(
        this.client,
        this.options.keyspace,
        this.channelMembersTableName,
        this.options.retries,
        this.options.delay,
      );
      await waitForTable(
        this.client,
        this.options.keyspace,
        this.userChannelsTableName,
        this.options.retries,
        this.options.delay,
      );
    }

    return result;
  }

  /**
   * Store the user settings per channel.
   * Partition key is (company_id, workspace_id, user_id) to allow to retrieve all the channels for a given user (omitting channel_id in the WHERE clause)
   */
  private async createUserChannelsTable(): Promise<boolean> {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.options.keyspace}.${this.userChannelsTableName}
        (
          company_id uuid,
          workspace_id text,
          user_id uuid,
          channel_id uuid,
          type text,
          last_access bigint,
          last_increment bigint,
          favorite boolean,
          notification_level text,
          expiration bigint,
          PRIMARY KEY ((company_id, workspace_id), user_id, channel_id)
        );`;

    return this.createTable(this.userChannelsTableName, query);
  }

  /**
   * Store all the members of a channel.
   * Partition key is (company_id, workspace_id) to allow to get all users in a given channel.
   */
  private async createChannelMembersTable(): Promise<boolean> {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.options.keyspace}.${this.channelMembersTableName}
        (
          company_id uuid,
          workspace_id text,
          channel_id uuid,
          user_id uuid,
          type text,
          PRIMARY KEY ((company_id, workspace_id), channel_id, user_id)
        );`;

    return this.createTable(this.channelMembersTableName, query);
  }

  private async createTable(tableName: string, query: string): Promise<boolean> {
    let result = true;

    try {
      logger.debug(`service.channel.member.createTable - Creating table ${tableName} : ${query}`);
      await this.client.execute(query);
    } catch (err) {
      logger.warn(`Table creation error for table ${tableName} : ${err.message}`);
      console.log(err);
      result = false;
    }

    return result;
  }

  async save(
    member: ChannelMember,
    options: ChannelMemberSaveOptions,
    context: ChannelExecutionContext,
  ): Promise<SaveResult<ChannelMember>> {
    const resultMember = (await this.create(member, context)).entity;

    return new SaveResult<ChannelMember>(TYPE, resultMember, OperationType.CREATE);
  }

  async create(
    member: ChannelMember,
    context: ChannelExecutionContext,
  ): Promise<CreateResult<ChannelMember>> {
    const memberToSave = { ...member, ...context.channel };

    const userChannel = pick(memberToSave, ...USER_CHANNEL_KEYS);
    const userChannelQueryColumnList = USER_CHANNEL_KEYS.map(key => `"${key}"`).join(",");
    const userChannelQueryColumnValues = "?".repeat(USER_CHANNEL_KEYS.length).split("").join(",");
    const userChannelQuery = `INSERT INTO ${this.options.keyspace}.${this.userChannelsTableName} (${userChannelQueryColumnList}) VALUES (${userChannelQueryColumnValues})`;

    const channelMember = pick(memberToSave, ...CHANNEL_MEMBERS_KEYS);
    const channelMemberColumnList = CHANNEL_MEMBERS_KEYS.map(key => `"${key}"`).join(",");
    const channelMemberColumnValues = "?".repeat(CHANNEL_MEMBERS_KEYS.length).split("").join(",");
    const channelMemberQuery = `INSERT INTO ${this.options.keyspace}.${this.channelMembersTableName} (${channelMemberColumnList}) VALUES (${channelMemberColumnValues})`;

    logger.debug(
      `service.channel.member.create - Batch(1/2) ${userChannelQuery}, ${userChannelQueryColumnValues}`,
    );
    logger.debug(
      `service.channel.member.create - Batch(2/2)${channelMemberQuery}, ${channelMemberColumnValues}`,
    );

    await this.client.batch(
      [
        {
          query: userChannelQuery,
          params: userChannel,
        },
        {
          query: channelMemberQuery,
          params: channelMember,
        },
      ],
      { prepare: true },
    );

    return new CreateResult<ChannelMember>(TYPE, userChannel as ChannelMember);
  }

  /**
   * Update the user settings in user_channels
   */
  async update(
    pk: ChannelMemberPrimaryKey,
    member: ChannelMember,
  ): Promise<UpdateResult<ChannelMember>> {
    const mergeMember = { ...member, ...pk };
    const updatableChannel = pick(mergeMember, ...USER_CHANNEL_KEYS);
    const columnList = USER_CHANNEL_KEYS.map(key => `"${key}"`).join(",");
    const columnValues = "?".repeat(USER_CHANNEL_KEYS.length).split("").join(",");
    const query = `INSERT INTO ${this.options.keyspace}.${this.userChannelsTableName} (${columnList}) VALUES (${columnValues})`;

    logger.info(`service.channel.member.update : ${query} - ${columnValues}`);

    await this.client.execute(query, pick(updatableChannel, ...USER_CHANNEL_KEYS), {
      prepare: true,
    });

    return new UpdateResult<ChannelMember>(TYPE, {
      id: updatableChannel.user_id,
      ...updatableChannel,
    });
  }

  async get(key: ChannelMemberPrimaryKey): Promise<ChannelMember> {
    const query = `SELECT * FROM ${this.options.keyspace}.${this.userChannelsTableName} WHERE ${WHERE}`;

    logger.info(`service.channel.member.get : ${query}`);

    const row = (await this.client.execute(query, key, { prepare: true })).first();

    if (!row) {
      return;
    }

    return this.mapRowToChannelMember(row);
  }

  async delete(pk: ChannelMemberPrimaryKey): Promise<DeleteResult<ChannelMember>> {
    const userChannelQuery = `DELETE FROM ${this.options.keyspace}.${this.userChannelsTableName} WHERE ${WHERE}`;
    const channelMemberQuery = `DELETE FROM ${this.options.keyspace}.${this.channelMembersTableName} WHERE ${WHERE}`;

    logger.info(`service.channel.member.delete - Batch(1/2) ${userChannelQuery}`);
    logger.info(`service.channel.member.delete - Batch(2/2) ${channelMemberQuery}`);

    await this.client.batch(
      [
        {
          query: userChannelQuery,
          params: pk,
        },
        {
          query: channelMemberQuery,
          params: pk,
        },
      ],
      { prepare: true },
    );

    return new DeleteResult<ChannelMember>(TYPE, pk as ChannelMember, true);
  }

  list(
    pagination: Paginable,
    options?: ChannelListOptions,
    context?: ChannelExecutionContext,
  ): Promise<ListResult<ChannelMember>> {
    return this.listChannelMembers(context.channel, pagination);
  }

  listChannelMembers(channel: Channel, pagination: Paginable): Promise<ListResult<ChannelMember>> {
    const params = {
      channel_id: channel.id,
      workspace_id: channel.workspace_id,
      company_id: channel.company_id,
    };
    const query = `SELECT * FROM ${this.options.keyspace}.${this.channelMembersTableName} WHERE ${WHERE_CHANNEL}`;

    return this.listMembers(pagination, query, params);
  }

  listUserChannels(
    user: User,
    pagination: Paginable,
    context: WorkspaceExecutionContext,
  ): Promise<ListResult<ChannelMember>> {
    const params = {
      workspace_id: context.workspace.workspace_id,
      company_id: context.workspace.company_id,
      user_id: user.id,
    };
    const query = `SELECT * FROM ${this.options.keyspace}.${this.userChannelsTableName} WHERE ${WHERE_COMPANY_WORKSPACE} AND user_id = ?;`;

    return this.listMembers(pagination, query, params);
  }

  private async listMembers(pagination: Paginable, query: string, params: cassandra.ArrayOrObject) {
    logger.debug(`service.channel.member.list - ${query}, ${params}`);
    const paginate = CassandraPagination.from(pagination);
    const result = await this.client.execute(query, params, {
      fetchSize: paginate.limit,
      pageState: paginate.page_token,
      prepare: true,
    });

    if (!result.rowLength) {
      return new ListResult<ChannelMember>(TYPE, []);
    }

    return new ListResult<ChannelMember>(
      TYPE,
      result.rows.map(row => this.mapRowToChannelMember(row)),
      CassandraPagination.next(paginate, result.pageState),
    );
  }

  isChannelMember(): Promise<ChannelMember> {
    throw new Error("Not implemented");
  }

  mapRowToChannelMember(row: cassandra.types.Row): ChannelMember {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const member: { [column: string]: any } = {};

    (row.keys() || []).forEach(key => (member[key] = row.get(key)));

    return plainToClass(ChannelMember, { id: member.user_id, ...member });
  }
}
