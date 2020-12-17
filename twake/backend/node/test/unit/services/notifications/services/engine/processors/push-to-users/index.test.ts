import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import {
  ListResult,
  OperationType,
  SaveResult,
} from "../../../../../../../../src/core/platform/framework/api/crud-service";
import { PubsubServiceAPI } from "../../../../../../../../src/core/platform/services/pubsub/api";
import { ChannelMemberNotificationLevel } from "../../../../../../../../src/services/channels/types";
import { MessageNotification } from "../../../../../../../../src/services/messages/types";
import { NotificationServiceAPI } from "../../../../../../../../src/services/notifications/api";
import {
  ChannelMemberNotificationPreference,
  ChannelThreadUsers,
} from "../../../../../../../../src/services/notifications/entities";
import { PushNotificationToUsersMessageProcessor } from "../../../../../../../../src/services/notifications/services/engine/processors/push-to-users/index";
import { MentionNotification } from "../../../../../../../../src/services/notifications/types";
import { ChannelType } from "../../../../../../../../src/services/types";

describe("The PushNotificationToUsersMessageProcessor class", () => {
  let channel_id, company_id, workspace_id, thread_id;
  let service: NotificationServiceAPI;
  let pubsubService: PubsubServiceAPI;
  let processor: PushNotificationToUsersMessageProcessor;
  let getUsersInThread;
  let getChannelPreferencesForUsers;

  beforeEach(() => {
    channel_id = "channel_id";
    company_id = "company_id";
    workspace_id = "workspace_id";

    getUsersInThread = jest.fn();
    getChannelPreferencesForUsers = jest.fn();

    setPreferences();
    setUsersInThread();

    pubsubService = {} as PubsubServiceAPI;

    service = ({
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

    it("will do nothing when mentions is not defined", () => {});

    it("will do nothing when mentions.users is not defined", () => {});

    it("will do nothing when mentions.users is empty", () => {});

    it("will keep users who did not read the channel yet", () => {});

    it("will update the user notification badge for users who did not read the channel yet", () => {});

    it("will publish message in pubsub for users which need to be notified", () => {});
  });
});
