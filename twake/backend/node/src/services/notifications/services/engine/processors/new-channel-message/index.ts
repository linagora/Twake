import { isDirectChannel } from "../../../../../channels/utils";
import { logger } from "../../../../../../core/platform/framework";
import { MessageNotification } from "../../../../../messages/types";
import { NotificationPubsubHandler, NotificationServiceAPI } from "../../../../api";
import {
  ChannelMemberNotificationPreference,
  ChannelThreadUsers,
  getChannelThreadUsersInstance,
} from "../../../../entities";
import { ChannelMemberNotificationLevel } from "../../../../../channels/types";
import { MentionNotification } from "../../../../types";

export class NewChannelMessageProcessor
  implements NotificationPubsubHandler<MessageNotification, MentionNotification> {
  constructor(readonly service: NotificationServiceAPI) {}

  readonly topics = {
    in: "message:created",
    out: "notification:mentions",
  };

  readonly name = "NewChannelMessageProcessor";

  validate(message: MessageNotification): boolean {
    return !!(message && message.channel_id && message.company_id && message.workspace_id);
  }

  async process(message: MessageNotification): Promise<MentionNotification> {
    logger.info(
      `${this.name} - Processing notification for message ${message.thread_id}/${message.id} in channel ${message.channel_id}`,
    );

    try {
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
      } as MentionNotification;
    } catch (err) {
      logger.error(
        { err },
        `${this.name} - Error while gettings users to notify for message ${message.thread_id}/${message.id} in channel ${message.channel_id}`,
      );
    }
  }

  async getUsersToNotify(message: MessageNotification): Promise<string[]> {
    let channelPreferencesForUsers: ChannelMemberNotificationPreference[];
    const threadId = message.thread_id || message.id;
    const isNewThread = !message.thread_id;
    const isDirect = isDirectChannel({ workspace_id: message.workspace_id });
    const isAllOrHereMention = this.isAllOrHereMention(message);

    const users: ChannelThreadUsers[] = [
      ...[
        getChannelThreadUsersInstance({
          company_id: message.company_id,
          channel_id: message.channel_id,
          thread_id: threadId,
          user_id: message.sender,
        }),
      ],
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

    await this.service.channelThreads.bulkSave(users);

    if (isNewThread || isDirect || isAllOrHereMention) {
      channelPreferencesForUsers = (
        await this.service.channelPreferences.getChannelPreferencesForUsers({
          company_id: message.company_id,
          channel_id: message.channel_id,
        })
      ).getEntities();
    } else {
      channelPreferencesForUsers = await this.getAllInvolvedUsersPreferences({
        channel_id: message.channel_id,
        company_id: message.company_id,
        thread_id: threadId,
      });
    }

    return this.filterMembersToNotify(message, channelPreferencesForUsers).map(m => m.user_id);
  }

  protected filterMembersToNotify(
    message: MessageNotification,
    membersPreferences: ChannelMemberNotificationPreference[],
  ): ChannelMemberNotificationPreference[] {
    const isAllOrHere = this.isAllOrHereMention(message);

    // 1. Remove the ones which does not want any notification (preference === NONE)
    const result = membersPreferences
      .filter(preference => preference.preferences !== ChannelMemberNotificationLevel.NONE)
      //2. Remove the sender
      .filter(preference => preference.user_id + "" !== message.sender + "");

    // 3. Filter based on truth table based on user preferences and current message
    return result.filter(memberPreference => {
      const userIsMentionned = this.userIsMentionned(memberPreference.user_id, message);

      const truthTable = [
        // all
        memberPreference.preferences === ChannelMemberNotificationLevel.ALL,
        // mentions
        memberPreference.preferences === ChannelMemberNotificationLevel.MENTIONS &&
          (isAllOrHere || userIsMentionned),
        // me
        memberPreference.preferences === ChannelMemberNotificationLevel.ME && userIsMentionned,
      ];

      console.log("mentioned: ", truthTable, memberPreference.preferences);

      return truthTable.includes(true);
    });
  }

  /**
   * When message is a response in a thread, get all the users involved in the thread
   */
  protected async getAllInvolvedUsersPreferences(thread: {
    company_id: string;
    channel_id: string;
    thread_id: string;
  }): Promise<ChannelMemberNotificationPreference[]> {
    const usersIds: string[] = (await this.service.channelThreads.getUsersInThread(thread))
      .getEntities()
      .map(thread => thread.user_id);

    return (
      await this.service.channelPreferences.getChannelPreferencesForUsers(
        { company_id: thread.company_id, channel_id: thread.channel_id },
        usersIds,
      )
    ).getEntities();
  }

  private isAllOrHereMention(message: MessageNotification): boolean {
    return (
      message.mentions &&
      message.mentions.specials &&
      (message.mentions.specials.includes("all") || message.mentions.specials.includes("here"))
    );
  }

  private userIsMentionned(user: string, message: MessageNotification) {
    return message?.mentions?.users?.includes(user + "");
  }
}
