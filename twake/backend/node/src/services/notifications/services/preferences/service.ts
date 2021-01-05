import _ from "lodash";
import {
  DeleteResult,
  ListResult,
  SaveResult,
  OperationType,
} from "../../../../core/platform/framework/api/crud-service";
import {
  ChannelMemberNotificationPreference,
  ChannelMemberNotificationPreferencePrimaryKey,
} from "../../entities";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { ChannelMemberPreferencesServiceAPI } from "../../api";
import Repository, {
  FindOptions,
} from "../../../../core/platform/services/database/services/orm/repository/repository";
import { TwakeContext } from "../../../../core/platform/framework";
import { NotificationPubsubService } from "./pubsub";

const TYPE = "channel_members_notification_preferences";

export class ChannelMemberPreferencesService implements ChannelMemberPreferencesServiceAPI {
  version: "1";
  repository: Repository<ChannelMemberNotificationPreference>;
  pubsub: NotificationPubsubService;

  constructor(private database: DatabaseServiceAPI) {}

  async init(context: TwakeContext): Promise<this> {
    this.repository = await this.database.getRepository<ChannelMemberNotificationPreference>(
      TYPE,
      ChannelMemberNotificationPreference,
    );
    await this.subscribe(context);

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

  async save(
    entity: ChannelMemberNotificationPreference,
  ): Promise<SaveResult<ChannelMemberNotificationPreference>> {
    const pk: ChannelMemberNotificationPreferencePrimaryKey = {
      user_id: entity.user_id,
      company_id: entity.company_id,
      channel_id: entity.channel_id,
    };

    let preference = await this.repository.findOne(pk);

    if (!preference) {
      preference = new ChannelMemberNotificationPreference();
      preference = _.merge(entity, pk);
    }

    preference = _.merge(preference, entity);

    await this.repository.save(preference);

    return new SaveResult(TYPE, preference, OperationType.CREATE);
  }

  async get(
    pk: ChannelMemberNotificationPreferencePrimaryKey,
  ): Promise<ChannelMemberNotificationPreference> {
    return await this.repository.findOne(pk);
  }

  async delete(
    pk: ChannelMemberNotificationPreferencePrimaryKey,
  ): Promise<DeleteResult<ChannelMemberNotificationPreference>> {
    await this.repository.remove(pk as ChannelMemberNotificationPreference);

    return new DeleteResult(TYPE, pk as ChannelMemberNotificationPreference, true);
  }

  list(): Promise<ListResult<ChannelMemberNotificationPreference>> {
    throw new Error("Not implemented");
  }

  async getChannelPreferencesForUsers(
    channelAndCompany: Pick<
      ChannelMemberNotificationPreferencePrimaryKey,
      "channel_id" | "company_id"
    >,
    users: string[] = [],
    lastRead: {
      lessThan: number;
    },
  ): Promise<ListResult<ChannelMemberNotificationPreference>> {
    const findOptions: FindOptions = {};

    if (lastRead && lastRead.lessThan) {
      findOptions.$lt = [["last_read", lastRead.lessThan]];
    }

    return this.repository.find({ ...channelAndCompany, ...{ user_id: users } }, findOptions);
  }

  async getChannelPreferencesForUsersFilteredByReadTime(
    channelAndCompany: Pick<
      ChannelMemberNotificationPreferencePrimaryKey,
      "channel_id" | "company_id"
    >,
    users: string[] = [],
    lastRead: number,
  ): Promise<ListResult<ChannelMemberNotificationPreference>> {
    return this.repository.find(
      { ...channelAndCompany, ...{ user_id: users } },
      { $lt: [["last_read", lastRead]] },
    );
  }
}
