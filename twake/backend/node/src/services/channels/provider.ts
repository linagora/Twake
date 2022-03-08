import {
  CRUDService,
  ListResult,
  Paginable,
  Pagination,
  UpdateResult,
} from "../../core/platform/framework/api/crud-service";
import { Initializable, TwakeServiceProvider } from "../../core/platform/framework/api";
import {
  Channel,
  ChannelMember,
  ChannelMemberPrimaryKey,
  ChannelPendingEmails,
  ChannelPendingEmailsPrimaryKey,
  ChannelTab,
  ChannelTabPrimaryKey,
  DefaultChannel,
  DefaultChannelPrimaryKey,
  UsersIncludedChannel,
} from "./entities";
import { ChannelExecutionContext, WorkspaceExecutionContext } from "./types";
import { User } from "../../utils/types";
import { DirectChannel } from "./entities/direct-channel";
import { ChannelActivity } from "./entities/channel-activity";
import { Observable } from "rxjs";
import { ChannelPendingEmailsListQueryParameters } from "./web/types";
import { NewUserInWorkspaceNotification } from "./services/channel/types";
import { ChannelCounterPrimaryKey, ChannelUserCounterType } from "./entities/channel-counters";

export type ChannelPrimaryKey = {
  id?: string;
  company_id?: string;
  workspace_id?: string;
};

export type ChannelActivityMessage = {
  date: number;
  sender: string;
  sender_name: string;
  title: string;
  text: string;
};

export interface ChannelService
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<Channel, ChannelPrimaryKey, WorkspaceExecutionContext> {
  /**
   * Create direct channel
   *
   * @param directChannel
   */
  createDirectChannel(directChannel: DirectChannel): Promise<DirectChannel>;

  /**
   * Get all the direct channels for a user
   * TODO: Return a list of Channel with a list of users
   * @param user
   */
  getDirectChannel(directChannel: DirectChannel): Promise<DirectChannel>;

  /**
   * Get a direct channel in company for given company id and set of users
   */
  getDirectChannelInCompany(companyId: string, users: string[]): Promise<DirectChannel>;

  /**
   * Get  direct channels in company for given company id
   */
  getDirectChannelsInCompany(
    pagination: Pagination,
    company_id: string,
  ): Promise<ListResult<Channel>>;

  /**
   * Get all the direct channels in a company for the given user
   *
   * @param companyId
   * @param userId
   */
  getDirectChannelsForUsersInCompany(companyId: string, userId: string): Promise<DirectChannel[]>;

  /**
   * Mark the channel as read for the given user
   *
   * @param channel
   * @param user
   */
  markAsRead(
    channel: ChannelPrimaryKey,
    user: User,
    context: WorkspaceExecutionContext,
  ): Promise<boolean>;

  /**
   * Mark the channel as unread
   *
   * @param channel
   * @param user
   * @param context
   */
  markAsUnread(
    channel: ChannelPrimaryKey,
    user: User,
    context: WorkspaceExecutionContext,
  ): Promise<boolean>;

  /**
   * Update the last activity for the given channel
   *
   * @param channel The channel to update the last_activity
   */
  updateLastActivity(
    payload: {
      date: number;
      channel: ChannelPrimaryKey;
      message: ChannelActivityMessage;
    },
    context: WorkspaceExecutionContext,
  ): Promise<UpdateResult<ChannelActivity>>;

  /**
   * Get the list of all default channels for the given workspace.
   *
   * @param workspace
   */
  getDefaultChannels(
    workspace: Required<Pick<ChannelPrimaryKey, "company_id" | "workspace_id">>,
    pagination?: Paginable,
  ): Promise<DefaultChannel[]>;

  /**
   * Add user to the default channels of the given workspace
   *
   * @param userId
   * @param workspace
   * @return a list of ChannelMember objects representing where the user has been added.
   *  The list will not contain the ChannelMember of the user is already a member.
   */
  addUserToDefaultChannels(
    user: User,
    workspace: Required<Pick<ChannelPrimaryKey, "company_id" | "workspace_id">>,
  ): Promise<ChannelMember[]>;

  /**
   * Include users to channel itself, also generate the channel name
   * @param channel
   * @param context
   */
  includeUsersInDirectChannel(
    channel: Channel,
    context?: WorkspaceExecutionContext,
  ): Promise<UsersIncludedChannel>;
}
export interface MemberService
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<ChannelMember, ChannelMemberPrimaryKey, ChannelExecutionContext> {
  listUserChannels(
    user: User,
    pagination: Pagination,
    context: WorkspaceExecutionContext,
  ): Promise<ListResult<ChannelMember>>;

  /**
   * Check if user is channel member
   */
  isChannelMember(user: User, channel: Channel): Promise<ChannelMember>;

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
}

export interface TabService
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<ChannelTab, ChannelTabPrimaryKey, ChannelExecutionContext> {}

export default interface ChannelServiceAPI extends TwakeServiceProvider, Initializable {
  channels: ChannelService;
  pendingEmails: ChannelPendingEmailService;
  members: MemberService;
  tabs: TabService;
}

/**
 * Manage default channels entities
 */
export interface DefaultChannelService
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<DefaultChannel, DefaultChannelPrimaryKey, ChannelExecutionContext> {
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

export interface ChannelPendingEmailService
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<ChannelPendingEmails, ChannelPendingEmailsPrimaryKey, ChannelExecutionContext> {
  findPendingEmails(
    pk: ChannelPendingEmailsListQueryParameters,
  ): Promise<ListResult<ChannelPendingEmails>>;

  proccessPendingEmails(
    user: NewUserInWorkspaceNotification,
    workspace: Required<Pick<ChannelPrimaryKey, "company_id" | "workspace_id">>,
  ): Promise<unknown>;
}
