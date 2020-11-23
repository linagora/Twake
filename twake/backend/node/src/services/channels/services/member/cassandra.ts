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
} from "../../../../core/platform/services/database/services/connectors";
import { ChannelMember, ChannelMemberPrimaryKey } from "../../entities";
import { MemberService } from "../../provider";
import { ChannelExecutionContext } from "../../types";
import { plainToClass } from "class-transformer";

const TYPE = "channel_member";
const ENTITY_KEYS = [
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

// TODO: Generate it from primary key
const WHERE_CHANNEL = "channel_id = ? AND company_id = ? AND workspace_id = ?";
const WHERE = `${WHERE_CHANNEL} AND user_id = ?`;

export class CassandraMemberService implements MemberService {
  version: "1";
  readonly channelMembersTable = `${TYPE}s`;

  constructor(private client: cassandra.Client, private options: CassandraConnectionOptions) {}

  async init(): Promise<this> {
    // TODO: Await for the table to be created with some RXJS magic
    await this.createTables();

    return this;
  }

  async createTables(): Promise<boolean> {
    let result = true;

    try {
      await this.client.execute(
        `CREATE TABLE IF NOT EXISTS ${this.options.keyspace}.${this.channelMembersTable}(company_id uuid, workspace_id uuid, user_id uuid, channel_id uuid, type text, last_access date, last_increment date, favorite boolean, notification_level text, expiration date, PRIMARY KEY (company_id, workspace_id, channel_id, user_id));`,
      );
    } catch (err) {
      console.error("Table creation error for channel members", err);
      result = false;
    }

    return result;
  }

  async save(
    member: ChannelMember,
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

    // TODO: Generate ENTITY KEY from ChannelMember class decorators
    const saveMember = pick(memberToSave, ...ENTITY_KEYS);
    const columnList = ENTITY_KEYS.map(key => `"${key}"`).join(",");
    const columnValues = "?".repeat(ENTITY_KEYS.length).split("").join(",");
    const query = `INSERT INTO ${this.options.keyspace}.${this.channelMembersTable} (${columnList}) VALUES (${columnValues})`;

    await this.client.execute(query, saveMember, { prepare: false });

    return new CreateResult<ChannelMember>(TYPE, saveMember as ChannelMember);
  }

  async update(
    pk: ChannelMemberPrimaryKey,
    member: ChannelMember,
  ): Promise<UpdateResult<ChannelMember>> {
    const mergeMember = { ...member, ...pk };
    const updatableChannel = pick(mergeMember, ...ENTITY_KEYS);
    const columnList = ENTITY_KEYS.map(key => `"${key}"`).join(",");
    const columnValues = "?".repeat(ENTITY_KEYS.length).split("").join(",");
    const query = `INSERT INTO ${this.options.keyspace}.${this.channelMembersTable} (${columnList}) VALUES (${columnValues})`;

    await this.client.execute(query, pick(updatableChannel, ...ENTITY_KEYS));

    return new UpdateResult<ChannelMember>(TYPE, updatableChannel);
  }

  async get(key: ChannelMemberPrimaryKey): Promise<ChannelMember> {
    // TODO: Generate the WHERE clause from the key
    const query = `SELECT * FROM ${this.options.keyspace}.${this.channelMembersTable} WHERE ${WHERE}`;
    const row = (await this.client.execute(query, key)).first();

    if (!row) {
      return;
    }

    return this.mapRowToChannelMember(row);
  }

  async delete(pk: ChannelMemberPrimaryKey): Promise<DeleteResult<ChannelMember>> {
    const query = `DELETE FROM ${this.options.keyspace}.${this.channelMembersTable} WHERE ${WHERE}`;

    await this.client.execute(query, pk);

    return new DeleteResult<ChannelMember>(TYPE, pk as ChannelMember, true);
  }

  async list(
    pagination: Paginable,
    context: ChannelExecutionContext,
  ): Promise<ListResult<ChannelMember>> {
    const paginate = CassandraPagination.from(pagination);
    const query = `SELECT * FROM ${this.options.keyspace}.${this.channelMembersTable} WHERE ${WHERE_CHANNEL}`;
    const result = await this.client.execute(
      query,
      {
        channel_id: context.channel.id,
        workspace_id: context.channel.workspace_id,
        company_id: context.channel.company_id,
      },
      {
        fetchSize: paginate.limit,
        pageState: paginate.page_token,
      },
    );

    if (!result.rowLength) {
      return new ListResult<ChannelMember>(TYPE, []);
    }

    return new ListResult<ChannelMember>(
      TYPE,
      result.rows.map(row => this.mapRowToChannelMember(row)),
      CassandraPagination.next(paginate, result.pageState),
    );
  }

  mapRowToChannelMember(row: cassandra.types.Row): ChannelMember {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const member: { [column: string]: any } = {};

    (row.keys() || []).forEach(key => (member[key] = row.get(key)));

    return plainToClass(ChannelMember, member);
  }
}
