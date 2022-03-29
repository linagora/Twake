import Repository from "../../../../../core/platform/services/database/services/orm/repository/repository";
import { ChannelPendingEmailService, ChannelPrimaryKey } from "../../../provider";
import {
  CreateResult,
  CrudException,
  DeleteResult,
  ListResult,
  Pagination,
  SaveResult,
  UpdateResult,
} from "../../../../../core/platform/framework/api/crud-service";
import { ChannelExecutionContext } from "../../../types";
import { getLogger } from "../../../../../core/platform/framework";
import {
  ChannelPendingEmails,
  ChannelPendingEmailsPrimaryKey,
  getChannelPendingEmailsInstance,
} from "../../../entities";
import { ChannelPendingEmailsListQueryParameters } from "../../../web/types";
import { plainToClass } from "class-transformer";
import { NewUserInWorkspaceNotification } from "../types";
import gr from "../../../../global-resolver";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logger = getLogger("channel.pending_emails");

export default class ChannelPendingEmailServiceImpl implements ChannelPendingEmailService {
  version: "1";
  repository: Repository<ChannelPendingEmails>;

  async init(): Promise<this> {
    this.repository = await gr.database.getRepository(
      "channel_pending_emails",
      ChannelPendingEmails,
    );

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
      throw CrudException.notFound("Channel pendingEmail has not been found");
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

  async proccessPendingEmails(
    user: NewUserInWorkspaceNotification,
    workspace: Required<Pick<ChannelPrimaryKey, "company_id" | "workspace_id">>,
  ): Promise<void> {
    // Get user object
    const userObj = await gr.services.users.get({
      id: user.user_id,
    });

    // All pending emails in workspace
    const allPendingEmailsInWorkspace = await this.repository.find(workspace);

    // Filter pending emails in workspace with user object email
    allPendingEmailsInWorkspace.filterEntities(({ email }) => email === userObj.email_canonical);

    // Add user to all channel that he is invited then delete pending email entity
    allPendingEmailsInWorkspace
      .getEntities()
      .forEach(async ({ workspace_id, channel_id, company_id, email }) => {
        // Add user to channel
        const list = await gr.services.members.addUserToChannels(userObj, [
          {
            workspace_id,
            company_id,
            id: channel_id,
          },
        ]);

        // If added to channel, delete pending email
        const isAddedToChannel = list.getEntities()[0].added;
        if (isAddedToChannel) {
          await this.delete(
            getChannelPendingEmailsInstance({
              workspace_id,
              company_id,
              email,
              channel_id,
            }),
          );
        }
      });
  }

  onCreated(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pendingEmail: ChannelPendingEmails,
  ): void {
    throw new Error("Method not implemented.");
  }
}
