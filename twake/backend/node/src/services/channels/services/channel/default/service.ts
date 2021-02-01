import { DatabaseServiceAPI } from "../../../../../core/platform/services/database/api";
import Repository from "../../../../../core/platform/services/database/services/orm/repository/repository";
import { DefaultChannel, DefaultChannelPrimaryKey } from "../../../entities/default-channel";
import ChannelServiceAPI, { DefaultChannelService } from "../../../provider";
import {
  CreateResult,
  UpdateResult,
  SaveResult,
  DeleteResult,
  Paginable,
  ListResult,
} from "../../../../../core/platform/framework/api/crud-service";
import { ChannelExecutionContext } from "../../../types";
import { User, Workspace } from "../../../../types";
import DefaultChannelListener from "./listener";
import { logger } from "../../../../../core/platform/framework";

export default class DefaultChannelServiceImpl implements DefaultChannelService {
  version: "1";
  repository: Repository<DefaultChannel>;
  listener: DefaultChannelListener;

  constructor(private database: DatabaseServiceAPI, private channelService: ChannelServiceAPI) {}

  async init(): Promise<this> {
    this.repository = await this.database.getRepository("default_channels", DefaultChannel);
    this.listener = new DefaultChannelListener(this);
    await this.listener.init();
    return this;
  }

  async create(
    item: DefaultChannel,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: ChannelExecutionContext,
  ): Promise<CreateResult<DefaultChannel>> {
    await this.repository.save(item);

    // Once a default channel has been successfully created, we have to add all the workspace users as member of the channel
    // There are several ways to do it: Directly or using pubsub
    // Since member service is a channel sub service we can do it directly
    // Another good way to be sure that the user is in default channels is to have an endpoint which ensures this...
    this.onCreated(item);
    return new CreateResult<DefaultChannel>("default_channel", item);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  get(pk: DefaultChannelPrimaryKey, context?: ChannelExecutionContext): Promise<DefaultChannel> {
    throw new Error("Method not implemented.");
  }

  update(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pk: DefaultChannelPrimaryKey,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    item: DefaultChannel,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: ChannelExecutionContext,
  ): Promise<UpdateResult<DefaultChannel>> {
    throw new Error("Method not implemented.");
  }

  save?<SaveOptions>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    item: DefaultChannel,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: SaveOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: ChannelExecutionContext,
  ): Promise<SaveResult<DefaultChannel>> {
    throw new Error("Method not implemented.");
  }

  delete(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pk: Pick<DefaultChannel, "channel_id" | "company_id">,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: ChannelExecutionContext,
  ): Promise<DeleteResult<DefaultChannel>> {
    throw new Error("Method not implemented.");
  }

  list<ListOptions>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pagination: Paginable,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: ListOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: ChannelExecutionContext,
  ): Promise<ListResult<DefaultChannel>> {
    throw new Error("Method not implemented.");
  }

  /**
   * TODO: Add pubsub annotation, check if needed
   * @param channel
   */
  async onCreated(channel: DefaultChannel): Promise<void> {
    logger.info("Default channel %o has been created", channel);
    this.addWorkspaceUsersToChannel(channel);
  }

  async addWorkspaceUsersToChannel(channel: DefaultChannelPrimaryKey): Promise<void> {
    const workspace: Workspace = {
      company_id: channel.company_id,
      workspace_id: channel.workspace_id,
    };
    const users = await getWorkspaceUsers(workspace);

    await this.channelService.members.addUsersToChannel(users, channel);

    async function getWorkspaceUsers(workspace: Workspace): Promise<User[]> {
      logger.warn("TODO: Implement getting workspace users %o", workspace);
      return [];
    }
  }

  async getDefaultChannels(
    workspace: Pick<DefaultChannelPrimaryKey, "company_id" | "workspace_id">,
  ): Promise<DefaultChannel[]> {
    // TODO: Manage pagination based on this.list
    const result = await this.repository.find(workspace);

    return result.getEntities();
  }
}
