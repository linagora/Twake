import { isDirectChannel } from "../../../../channels/utils";
import { logger } from "../../../../../core/platform/framework";
import { MessageNotification } from "../../../../messages/types";
import {
  ChannelMemberNotificationPreference,
  ChannelThreadUsers,
  getChannelThreadUsersInstance,
} from "../../../entities";
import { ChannelMemberNotificationLevel } from "../../../../channels/types";
import { MentionNotification, NotificationMessageQueueHandler } from "../../../types";
import { ChannelType } from "../../../../../utils/types";
import gr from "../../../../global-resolver";
import { ExecutionContext } from "../../../../../core/platform/framework/api/crud-service";

export class NewChannelMessageProcessor
  implements NotificationMessageQueueHandler<MessageNotification, MentionNotification>
{
  readonly topics = {
    in: "message:created",
    out: "notification:mentions",
  };

  readonly options = {
    unique: true,
    ack: true,
    queue: "message:created:consumer2",
  };

  readonly name = "NewChannelMessageProcessor";

  validate(message: MessageNotification): boolean {
    return !!(
      message &&
      message.channel_id &&
      message.company_id &&
      message.workspace_id &&
      message.creation_date > Date.now() - 5 * 60 * 1000
    );
  }

  async process(message: MessageNotification): Promise<MentionNotification> {
    logger.info(
      `${this.name} - Processing notification for message ${message.thread_id}/${message.id} in channel ${message.channel_id}`,
    );
    logger.debug(`${this.name} - Notification message ${JSON.stringify(message)}`);

    try {
      if (message.workspace_id === ChannelType.DIRECT) {
        //Fixme: Monkey fix until we find a way to add user to channel BEFORE to add the badge to this channel
        await new Promise(r => setTimeout(r, 1000));
      }

      const usersToNotify = await this.getUsersToNotify(message);

      if (!usersToNotify?.length) {
        logger.info(
          `${this.name} - No users to notify for message ${message.thread_id}/${message.id} in channel ${message.channel_id}`,
        );
        return;
      }

      logger.info(
        `${this.name} - Users to notify for message ${message.thread_id}/${message.id} in channel ${
          message.channel_id
        } : ['${usersToNotify.join("', '")}']`,
      );

      //Fixme Add user full names if known, need to import microservice
      const users_names = {};
      //Fixme add channel full names, need to import microservice
      const channels_names = {};

      return {
        channel_id: message.channel_id,
        company_id: message.company_id,
        message_id: message.id,
        thread_id: message.thread_id,
        workspace_id: message.workspace_id,
        creation_date: message.creation_date,
        mentions: {
          users: usersToNotify || [],
        },
        object_names: {
          users: users_names,
          channels: channels_names,
        },

        //Temp: should not be used like this when migrating messages to node
        //But we don't remember why, so keeping this like this as it works well
        text: message.text,
        title: message.title,
      } as MentionNotification;
    } catch (err) {
      logger.error(
        { err },
        `${this.name} - Error while gettings users to notify for message ${message.thread_id}/${message.id} in channel ${message.channel_id}`,
      );
    }
  }

  async getUsersToNotify(
    message: MessageNotification,
    context?: ExecutionContext,
  ): Promise<string[]> {
    let channelPreferencesForUsers: ChannelMemberNotificationPreference[];
    const threadId = message.thread_id || message.id;
    const isNewThread = !message.thread_id || `${message.thread_id}` === `${message.id}`;
    const isDirect = isDirectChannel({ workspace_id: message.workspace_id });
    const isAllOrHereMention = this.isAllOrHereMention(message);

    const users: ChannelThreadUsers[] = [
      // message sender is a user in the thread
      ...[
        getChannelThreadUsersInstance({
          company_id: message.company_id,
          channel_id: message.channel_id,
          thread_id: threadId,
          user_id: message.sender,
        }),
      ],

      // mentionned users are users in the thread
      ...(message?.mentions?.users?.length
        ? message.mentions.users.map(user_id =>
            getChannelThreadUsersInstance({
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: threadId,
              user_id,
            }),
          )
        : []),
    ];

    await gr.services.notifications.channelThreads.bulkSave(users, context);

    if (isNewThread || isDirect || isAllOrHereMention) {
      //get the channel level preferences
      channelPreferencesForUsers = (
        await gr.services.notifications.channelPreferences.getChannelPreferencesForUsers({
          company_id: message.company_id,
          channel_id: message.channel_id,
        })
      ).getEntities();

      return this.filterMembersToNotify(message, channelPreferencesForUsers).map(m => m.user_id);
    }

    // get the preferences of the users involved in the thread
    channelPreferencesForUsers = await this.getAllInvolvedUsersPreferences(
      {
        channel_id: message.channel_id,
        company_id: message.company_id,
        thread_id: threadId,
      },
      context,
    );

    return this.filterThreadMembersToNotify(message, channelPreferencesForUsers).map(
      m => m.user_id,
    );
  }

  protected filterMembersToNotify(
    message: MessageNotification,
    membersPreferences: ChannelMemberNotificationPreference[],
  ): ChannelMemberNotificationPreference[] {
    logger.debug(`${this.name} - Filter members ${JSON.stringify(membersPreferences)}`);
    const isAllOrHere = this.isAllOrHereMention(message);
    const isDirect = isDirectChannel({ workspace_id: message.workspace_id });
    return (
      membersPreferences
        // 1. Remove the ones which does not want any notification (preference === NONE)
        .filter(preference => preference.preferences !== ChannelMemberNotificationLevel.NONE)
        // 2. Remove the sender
        .filter(preference => String(preference.user_id) !== String(message.sender))
        // 3. Filter based on truth table based on user preferences and current message
        .filter(memberPreference => {
          const userIsMentionned = this.userIsMentionned(memberPreference.user_id, message);

          const truthTable = [
            isDirect,
            // all
            memberPreference.preferences === ChannelMemberNotificationLevel.ALL,
            // mentions
            memberPreference.preferences === ChannelMemberNotificationLevel.MENTIONS &&
              (isAllOrHere || userIsMentionned),
            // me
            memberPreference.preferences === ChannelMemberNotificationLevel.ME && userIsMentionned,
          ];

          logger.debug(
            `${this.name} - ${
              memberPreference.user_id
            } truth table [direct, all, mentions, me] : ${JSON.stringify(truthTable)}`,
          );

          return truthTable.includes(true);
        })
    );
  }

  protected filterThreadMembersToNotify(
    message: MessageNotification,
    membersPreferences: ChannelMemberNotificationPreference[],
  ): ChannelMemberNotificationPreference[] {
    logger.debug(`${this.name} - Filter thread members ${JSON.stringify(membersPreferences)}`);
    return (
      membersPreferences
        // 1. Remove the ones which does not want any notification (preference === NONE)
        .filter(preference => preference.preferences !== ChannelMemberNotificationLevel.NONE)
        //2. Remove the sender
        .filter(preference => String(preference.user_id) !== String(message.sender))
    );
  }

  /**
   * When message is a response in a thread, get all the users involved in the thread
   * ie the ones who where initially mentionned, mentionned in children messages, and the ones who replied
   */
  protected async getAllInvolvedUsersPreferences(
    thread: {
      company_id: string;
      channel_id: string;
      thread_id: string;
    },
    context: ExecutionContext,
  ): Promise<ChannelMemberNotificationPreference[]> {
    const usersIds: string[] = (
      await gr.services.notifications.channelThreads.getUsersInThread(thread, context)
    )
      .getEntities()
      .map(thread => thread.user_id);

    return (
      await gr.services.notifications.channelPreferences.getChannelPreferencesForUsers(
        { company_id: thread.company_id, channel_id: thread.channel_id },
        usersIds,
        undefined,
        context,
      )
    ).getEntities();
  }

  private isAllOrHereMention(message: MessageNotification): boolean {
    return (
      message.mentions &&
      message.mentions.specials &&
      (message.mentions.specials.includes("all") ||
        message.mentions.specials.includes("here") ||
        message.mentions.specials.includes("channel") ||
        message.mentions.specials.includes("everyone"))
    );
  }

  private userIsMentionned(user: string, message: MessageNotification) {
    return message?.mentions?.users?.includes(String(user));
  }
}
