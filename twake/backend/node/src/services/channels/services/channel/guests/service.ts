import { DatabaseServiceAPI } from "../../../../../core/platform/services/database/api";
import Repository from "../../../../../core/platform/services/database/services/orm/repository/repository";
import { DefaultChannel, DefaultChannelPrimaryKey } from "../../../entities/default-channel";
import ChannelServiceAPI, { ChannelGuestService } from "../../../provider";
import {
  CreateResult,
  UpdateResult,
  SaveResult,
  DeleteResult,
  Paginable,
  ListResult,
  CrudExeption,
} from "../../../../../core/platform/framework/api/crud-service";
import { ChannelExecutionContext } from "../../../types";
import ChannelGuestListener from "./listener";
import { getLogger } from "../../../../../core/platform/framework";
import UserServiceAPI from "../../../../user/api";
import {
  ChannelGuestPrimaryKey,
  ChannelPendingEmails,
} from "../../../../../services/channels/entities";

const logger = getLogger("channel.default");

export default class ChannelGuestsService implements ChannelGuestService {
  version: "1";
  repository: Repository<ChannelPendingEmails>;
  listener: ChannelGuestListener;

  constructor(
    private database: DatabaseServiceAPI,
    private channelService: ChannelServiceAPI,
    private userService: UserServiceAPI,
  ) {}

  async init(): Promise<this> {
    return this;
  }

  async create(channel: ChannelPendingEmails): Promise<CreateResult<ChannelPendingEmails>> {
    return new CreateResult<ChannelPendingEmails>("default_channel", channel);
  }

  get(pk: ChannelGuestPrimaryKey): Promise<ChannelPendingEmails> {
    return this.repository.findOne(pk);
  }

  update(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pk: ChannelGuestPrimaryKey,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    item: DefaultChannel,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: ChannelExecutionContext,
  ): Promise<UpdateResult<ChannelPendingEmails>> {
    throw new Error("Method not implemented.");
  }

  save?<SaveOptions>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    item: ChannelPendingEmails,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: SaveOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: ChannelExecutionContext,
  ): Promise<SaveResult<ChannelPendingEmails>> {
    throw new Error("Method not implemented.");
  }

  async delete(pk: DefaultChannelPrimaryKey): Promise<DeleteResult<ChannelPendingEmails>> {
    const defaultChannel = await this.get(pk);

    if (!defaultChannel) {
      throw CrudExeption.notFound("Default channel has not been found");
    }

    await this.repository.remove(defaultChannel);

    return new DeleteResult("default_channel", defaultChannel, true);
  }

  list<ListOptions>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pagination: Paginable,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: ListOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: ChannelExecutionContext,
  ): Promise<ListResult<ChannelPendingEmails>> {
    throw new Error("Method not implemented.");
  }
}
