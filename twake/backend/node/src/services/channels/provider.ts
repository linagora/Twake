import {
  CreateResult,
  CRUDService,
  DeleteResult,
  ExecutionContext,
  ListResult,
  Paginable,
  Pagination,
  SaveResult,
  UpdateResult,
} from "../../core/platform/framework/api/crud-service";
import { Initializable, TwakeServiceProvider } from "../../core/platform/framework/api";
import {
  Channel,
  ChannelMember,
  ChannelMemberPrimaryKey,
  ChannelPendingEmails,
  ChannelPendingEmailsPrimaryKey,
  ChannelPrimaryKey,
  ChannelTab,
  ChannelTabPrimaryKey,
  DefaultChannel,
  DefaultChannelPrimaryKey,
  UserChannel,
  UsersIncludedChannel,
} from "./entities";
import { ChannelExecutionContext, WorkspaceExecutionContext } from "./types";
import { User } from "../../utils/types";
import { DirectChannel } from "./entities/direct-channel";
import { ChannelActivity } from "./entities/channel-activity";
import { Observable } from "rxjs";
import {
  ChannelListOptions,
  ChannelMemberSaveOptions,
  ChannelPendingEmailsListQueryParameters,
} from "./web/types";
import {
  ChannelObject,
  NewUserInWorkspaceNotification,
  SearchChannelOptions,
} from "./services/channel/types";
import { ChannelCounterPrimaryKey } from "./entities/channel-counters";
import { UserPrimaryKey } from "../user/entities/user";
import { WorkspacePrimaryKey } from "../workspaces/entities/workspace";

export interface MemberService extends TwakeServiceProvider, Initializable {
  list(
    pagination: Pagination,
    options: ChannelListOptions,
    context: ChannelExecutionContext,
  ): Promise<ListResult<ChannelMember>>;

  delete(
    pk: ChannelMemberPrimaryKey,
    context: ChannelExecutionContext,
  ): Promise<DeleteResult<ChannelMember>>;

  save(member: ChannelMember, context: ChannelExecutionContext): Promise<SaveResult<ChannelMember>>;

  get(pk: ChannelMemberPrimaryKey): Promise<ChannelMember>;

  listUserChannels(
    user: User,
    pagination: Pagination,
    context: WorkspaceExecutionContext,
  ): Promise<ListResult<ChannelMember>>;

  listAllUserChannelsIds(userId: string, companyId: string, workspaceId: string): Promise<string[]>;

  /**
   * Check if user is channel member
   */
  getChannelMember(
    user: User,
    channel: Partial<Pick<Channel, "company_id" | "workspace_id" | "id">>,
    cacheTtlSec?: number,
  ): Promise<ChannelMember>;

  /**
   * Add a list of users to channel.
   * Should never rejects: If the user is not added, it will not be in the result.member object
   *
   * @param users Users to add
   * @param channel Channel to add users to
   */
  addUsersToChannel(
    users: Pick<User, "id">[],
    channel: ChannelPrimaryKey,
    context?: ExecutionContext,
  ): Promise<ListResult<{ channel: Channel; member?: ChannelMember; err?: Error; added: boolean }>>;

  /**
   * Add the user to a list of channels.
   * Should never rejects: If the user is not added, it will not be in the result.member object
   *
   * @param user the user to add
   * @param channels the channels to add the user to
   */
  addUserToChannels(
    user: Pick<User, "id">,
    channels: ChannelPrimaryKey[],
  ): Promise<ListResult<{ channel: Channel; member?: ChannelMember; err?: Error; added: boolean }>>;

  getUsersCount(counterPk: ChannelCounterPrimaryKey): Promise<number>;

  ensureUserNotInWorkspaceIsNotInChannel(
    userPk: UserPrimaryKey,
    workspacePk: WorkspacePrimaryKey,
  ): Promise<void>;
}

export interface TabService
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<ChannelTab, ChannelTabPrimaryKey, ChannelExecutionContext> {}

/**
 * Manage default channels entities
 */
export interface DefaultChannelService extends TwakeServiceProvider, Initializable {
  create(channel: DefaultChannel): Promise<CreateResult<DefaultChannel>>;
  delete(pk: DefaultChannelPrimaryKey): Promise<DeleteResult<DefaultChannel>>;
  /**
   * Get all the default channels in the given workspace
   *
   * @param workspace the workspace to get default channels from
   */
  getDefaultChannels(
    workspace: Pick<DefaultChannelPrimaryKey, "company_id" | "workspace_id">,
  ): Promise<DefaultChannel[]>;

  /**
   * Get a stream of default channels
   * @param workspace
   */
  getDefaultChannels$(
    workspace: Pick<Channel, "company_id" | "workspace_id">,
    pagination?: Paginable,
  ): Observable<DefaultChannel>;

  /**
   * Add given user to all default channels of the given workspace.
   * If the user is already member of the default channel, it will not be added.
   *
   * @param userId
   * @param workspace
   */
  addUserToDefaultChannels(
    user: User,
    workspace: Required<Pick<DefaultChannelPrimaryKey, "company_id" | "workspace_id">>,
  ): Promise<Array<{ channel: Channel; member?: ChannelMember; err?: Error; added: boolean }>>;
}

export interface ChannelPendingEmailService extends TwakeServiceProvider, Initializable {
  create(pendingEmail: ChannelPendingEmails): Promise<CreateResult<ChannelPendingEmails>>;
  delete(pk: ChannelPendingEmailsPrimaryKey): Promise<DeleteResult<ChannelPendingEmails>>;
  list<ListOptions>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pagination: Pagination,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: ListOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: ChannelExecutionContext,
  ): Promise<ListResult<ChannelPendingEmails>>;

  findPendingEmails(
    pk: ChannelPendingEmailsListQueryParameters,
  ): Promise<ListResult<ChannelPendingEmails>>;

  proccessPendingEmails(
    user: NewUserInWorkspaceNotification,
    workspace: Required<Pick<ChannelPrimaryKey, "company_id" | "workspace_id">>,
  ): Promise<unknown>;
}
