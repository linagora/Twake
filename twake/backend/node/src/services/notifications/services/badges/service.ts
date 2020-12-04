/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  RealtimeCreated,
  RealtimeDeleted,
  RealtimeSaved,
  RealtimeUpdated,
} from "../../../../core/platform/framework";
import { ResourcePath } from "../../../../core/platform/services/realtime/types";
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
import { getNotificationRoomName } from "../realtime";

export class Service implements UserNotificationBadgeServiceAPI {
  version: "1";

  constructor(private service: UserNotificationBadgeServiceAPI) {}

  async init(): Promise<this> {
    try {
      this.service.init && (await this.service.init());
    } catch (err) {
      console.error("Can not initialize UserNotificationBadgeService");
    }

    return this;
  }

  @RealtimeCreated<UserNotificationBadge>((badge, context) =>
    ResourcePath.get(getNotificationRoomName(context.user)),
  )
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

  @RealtimeUpdated<UserNotificationBadge>((badge, context) =>
    ResourcePath.get(getNotificationRoomName(context.user)),
  )
  update?(
    pk: UserNotificationBadgePrimaryKey,
    item: UserNotificationBadge,
    context?: NotificationExecutionContext,
  ): Promise<UpdateResult<UserNotificationBadge>> {
    throw new Error("Method not implemented.");
  }

  @RealtimeSaved<UserNotificationBadge>((badge, context) =>
    ResourcePath.get(getNotificationRoomName(context.user)),
  )
  save?<SaveOptions>(
    item: UserNotificationBadge,
    options: SaveOptions,
    context: NotificationExecutionContext,
  ): Promise<SaveResult<UserNotificationBadge>> {
    throw new Error("Method not implemented.");
  }

  @RealtimeDeleted<UserNotificationBadge>((badge, context) =>
    ResourcePath.get(getNotificationRoomName(context.user)),
  )
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
    return this.service.list(pagination, options, context);
  }
}
