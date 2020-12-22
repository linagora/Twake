/* eslint-disable @typescript-eslint/no-unused-vars */
import mongo from "mongodb";
import { MongoConnector } from "../../../../core/platform/services/database/services/orm/connectors";
import {
  CreateResult,
  UpdateResult,
  SaveResult,
  DeleteResult,
  Paginable,
  ListResult,
} from "../../../../core/platform/framework/api/crud-service";
import { UserNotificationBadgeServiceAPI } from "../../api";
import { UserNotificationBadge, UserNotificationBadgePrimaryKey } from "../../entities";
import { NotificationExecutionContext } from "../../types";

const TYPE = "notification";

export class MongoUserNotificationBadgeService implements UserNotificationBadgeServiceAPI {
  version: "1";
  protected collection: mongo.Collection<Notification>;

  constructor(private connector: MongoConnector) {}

  async init(): Promise<this> {
    const db = await this.connector.getDatabase();
    this.collection = db.collection<Notification>(`${TYPE}s`);

    return this;
  }

  create?(
    item: UserNotificationBadge,
    context?: NotificationExecutionContext,
  ): Promise<CreateResult<UserNotificationBadge>> {
    throw new Error("Method not implemented.");
  }
  get(
    pk: UserNotificationBadgePrimaryKey,
    context?: NotificationExecutionContext,
  ): Promise<UserNotificationBadge> {
    throw new Error("Method not implemented.");
  }
  update?(
    pk: UserNotificationBadgePrimaryKey,
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
    pk: UserNotificationBadgePrimaryKey,
    context?: NotificationExecutionContext,
  ): Promise<DeleteResult<UserNotificationBadge>> {
    throw new Error("Method not implemented.");
  }
  list<ListOptions>(
    pagination: Paginable,
    options?: ListOptions,
    context?: NotificationExecutionContext,
  ): Promise<ListResult<UserNotificationBadge>> {
    throw new Error("Method not implemented.");
  }
}
