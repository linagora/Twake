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
