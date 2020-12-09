/* eslint-disable @typescript-eslint/no-unused-vars */
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

import { ChannelMemberPreferencesServiceAPI, UserNotificationBadgeServiceAPI } from "../../api";
import {
  ChannelMemberNotificationPreference,
  ChannelMemberNotificationPreferencePrimaryKey,
} from "../../entities";
import { NotificationExecutionContext } from "../../types";

const TYPE = "channel_members_notification_preferences";

export class CassandraChannelMemberPreferencesService
  implements ChannelMemberPreferencesServiceAPI {
  version: string;
  private table = `${TYPE}s`;

  constructor(private client: cassandra.Client, private options: CassandraConnectionOptions) {}

  async init(): Promise<this> {
    await Promise.all([this.createPreferencesTable()]);
    return this;
  }

  private createPreferencesTable(): Promise<boolean> {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.options.keyspace}.${this.table} (user_id uuid, company_id uuid, workspace_id text, channel_id uuid, message_count int, PRIMARY KEY (user_id, company_id, workspace_id, channel_id));`;

    return this.createTable(this.table, query);
  }

  private async createTable(tableName: string, query: string): Promise<boolean> {
    let result = true;

    try {
      logger.debug(
        `service.notification.preferences.createTable - Creating table ${tableName} : ${query}`,
      );
      await this.client.execute(query);
    } catch (err) {
      logger.warn(
        { err },
        `service.notification.preferences.createTable creation error for table ${tableName} : ${err.message}`,
      );
      result = false;
    }

    return result;
  }

  create?(
    item: ChannelMemberNotificationPreference,
    context?: NotificationExecutionContext,
  ): Promise<CreateResult<ChannelMemberNotificationPreference>> {
    throw new Error("Method not implemented.");
  }
  get(
    pk: ChannelMemberNotificationPreferencePrimaryKey,
    context?: NotificationExecutionContext,
  ): Promise<ChannelMemberNotificationPreference> {
    throw new Error("Method not implemented.");
  }
  update?(
    pk: ChannelMemberNotificationPreferencePrimaryKey,
    item: ChannelMemberNotificationPreference,
    context?: NotificationExecutionContext,
  ): Promise<UpdateResult<ChannelMemberNotificationPreference>> {
    throw new Error("Method not implemented.");
  }
  save?<SaveOptions>(
    item: ChannelMemberNotificationPreference,
    options: SaveOptions,
    context: NotificationExecutionContext,
  ): Promise<SaveResult<ChannelMemberNotificationPreference>> {
    throw new Error("Method not implemented.");
  }
  delete(
    pk: ChannelMemberNotificationPreferencePrimaryKey,
    context?: NotificationExecutionContext,
  ): Promise<DeleteResult<ChannelMemberNotificationPreference>> {
    throw new Error("Method not implemented.");
  }
  list<ListOptions>(
    pagination: Paginable,
    options?: ListOptions,
    context?: NotificationExecutionContext,
  ): Promise<ListResult<ChannelMemberNotificationPreference>> {
    throw new Error("Method not implemented.");
  }
}
