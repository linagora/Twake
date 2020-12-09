/* eslint-disable @typescript-eslint/no-unused-vars */
import mongo from "mongodb";
import {
  CreateResult,
  UpdateResult,
  SaveResult,
  DeleteResult,
  Paginable,
  ListResult,
} from "../../../../core/platform/framework/api/crud-service";
import { ChannelMemberPreferencesServiceAPI } from "../../api";
import {
  ChannelMemberNotificationPreference,
  ChannelMemberNotificationPreferencePrimaryKey,
  UserNotificationBadge,
  UserNotificationBadgePrimaryKey,
} from "../../entities";
import { NotificationExecutionContext } from "../../types";

const TYPE = "notification";

export class MongoChannelMemberPreferencesService implements ChannelMemberPreferencesServiceAPI {
  version: "1";
  protected collection: mongo.Collection<Notification>;

  constructor(private db: mongo.Db) {
    this.collection = this.db.collection<Notification>(`${TYPE}s`);
  }

  async init(): Promise<this> {
    return this;
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
