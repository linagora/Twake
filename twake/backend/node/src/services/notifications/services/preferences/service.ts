/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  CreateResult,
  UpdateResult,
  SaveResult,
  DeleteResult,
  Paginable,
  ListResult,
} from "../../../../core/platform/framework/api/crud-service";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import { ChannelMemberPreferencesServiceAPI } from "../../api";
import { NotificationExecutionContext } from "../../types";
import {
  ChannelMemberNotificationPreference,
  ChannelMemberNotificationPreferencePrimaryKey,
} from "../../entities";
import { NotificationPubsubService } from "./pubsub";
import { logger, TwakeContext } from "../../../../core/platform/framework";

export class Service implements ChannelMemberPreferencesServiceAPI {
  version: "1";
  private pubsub: NotificationPubsubService;

  constructor(private service: ChannelMemberPreferencesServiceAPI) {}

  async init(context: TwakeContext): Promise<this> {
    try {
      this.service.init && (await this.service.init());
      await this.subscribe(context);
    } catch (err) {
      logger.warn({ err }, "Error while initializing the UserNotificationBadgeService");
    }

    return this;
  }

  async subscribe(context: TwakeContext): Promise<this> {
    if (!context) {
      return;
    }

    this.pubsub = new NotificationPubsubService(this);
    this.pubsub.subscribe(context.getProvider("pubsub"));

    return this;
  }

  create(
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

  update(
    pk: ChannelMemberNotificationPreferencePrimaryKey,
    item: ChannelMemberNotificationPreference,
    context?: NotificationExecutionContext,
  ): Promise<UpdateResult<ChannelMemberNotificationPreference>> {
    throw new Error("Method not implemented.");
  }

  save<SaveOptions>(
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
    return this.service.list(pagination, options, context);
  }
}
