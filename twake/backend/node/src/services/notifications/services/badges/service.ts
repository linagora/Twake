import {
  CreateResult,
  UpdateResult,
  SaveResult,
  DeleteResult,
  Paginable,
  ListResult,
} from "../../../../core/platform/framework/api/crud-service";
import { UserNotificationBadgeServiceAPI } from "../../api";
import { UserNotificationBadge } from "../../entities";
import { NotificationExecutionContext } from "../../types";

export class Service implements UserNotificationBadgeServiceAPI {
  version: "1";

  constructor(private service: UserNotificationBadgeServiceAPI) {}

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

  list<ListOptions>(
    pagination: Paginable,
    options?: ListOptions,
    context?: NotificationExecutionContext,
  ): Promise<ListResult<UserNotificationBadge>> {
    return this.service.list(pagination, options, context);
  }

  async init(): Promise<this> {
    try {
      this.service.init && (await this.service.init());
    } catch (err) {
      console.error("Can not initialize UserNotificationBadgeService");
    }

    return this;
  }
}
