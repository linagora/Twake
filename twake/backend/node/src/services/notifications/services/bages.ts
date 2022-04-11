/* eslint-disable @typescript-eslint/no-unused-vars */
import { RealtimeDeleted, RealtimeSaved, TwakeContext } from "../../../core/platform/framework";
import { ResourcePath } from "../../../core/platform/services/realtime/types";
import {
  CrudException,
  DeleteResult,
  ListResult,
  OperationType,
  Pagination,
  SaveResult,
} from "../../../core/platform/framework/api/crud-service";
import { UserNotificationBadgeServiceAPI } from "../api";
import {
  getUserNotificationBadgeInstance,
  UserNotificationBadge,
  UserNotificationBadgePrimaryKey,
  UserNotificationBadgeType,
} from "../entities";
import { NotificationExecutionContext } from "../types";
import { getNotificationRoomName } from "./realtime";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import gr from "../../global-resolver";
import { pick, uniq } from "lodash";
import _ from "lodash";

export class UserNotificationBadgeService implements UserNotificationBadgeServiceAPI {
  version: "1";
  repository: Repository<UserNotificationBadge>;

  async init(context: TwakeContext): Promise<this> {
    this.repository = await gr.database.getRepository<UserNotificationBadge>(
      UserNotificationBadgeType,
      UserNotificationBadge,
    );

    return this;
  }

  async get(pk: UserNotificationBadgePrimaryKey): Promise<UserNotificationBadge> {
    return await this.repository.findOne(pk);
  }

  @RealtimeSaved<UserNotificationBadge>((badge, context) => {
    return [
      {
        room: ResourcePath.get(getNotificationRoomName(badge.user_id)),
      },
    ];
  })
  async save<SaveOptions>(
    badge: UserNotificationBadge,
    options: SaveOptions,
    context: NotificationExecutionContext,
  ): Promise<SaveResult<UserNotificationBadge>> {
    await this.repository.save(getUserNotificationBadgeInstance(badge));

    return new SaveResult(UserNotificationBadgeType, badge, OperationType.CREATE);
  }

  @RealtimeDeleted<UserNotificationBadge>((badge, context) => {
    return [
      {
        room: ResourcePath.get(getNotificationRoomName(badge.user_id)),
      },
    ];
  })
  async delete(
    pk: UserNotificationBadgePrimaryKey,
    context?: NotificationExecutionContext,
  ): Promise<DeleteResult<UserNotificationBadge>> {
    await this.repository.remove(pk as UserNotificationBadge);

    return new DeleteResult(UserNotificationBadgeType, pk as UserNotificationBadge, true);
  }

  list(): Promise<ListResult<UserNotificationBadge>> {
    throw new Error("Not implemented");
  }

  async listForUserPerCompanies(user_id: string): Promise<ListResult<UserNotificationBadge>> {
    //We remove all badge from current company as next block will create dupicates
    const companies_ids = (await gr.services.companies.getAllForUser(user_id)).map(
      gu => gu.group_id,
    );

    let result: UserNotificationBadge[] = [];
    let type = "";
    for (const company_id of companies_ids) {
      const find = await this.repository.find(
        {
          company_id,
          user_id,
        },
        {
          pagination: new Pagination("", "1"),
        },
      );
      type = find.type;
      result = result.concat(find.getEntities());
    }

    const badges = new ListResult(type, result);
    await this.ensureBadgesAreReachable(badges);

    return badges;
  }

  async listForUser(
    company_id: string,
    user_id: string,
    filter: Pick<UserNotificationBadgePrimaryKey, "workspace_id" | "channel_id" | "thread_id">,
  ): Promise<ListResult<UserNotificationBadge>> {
    if (!company_id || !user_id) {
      throw CrudException.badRequest("company_id and user_id are required");
    }

    const badges = await this.repository.find({
      ...{
        company_id,
        user_id,
      },
      ...pick(filter, ["workspace_id", "channel_id", "thread_id"]),
    });

    await this.ensureBadgesAreReachable(badges);

    return badges;
  }

  // This will ensure we are still in the channels and if not, we'll remove the badge
  // We need to also ensure more than that
  // - Are we in the workspace?
  // - Are we in the company?
  async ensureBadgesAreReachable(
    badges: ListResult<UserNotificationBadge>,
  ): Promise<ListResult<UserNotificationBadge>> {
    if (badges.getEntities().length === 0) {
      return badges;
    }

    const userId = badges.getEntities()[0].user_id;

    const channels = uniq(badges.getEntities().map(r => r.channel_id));
    for (const channelId of channels) {
      const channelMemberPk = {
        company_id: badges.getEntities()[0].company_id,
        workspace_id: badges.getEntities()[0].workspace_id,
        channel_id: channelId,
        user_id: userId,
      };
      const context = {
        user: { id: channelMemberPk.user_id, server_request: true },
        channel: { id: channelId, ...channelMemberPk },
      };
      const exists = await gr.services.channels.members.get(channelMemberPk, context);
      if (!exists) {
        for (const badge of badges.getEntities()) {
          if (badge.channel_id === channelId) this.removeUserChannelBadges(badge);
        }
        badges.filterEntities(b => b.channel_id !== channelId);
      }
    }

    const badgePerWorkspace = _.uniqBy(badges.getEntities(), r => r.workspace_id);
    for (const badge of badgePerWorkspace) {
      const workspaceId = badge.workspace_id;
      const companyId = badge.company_id;
      if (workspaceId === "direct") {
        continue;
      }
      try {
        const exists = await gr.services.workspaces.getUser({
          workspaceId,
          userId,
        });
        if (!exists) {
          await gr.services.channels.members.ensureUserNotInWorkspaceIsNotInChannel(
            { id: userId },
            { id: workspaceId, company_id: companyId },
          );
          for (const badge of badges.getEntities()) {
            if (badge.workspace_id === workspaceId) this.removeUserChannelBadges(badge);
          }
          badges.filterEntities(b => b.workspace_id === workspaceId);
        }
      } catch (e) {}
    }

    return badges;
  }

  /**
   * FIXME: This is a temporary implementation which is sending as many websocket notifications as there are badges to remove
   * A better implementation will be to do a bulk delete and have a single websocket notification event
   * @param filter
   */
  async removeUserChannelBadges(
    filter: Pick<
      UserNotificationBadgePrimaryKey,
      "workspace_id" | "company_id" | "channel_id" | "user_id"
    >,
  ): Promise<number> {
    const badges = (
      await this.repository.find(
        _.pick(filter, ["workspace_id", "company_id", "channel_id", "user_id"]),
      )
    ).getEntities();

    return (
      await Promise.all(
        badges.map(async badge => {
          try {
            return (await this.delete(badge)).deleted;
          } catch (err) {}
        }),
      )
    ).filter(Boolean).length;
  }
}
