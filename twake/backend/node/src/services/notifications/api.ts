import {
  CRUDService,
  ListResult,
  SaveResult,
} from "../../core/platform/framework/api/crud-service";
import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";
import {
  ChannelMemberNotificationPreference,
  ChannelMemberNotificationPreferencePrimaryKey,
  ChannelThreadUsers,
  ChannelThreadUsersPrimaryKey,
  UserNotificationBadge,
  UserNotificationBadgePrimaryKey,
  UserNotificationPreferences,
  UserNotificationPreferencesPrimaryKey,
} from "./entities";
import { NotificationExecutionContext } from "./types";
import { PubsubHandler } from "../../core/platform/services/pubsub/api";
import { NotificationEngine } from "./services/engine";
import { NotificationPreferencesService } from "./services/preferences/service";

export interface NotificationServiceAPI extends TwakeServiceProvider, Initializable {
  badges: UserNotificationBadgeServiceAPI;
  channelPreferences: ChannelMemberPreferencesServiceAPI;
  channelThreads: ChannelThreadUsersServiceAPI;
  engine: NotificationEngine;
  notificationPreferences: NotificationPreferencesService;
}

export interface UserNotificationBadgeServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<
      UserNotificationBadge,
      UserNotificationBadgePrimaryKey,
      NotificationExecutionContext
    > {
  /**
   * List companies with badge for user.
   * @param companies
   * @param user
   */
  listForUserPerCompanies(user_id: string): Promise<ListResult<UserNotificationBadge>>;

  /**
   * List badges for user in a company. The filter allows to get the badges per workspace/channel/thread when they are defined
   * @param company
   * @param user
   * @param filter
   */
  listForUser(
    company_id: string,
    user_id: string,
    filter: Pick<UserNotificationBadgePrimaryKey, "workspace_id" | "channel_id" | "thread_id">,
  ): Promise<ListResult<UserNotificationBadge>>;

  /**
   * Remove all the badges in channel for user
   * @param
   */
  removeUserChannelBadges(
    filter: Pick<
      UserNotificationBadgePrimaryKey,
      "workspace_id" | "company_id" | "channel_id" | "user_id"
    >,
  ): Promise<number>;
}

export interface ChannelMemberPreferencesServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<
      ChannelMemberNotificationPreference,
      ChannelMemberNotificationPreferencePrimaryKey,
      NotificationExecutionContext
    > {
  /**
   * Get the notification preferences in a channel for a set of users
   *
   * @param channel The channel to get user preferences from
   * @param users The list of users to get preferences from. When not defined, get the preferences for all users in the channel.
   */
  getChannelPreferencesForUsers(
    channel: Pick<ChannelMemberNotificationPreference, "channel_id" | "company_id">,
    users?: string[],
    lastRead?: {
      lessThan: number;
    },
  ): Promise<ListResult<ChannelMemberNotificationPreference>>;

  /**
   * Update the last read value for given user/channel. Will not create the preference if not exists
   *
   * @param channel
   * @param user
   * @param lastRead
   */
  updateLastRead(
    channel: Pick<ChannelMemberNotificationPreference, "channel_id" | "company_id">,
    user: string,
    lastRead: number,
  ): Promise<ChannelMemberNotificationPreference>;
}

export interface ChannelThreadUsersServiceAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<ChannelThreadUsers, ChannelThreadUsersPrimaryKey, NotificationExecutionContext> {
  /**
   * Save a list of users involved in a thread
   *
   * @param users List of users to save
   */
  bulkSave(users: ChannelThreadUsers[]): Promise<SaveResult<ChannelThreadUsers[]>>;

  /**
   * Get all the users involved in a thread
   *
   * @param pk The thread to get users from
   */
  getUsersInThread(pk: ChannelThreadUsersPrimaryKey): Promise<ListResult<ChannelThreadUsers>>;
}

export interface UserNotificationPreferencesAPI
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<
      UserNotificationPreferences,
      UserNotificationPreferencesPrimaryKey,
      NotificationExecutionContext
    > {
  /**
   * Get the user notification preferences
   *
   * @param workspace_id
   * @param company_id
   * @param user_id
   * @param filter
   */
  listPreferences(
    workspace_id: string | "all",
    company_id: string | "all",
    user_id: string,
    filter: Pick<UserNotificationPreferencesPrimaryKey, "user_id">,
  ): Promise<ListResult<UserNotificationPreferences>>;

  /**
   * Save the user notification preferences
   *
   * @param notificationPreferences The preference entity to save
   */
  savePreferences(
    notificationPreferences: UserNotificationPreferences,
  ): Promise<SaveResult<UserNotificationPreferences>>;
}

/**
 * A notification hander is in charge of processing a notification from the pubsub layer and then optionally produces something to be consumed by another handler somewhere in the platform.
 */
export interface NotificationPubsubHandler<InputMessage, OutputMessage>
  extends PubsubHandler<InputMessage, OutputMessage> {
  readonly service: NotificationServiceAPI;
}
