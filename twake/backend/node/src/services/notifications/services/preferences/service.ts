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
import Repository from "../../../../core/platform/services/database/services/orm/repository";
import { TwakeContext } from "../../../../core/platform/framework";
import { NotificationPubsubService } from "./pubsub";

const TYPE = "channel_members_notification_preferences";

export class ChannelMemberPreferencesService implements ChannelMemberPreferencesServiceAPI {
  version: "1";
  repository: Repository<ChannelMemberNotificationPreference>;
  pubsub: NotificationPubsubService;

  constructor(private database: DatabaseServiceAPI) {}

  async init(context: TwakeContext): Promise<this> {
    this.repository = await this.database
      .getRepository<ChannelMemberNotificationPreference>(TYPE)
      .init(ChannelMemberNotificationPreference);
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
    const manager = this.database.newManager<ChannelMemberNotificationPreference>();

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

    await manager.persist(preference).flush();

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
    const manager = this.database.newManager();

    await manager.remove(pk, ChannelMemberNotificationPreference).flush();

    return new DeleteResult(TYPE, pk as ChannelMemberNotificationPreference, true);
  }

  list(): Promise<ListResult<ChannelMemberNotificationPreference>> {
    throw new Error("Not implemented");
  }
}
