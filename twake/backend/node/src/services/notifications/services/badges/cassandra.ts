import cassandra from "cassandra-driver";
import {
  CreateResult,
  UpdateResult,
  SaveResult,
  DeleteResult,
  Paginable,
  ListResult,
} from "../../../../core/platform/framework/api/crud-service";
import { logger } from "../../../../core/platform/framework";
import { CassandraConnectionOptions } from "../../../../core/platform/services/database/services/connectors/cassandra";

import { UserNotificationBadgeServiceAPI } from "../../api";
import { UserNotificationBadge } from "../../entities";
import { NotificationExecutionContext } from "../../types";

const TYPE = "user_notification_badge";
export class CassandraUserNotificationBadgeService implements UserNotificationBadgeServiceAPI {
  version: string;
  private table = `${TYPE}s`;

  constructor(private client: cassandra.Client, private options: CassandraConnectionOptions) {}

  async init(): Promise<this> {
    await Promise.all([this.createNotificationTable()]);
    return this;
  }

  private createNotificationTable(): Promise<boolean> {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.options.keyspace}.${this.table} (user_id uuid, company_id uuid, workspace_id text, channel_id uuid, message_count int, PRIMARY KEY (user_id, company_id, workspace_id, channel_id));`;

    return this.createTable(this.table, query);
  }

  private async createTable(tableName: string, query: string): Promise<boolean> {
    let result = true;

    try {
      logger.debug(
        `service.notification.badge.createTable - Creating table ${tableName} : ${query}`,
      );
      await this.client.execute(query);
    } catch (err) {
      logger.warn(
        { err },
        `service.notification.badge.createTable creation error for table ${tableName} : ${err.message}`,
      );
      console.log(err);
      result = false;
    }

    return result;
  }

  create?(
    item: UserNotificationBadge,
    context?: NotificationExecutionContext,
  ): Promise<CreateResult<UserNotificationBadge>> {
    throw new Error("Method not implemented.");
  }

  get(
    pk: Pick<UserNotificationBadge, "user_id" | "company_id" | "workspace_id" | "channel_id">,
    context?: NotificationExecutionContext,
  ): Promise<UserNotificationBadge> {
    throw new Error("Method not implemented.");
  }

  update?(
    pk: Pick<UserNotificationBadge, "user_id" | "company_id" | "workspace_id" | "channel_id">,
    item: UserNotificationBadge,
    context?: NotificationExecutionContext,
  ): Promise<UpdateResult<UserNotificationBadge>> {
    throw new Error("Method not implemented.");
  }

  save?<SaveOptions>(
    item: UserNotificationBadge,
    options: SaveOptions,
    context: NotificationExecutionContext,
  ): Promise<SaveResult<UserNotificationBadge>> {
    throw new Error("Method not implemented.");
  }

  delete(
    pk: Pick<UserNotificationBadge, "user_id" | "company_id" | "workspace_id" | "channel_id">,
    context?: NotificationExecutionContext,
  ): Promise<DeleteResult<UserNotificationBadge>> {
    throw new Error("Method not implemented.");
  }

  async list<ListOptions>(
    pagination: Paginable,
    options?: ListOptions,
    context?: NotificationExecutionContext,
  ): Promise<ListResult<UserNotificationBadge>> {
    return new ListResult<UserNotificationBadge>(TYPE, []);
  }
}
