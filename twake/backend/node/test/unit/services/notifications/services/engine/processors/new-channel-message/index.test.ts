import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  ListResult,
  OperationType,
  SaveResult,
} from "../../../../../../../../src/core/platform/framework/api/crud-service";
import { ChannelMemberNotificationLevel } from "../../../../../../../../src/services/channels/types";
import { MessageNotification } from "../../../../../../../../src/services/messages/types";
import {
  ChannelMemberNotificationPreference,
  ChannelThreadUsers,
} from "../../../../../../../../src/services/notifications/entities";
import { ChannelType } from "../../../../../../../../src/utils/types";
import gr from "../../../../../../../../src/services/global-resolver";
import { NewChannelMessageProcessor } from "../../../../../../../../src/services/notifications/services/engine/processors/new-channel-message";

describe("The NewChannelMessageProcessor class", () => {
  let channel_id, company_id, workspace_id, thread_id;
  let service: any;
  let processor: NewChannelMessageProcessor;
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

    service = {
      channelThreads: {
        bulkSave: jest
          .fn()
          .mockResolvedValue(
            new SaveResult<ChannelThreadUsers[]>("thread", [], OperationType.CREATE) as never,
          ),
        getUsersInThread,
      },
      channelPreferences: {
        getChannelPreferencesForUsers,
      },
    };

    gr.services = {
      notifications: service,
    } as any;

    processor = new NewChannelMessageProcessor();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  function getMessage(newThread: boolean = false): MessageNotification {
    const message = {
      company_id,
      workspace_id,
      channel_id,
      id: "id",
      thread_id: "thread_id",
      sender: "sender",
      mentions: {
        users: [],
      },
    } as MessageNotification;

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
    describe("When message is a new thread", () => {
      function setNewThreadPreferences() {
        setPreferences([
          {
            channel_id,
            company_id,
            user_id: "1",
            last_read: Date.now(),
            preferences: ChannelMemberNotificationLevel.ALL,
          },
          {
            channel_id,
            company_id,
            user_id: "2",
            last_read: Date.now(),
            preferences: ChannelMemberNotificationLevel.MENTIONS,
          },
          {
            channel_id,
            company_id,
            user_id: "3",
            last_read: Date.now(),
            preferences: ChannelMemberNotificationLevel.ME,
          },
          {
            channel_id,
            company_id,
            user_id: "4",
            last_read: Date.now(),
            preferences: ChannelMemberNotificationLevel.NONE,
          },
        ]);
      }

      it("should return undefined when there is no one to notify", async done => {
        const message = getMessage(true);
        const result = await processor.process(message);

        expect(service.channelThreads.bulkSave).toBeCalledTimes(1);
        expect(service.channelThreads.bulkSave).toBeCalledWith(
          [
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.id,
              user_id: message.sender,
            },
          ],
          undefined,
        );

        expect(service.channelThreads.getUsersInThread).not.toBeCalled;
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledTimes(1);
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledWith({
          company_id: message.company_id,
          channel_id: message.channel_id,
        });

        expect(result).toBeUndefined();
        done();
      });

      it("without mentions, should get the preferences for all channel members and return only the ones who want to be notified", async done => {
        const message = getMessage(true);
        setNewThreadPreferences();
        const result = await processor.process(message);

        expect(service.channelThreads.bulkSave).toBeCalledTimes(1);
        expect(service.channelThreads.bulkSave).toBeCalledWith(
          [
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.id,
              user_id: message.sender,
            },
          ],
          undefined,
        );

        expect(service.channelThreads.getUsersInThread).not.toBeCalled;
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledTimes(1);
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledWith({
          company_id: message.company_id,
          channel_id: message.channel_id,
        });

        expect(result.mentions.users).toEqual(["1"]);
        done();
      });

      it("with @all mention, should get the preferences for all channel members and return only the ones who want to be notified", async done => {
        const message = getMessage(true);
        message.mentions.specials = ["all"];
        setNewThreadPreferences();
        const result = await processor.process(message);

        expect(service.channelThreads.bulkSave).toBeCalledTimes(1);
        expect(service.channelThreads.bulkSave).toBeCalledWith(
          [
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.id,
              user_id: message.sender,
            },
          ],
          undefined,
        );

        expect(service.channelThreads.getUsersInThread).not.toBeCalled;
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledTimes(1);
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledWith({
          company_id: message.company_id,
          channel_id: message.channel_id,
        });

        expect(result.mentions.users).toEqual(["1", "2"]);
        done();
      });

      it("with @here mentions, should get the preferences for all channel members and return only the ones who want to be notified", async done => {
        const message = getMessage(true);
        message.mentions.specials = ["here"];
        setNewThreadPreferences();
        const result = await processor.process(message);

        expect(service.channelThreads.bulkSave).toBeCalledTimes(1);
        expect(service.channelThreads.bulkSave).toBeCalledWith(
          [
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.id,
              user_id: message.sender,
            },
          ],
          undefined,
        );

        expect(service.channelThreads.getUsersInThread).not.toBeCalled;
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledTimes(1);
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledWith({
          company_id: message.company_id,
          channel_id: message.channel_id,
        });

        expect(result.mentions.users).toEqual(["1", "2"]);
        done();
      });

      it("with @user mentions, should get the preferences for all channel members and return only the ones who want to be notified", async done => {
        const message = getMessage(true);
        message.mentions.users = ["1", "2", "3", "4"];
        setNewThreadPreferences();
        const result = await processor.process(message);

        expect(service.channelThreads.bulkSave).toBeCalledTimes(1);
        expect(service.channelThreads.bulkSave).toBeCalledWith(
          [
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.id,
              user_id: message.sender,
            },
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.id,
              user_id: "1",
            },
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.id,
              user_id: "2",
            },
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.id,
              user_id: "3",
            },
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.id,
              user_id: "4",
            },
          ],
          undefined,
        );

        expect(service.channelThreads.getUsersInThread).not.toBeCalled;
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledTimes(1);
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledWith({
          company_id: message.company_id,
          channel_id: message.channel_id,
        });

        expect(result.mentions.users).toEqual(["1", "2", "3"]);
        done();
      });

      it("When message is a direct message", async done => {
        const message = getMessage(true);
        message.workspace_id = ChannelType.DIRECT;
        message.mentions.users = ["1", "2", "3", "4"];
        setNewThreadPreferences();
        const result = await processor.process(message);

        expect(service.channelThreads.bulkSave).toBeCalledTimes(1);
        expect(service.channelThreads.bulkSave).toBeCalledWith(
          [
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.id,
              user_id: message.sender,
            },
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.id,
              user_id: "1",
            },
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.id,
              user_id: "2",
            },
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.id,
              user_id: "3",
            },
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.id,
              user_id: "4",
            },
          ],
          undefined,
        );

        expect(service.channelThreads.getUsersInThread).not.toBeCalled;
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledTimes(1);
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledWith({
          company_id: message.company_id,
          channel_id: message.channel_id,
        });

        expect(result.mentions.users).toEqual(["1", "2", "3"]);
        done();
      });
    });

    describe("When message is a response to a thread", () => {
      function setThreadResponsePreferences() {
        setPreferences([
          {
            channel_id,
            company_id,
            user_id: "1",
            last_read: Date.now(),
            preferences: ChannelMemberNotificationLevel.ALL,
          },
          {
            channel_id,
            company_id,
            user_id: "2",
            last_read: Date.now(),
            preferences: ChannelMemberNotificationLevel.MENTIONS,
          },
          {
            channel_id,
            company_id,
            user_id: "3",
            last_read: Date.now(),
            preferences: ChannelMemberNotificationLevel.ME,
          },
          {
            channel_id,
            company_id,
            user_id: "4",
            last_read: Date.now(),
            preferences: ChannelMemberNotificationLevel.NONE,
          },
        ]);
      }

      it("should return undefined when there is no one to notify", async done => {
        const message = getMessage();
        setUsersInThread(["1", "2", "3", "4"]);
        const result = await processor.process(message);

        expect(service.channelThreads.bulkSave).toBeCalledTimes(1);
        expect(service.channelThreads.bulkSave).toBeCalledWith(
          [
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.thread_id,
              user_id: message.sender,
            },
          ],
          undefined,
        );

        expect(service.channelThreads.getUsersInThread).toBeCalled;
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledTimes(1);

        expect(result).toBeUndefined();
        done();
      });

      it("without mentions, should get the preferences for all members involved and return only the ones with preference !== NONE", async done => {
        const message = getMessage();
        setUsersInThread(["1", "2", "3", "4"]);
        setThreadResponsePreferences();
        const result = await processor.process(message);

        expect(service.channelThreads.bulkSave).toBeCalledTimes(1);
        expect(service.channelThreads.bulkSave).toBeCalledWith(
          [
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.thread_id,
              user_id: message.sender,
            },
          ],
          undefined,
        );

        expect(service.channelThreads.getUsersInThread).toBeCalled;
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledTimes(1);

        expect(result.mentions.users).toEqual(["1", "2", "3"]);
        done();
      });

      it("with @user mentions, should get the preferences for all members involved and return only the ones who want to be notified", async done => {
        const message = getMessage();
        message.mentions.users = ["1", "2", "3", "4"];
        setUsersInThread(["1", "2", "3", "4"]);
        setThreadResponsePreferences();
        const result = await processor.process(message);

        expect(service.channelThreads.bulkSave).toBeCalledTimes(1);
        expect(service.channelThreads.bulkSave).toBeCalledWith(
          [
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.thread_id,
              user_id: message.sender,
            },
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.thread_id,
              user_id: "1",
            },
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.thread_id,
              user_id: "2",
            },
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.thread_id,
              user_id: "3",
            },
            {
              company_id: message.company_id,
              channel_id: message.channel_id,
              thread_id: message.thread_id,
              user_id: "4",
            },
          ],
          undefined,
        );

        expect(service.channelThreads.getUsersInThread).toBeCalled;
        expect(service.channelPreferences.getChannelPreferencesForUsers).toBeCalledTimes(1);
        expect(result.mentions.users).toEqual(["1", "2", "3"]);
        done();
      });
    });
  });
});
