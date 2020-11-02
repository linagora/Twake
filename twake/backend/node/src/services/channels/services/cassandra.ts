import cassandra from "cassandra-driver";
import { Channel } from "../entities";
import ChannelServiceAPI, { ChannelPrimaryKey } from "../provider";
import {
  DeleteResult,
  ListResult,
  OperationType,
  Pagination,
  SaveResult,
} from "../../../core/platform/framework/api/crud-service";
import { WorkspaceExecutionContext } from "../types";
import { plainToClass } from "class-transformer";

export class CassandraChannelService implements ChannelServiceAPI {
  version = "1";
  keyspace = "twake";
  table = "channels";

  constructor(private client: cassandra.Client) {}

  async save(channel: Channel): Promise<SaveResult<Channel>> {
    const mode = channel.id ? OperationType.UPDATE : OperationType.CREATE;
    const query = `INSERT INTO ${this.keyspace}.${this.table}
      (
      "company_id",
      "workspace_id",
      "id",
      "icon",
      "name",
      "description",
      "channel_group",
      "visibility",
      "is_default",
      "archived"
      )
      VALUES (?,?,?,?,?,?,?,?,?,?)`;

    if (!channel.id) {
      channel.id = String(cassandra.types.Uuid.random());
    }

    await this.client.execute(query, channel);

    return new SaveResult<Channel>("channel", channel, mode);
  }

  async get(key: ChannelPrimaryKey): Promise<Channel> {
    const query = `SELECT * FROM ${this.keyspace}.${this.table} WHERE id = ? AND company_id = ? AND workspace_id = ?`;
    const row = (await this.client.execute(query, key)).first();

    if (!row) {
      return;
    }

    return this.mapRowToChannel(row);
  }

  async delete(key: ChannelPrimaryKey): Promise<DeleteResult<Channel>> {
    const query = `DELETE FROM ${this.keyspace}.${this.table} WHERE id = ? AND company_id = ? AND workspace_id = ?`;
    await this.client.execute(query, key);

    return new DeleteResult<Channel>("channel", key as Channel, true);
  }

  async list(
    pagination: Pagination,
    context: WorkspaceExecutionContext,
  ): Promise<ListResult<Channel>> {
    const query = `SELECT * FROM ${this.keyspace}.${this.table} WHERE company_id = ? AND workspace_id = ?`;

    const result = await this.client.execute(query, context.workspace);
    if (!result.rowLength) {
      return new ListResult<Channel>("channel", []);
    }

    return new ListResult<Channel>(
      "channel",
      result.rows.map(row => this.mapRowToChannel(row)),
    );
  }

  mapRowToChannel(row: cassandra.types.Row): Channel {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel: { [column: string]: any } = {};

    (row.keys() || []).forEach(key => (channel[key] = row.get(key)));

    return plainToClass(Channel, channel);
  }
}
