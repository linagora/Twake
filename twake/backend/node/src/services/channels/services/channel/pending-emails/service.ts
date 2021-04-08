import { DatabaseServiceAPI } from "../../../../../core/platform/services/database/api";
import Repository from "../../../../../core/platform/services/database/services/orm/repository/repository";
import { ChannelPendingEmailService } from "../../../provider";
import {
  CreateResult,
  UpdateResult,
  SaveResult,
  DeleteResult,
  Paginable,
  ListResult,
  CrudExeption,
  Pagination,
} from "../../../../../core/platform/framework/api/crud-service";
import { ChannelExecutionContext } from "../../../types";
import ChannelGuestListener from "./listener";
import { getLogger } from "../../../../../core/platform/framework";
import { ChannelPendingEmailsPrimaryKey, ChannelPendingEmails } from "../../../entities";
import { ChannelPendingEmailsListQueryParameters } from "../../../web/types";
import { plainToClass } from "class-transformer";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = getLogger("channel.pending_emails");

export default class ChannelPendingEmailsService implements ChannelPendingEmailService {
  version: "1";
  repository: Repository<ChannelPendingEmails>;
  listener: ChannelGuestListener;

  constructor(private database: DatabaseServiceAPI) {}

  async init(): Promise<this> {
    this.repository = await this.database.getRepository(
      "channel_pending_emails",
      ChannelPendingEmails,
    );
    this.listener = new ChannelGuestListener(this);
    await this.listener.init();
    return this;
  }

  async create(pendingEmail: ChannelPendingEmails): Promise<CreateResult<ChannelPendingEmails>> {
    await this.repository.save(pendingEmail);

    // Once a channel pending email has been successfully created, we have to add him to all channels of the company that he was invited
    //this.onCreated(pendingEmail);
    return new CreateResult<ChannelPendingEmails>("channel_pending_emails", pendingEmail);
  }

  get(pk: ChannelPendingEmailsPrimaryKey): Promise<ChannelPendingEmails> {
    return this.repository.findOne(pk);
  }

  update(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pk: ChannelPendingEmailsPrimaryKey,
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

  async delete(pk: ChannelPendingEmailsPrimaryKey): Promise<DeleteResult<ChannelPendingEmails>> {
    const pendingEmail = await this.get(pk);

    if (!pendingEmail) {
      throw CrudExeption.notFound("Channel pendingEmail has not been found");
    }

    await this.repository.remove(pendingEmail);

    return new DeleteResult("channel_pending_emails", pendingEmail, true);
  }

  async list<ListOptions>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pagination: Pagination,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: ListOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: ChannelExecutionContext,
  ): Promise<ListResult<ChannelPendingEmails>> {
    const pk = {
      company_id: context.channel.company_id,
      workspace_id: context.channel.workspace_id,
      channel_id: context.channel.id,
    };

    const result = await this.repository.find(pk, { pagination });

    return new ListResult<ChannelPendingEmails>(
      "channel_pending_emails",
      result
        .getEntities()
        .map(pendingMember =>
          plainToClass(ChannelPendingEmails, { email: pendingMember.email, ...pendingMember }),
        ),
      result.nextPage,
    );
  }

  findPendingEmails(
    pk: ChannelPendingEmailsListQueryParameters,
  ): Promise<ListResult<ChannelPendingEmails>> {
    return this.repository.find(pk);
  }

  onCreated(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pendingEmail: ChannelPendingEmails,
  ): void {
    throw new Error("Method not implemented.");
  }
}
