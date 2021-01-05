import "reflect-metadata";
import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import {
  ListResult,
  OperationType,
  SaveResult,
} from "../../../../../../../../src/core/platform/framework/api/crud-service";
import { PubsubServiceAPI } from "../../../../../../../../src/core/platform/services/pubsub/api";
import { ChannelMemberNotificationLevel } from "../../../../../../../../src/services/channels/types";
import { NotificationServiceAPI } from "../../../../../../../../src/services/notifications/api";
import { ChannelMemberNotificationPreference } from "../../../../../../../../src/services/notifications/entities/channel-member-notification-preferences";
import { ChannelThreadUsers } from "../../../../../../../../src/services/notifications/entities/channel-thread-users";
import {
  UserNotificationBadge,
  TYPE as UserNotificationBadgeType,
} from "../../../../../../../../src/services/notifications/entities/user-notification-badges";
import { PushNotificationToUsersMessageProcessor } from "../../../../../../../../src/services/notifications/services/engine/processors/push-to-users/index";
import { MentionNotification } from "../../../../../../../../src/services/notifications/types";

describe("The PushNotificationToUsersMessageProcessor class", () => {
  let channel_id, company_id, workspace_id, thread_id;
  let service: NotificationServiceAPI;
  let pubsubService: PubsubServiceAPI;
  let processor: PushNotificationToUsersMessageProcessor;
  let getUsersInThread;
  let getChannelPreferencesForUsers;
  let saveBadge;

  beforeEach(() => {
    channel_id = "channel_id";
    company_id = "company_id";
    workspace_id = "workspace_id";
    thread_id: "thread_id";

    getUsersInThread = jest.fn();
    getChannelPreferencesForUsers = jest.fn();
    saveBadge = jest.fn();

    setPreferences();
    setUsersInThread();

    pubsubService = ({
      publish: jest.fn(),
    } as unknown) as PubsubServiceAPI;

    service = ({
      badges: {
        save: saveBadge,
      },
      channelPreferences: {
        getChannelPreferencesForUsers,
      },
    } as unknown) as NotificationServiceAPI;

    processor = new PushNotificationToUsersMessageProcessor(service, pubsubService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  function getMessage(newThread: boolean = false): MentionNotification {
    const message = {
      company_id,
      workspace_id,
      channel_id,
      message_id: "id",
      creation_date: Date.now(),
      thread_id,
      mentions: {
        users: [],
      },
    } as MentionNotification;

    if (newThread) {
      // message is new thread when thread_id is not defined
      message.thread_id = undefined;
    }

    return message;
  }

  function setPreferences(preferences: ChannelMemberNotificationPreference[] = []): void {
    getChannelPreferencesForUsers.mockResolvedValue(
      new ListResult<ChannelMemberNotificationPreference>("preferences", preferences),
    );
  }

  function setBadgeResults(badges: UserNotificationBadge[] = []): void {
    badges.forEach(badge =>
      saveBadge.mockResolvedValueOnce(
        new SaveResult(UserNotificationBadgeType, badge, OperationType.CREATE),
      ),
    );
  }

  function setUsersInThread(users: string[] = []) {
    getUsersInThread.mockResolvedValue(
      new ListResult<ChannelThreadUsers>(
        "users",
        users.map(
          user_id =>
            ({
              company_id,
              channel_id,
              workspace_id,
              thread_id,
              user_id,
            } as ChannelThreadUsers),
        ),
      ),
    );
  }

  describe("The process method", () => {
    it("will fail when channel_id is not defined", async () => {
      const message = getMessage();
      delete message.channel_id;

      await expect(processor.process(message)).rejects.toThrowError("Missing required fields");
    });

    it("will fail when company_id is not defined", async () => {
      const message = getMessage();
      delete message.company_id;

      await expect(processor.process(message)).rejects.toThrowError("Missing required fields");
    });

    it("will fail when workspace_id is not defined", async () => {
      const message = getMessage();
      delete message.workspace_id;

      await expect(processor.process(message)).rejects.toThrowError("Missing required fields");
    });

    it("will fail when creation_date is not defined", async () => {
      const message = getMessage();
      delete message.creation_date;

      await expect(processor.process(message)).rejects.toThrowError("Missing required fields");
    });

    it("will do nothing when mentions is not defined", async done => {
      const message = getMessage();
      delete message.mentions;

      await processor.process(message);

      expect(service.channelPreferences.getChannelPreferencesForUsers).not.toBeCalled;
      done();
    });

    it("will do nothing when mentions.users is not defined", async done => {
      const message = getMessage();
      message.mentions = { users: undefined };

      await processor.process(message);

      expect(service.channelPreferences.getChannelPreferencesForUsers).not.toBeCalled;
      done();
    });

    it("will do nothing when mentions.users is empty", async done => {
      const message = getMessage();
      message.mentions = { users: [] };

      await processor.process(message);

      expect(service.channelPreferences.getChannelPreferencesForUsers).not.toBeCalled;
      done();
    });

    it("will keep users who did not read the channel yet", async done => {
      setPreferences([
        {
          channel_id,
          company_id,
          last_read: Date.now(),
          user_id: "1",
          preferences: ChannelMemberNotificationLevel.ALL,
        },
        {
          channel_id,
          company_id,
          last_read: Date.now(),
          user_id: "3",
          preferences: ChannelMemberNotificationLevel.ALL,
        },
      ]);
      setBadgeResults([
        {
          channel_id,
          company_id,
          thread_id,
          user_id: "1",
          workspace_id,
        },
        {
          channel_id,
          company_id,
          thread_id,
          user_id: "3",
          workspace_id,
        },
      ]);
      const lessThan = Date.now();
      const users = ["1", "2", "3", "4"];
      const message = getMessage();
      const channel = {
        channel_id,
        company_id,
      };
      message.mentions = { users };

      await processor.process(message);

      expect(getChannelPreferencesForUsers).toBeCalledWith(channel, users, { lessThan });
      expect(service.badges.save).toBeCalledTimes(2);
      expect(pubsubService.publish).toBeCalledTimes(2);

      done();
    });
  });
});
