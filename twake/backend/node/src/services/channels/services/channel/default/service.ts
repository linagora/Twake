import { from, Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";
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
  CrudExeption,
} from "../../../../../core/platform/framework/api/crud-service";
import { ChannelExecutionContext } from "../../../types";
import DefaultChannelListener from "./listener";
import { getLogger } from "../../../../../core/platform/framework";
import UserServiceAPI from "../../../../user/api";
import { ChannelMember } from "../../../../channels/entities/channel-member";
import WorkspaceUser from "../../../../user/entities/workspace_user";

const logger = getLogger("channel:default");

export default class DefaultChannelServiceImpl implements DefaultChannelService {
  version: "1";
  repository: Repository<DefaultChannel>;
  listener: DefaultChannelListener;

  constructor(
    private database: DatabaseServiceAPI,
    private channelService: ChannelServiceAPI,
    private userService: UserServiceAPI,
  ) {}

  async init(): Promise<this> {
    this.repository = await this.database.getRepository("default_channels", DefaultChannel);
    this.listener = new DefaultChannelListener(this);
    await this.listener.init();
    return this;
  }

  async create(item: DefaultChannel): Promise<CreateResult<DefaultChannel>> {
    await this.repository.save(item);

    // Once a default channel has been successfully created, we have to add all the workspace users as member of the channel
    // There are several ways to do it: Directly or using pubsub
    // Since member service is a channel sub service we can do it directly
    // Another good way to be sure that the user is in default channels is to have an endpoint which ensures this...
    this.onCreated(item);
    return new CreateResult<DefaultChannel>("default_channel", item);
  }

  get(pk: DefaultChannelPrimaryKey): Promise<DefaultChannel> {
    return this.repository.findOne(pk);
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

  async delete(pk: DefaultChannelPrimaryKey): Promise<DeleteResult<DefaultChannel>> {
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
  ): Promise<ListResult<DefaultChannel>> {
    throw new Error("Method not implemented.");
  }

  /**
   * @param channel
   */
  onCreated(channel: DefaultChannel): void {
    logger.debug("Default channel %s has been created", channel.channel_id);
    const subscription = this.addWorkspaceUsersToChannel(channel).subscribe({
      next: member => {
        logger.debug(
          "User %s has been added to default channel %s: %s",
          member.user.userId,
          channel.channel_id,
          member.added,
        );
      },
      error: (err: Error) => {
        logger.error({ err }, "Error while adding user to default channel %s", channel.channel_id);
      },
      complete: () => {
        logger.debug("Workspace users have been added to default channel %s", channel.channel_id);
        subscription.unsubscribe();
      },
    });
  }

  addWorkspaceUsersToChannel(
    channel: DefaultChannelPrimaryKey,
  ): Observable<{ user?: WorkspaceUser; member?: ChannelMember; added: boolean; err?: Error }> {
    const users$ = this.userService.workspaces.getAllUsers({ workspaceId: channel.workspace_id });

    return users$.pipe(
      mergeMap(user =>
        from(
          this.channelService.members
            .addUserToChannels(user, [
              {
                company_id: channel.company_id,
                workspace_id: channel.workspace_id,
                id: channel.channel_id,
              },
            ])
            .then(result => ({
              user,
              member: result.getEntities()[0],
              added: !!result.getEntities()[0],
            }))
            .catch(err => {
              return { user, added: false, err };
            }),
        ),
      ),
    );
  }

  async getDefaultChannels(
    workspace: Pick<DefaultChannelPrimaryKey, "company_id" | "workspace_id">,
  ): Promise<DefaultChannel[]> {
    // TODO: Manage pagination based on this.list
    const result = await this.repository.find(workspace);

    return result.getEntities();
  }
}
