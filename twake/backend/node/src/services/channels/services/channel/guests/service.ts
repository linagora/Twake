import { DatabaseServiceAPI } from "../../../../../core/platform/services/database/api";
import Repository from "../../../../../core/platform/services/database/services/orm/repository/repository";
import { ChannelGuestService } from "../../../provider";
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
import {
  ChannelGuestPrimaryKey,
  ChannelPendingEmails,
} from "../../../../../services/channels/entities";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = getLogger("channel.guests");

export default class ChannelGuestsService implements ChannelGuestService {
  version: "1";
  repository: Repository<ChannelPendingEmails>;
  listener: ChannelGuestListener;

  constructor(private database: DatabaseServiceAPI) {}

  async init(): Promise<this> {
    this.repository = await this.database.getRepository("default_channels", ChannelPendingEmails);
    this.listener = new ChannelGuestListener(this);
    await this.listener.init();
    return this;
  }

  async create(pendingEmail: ChannelPendingEmails): Promise<CreateResult<ChannelPendingEmails>> {
    await this.repository.save(pendingEmail);

    // Once a channel guest has been successfully created, we have to add him to all channels of the company that he was invited
    this.onCreated(pendingEmail);
    return new CreateResult<ChannelPendingEmails>("channel_pending_emails", pendingEmail);
  }

  get(pk: ChannelGuestPrimaryKey): Promise<ChannelPendingEmails> {
    return this.repository.findOne(pk);
  }

  update(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pk: ChannelGuestPrimaryKey,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    item: ChannelPendingEmails,
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

  async delete(pk: ChannelGuestPrimaryKey): Promise<DeleteResult<ChannelPendingEmails>> {
    const channelGuest = await this.get(pk);

    if (!channelGuest) {
      throw CrudExeption.notFound("Channel guest has not been found");
    }

    await this.repository.remove(channelGuest);

    return new DeleteResult("channel_pending_emails", channelGuest, true);
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

  onCreated(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pendingEmail: ChannelPendingEmails,
  ): void {
    throw new Error("Method not implemented.");
  }
}
