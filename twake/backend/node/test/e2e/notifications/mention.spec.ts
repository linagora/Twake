import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { v1 as uuidv1 } from "uuid";
import { TestPlatform, init } from "../setup";
import ChannelServiceAPI from "../../../src/services/channels/provider";
import { Channel } from "../../../src/services/channels/entities/channel";
import { ChannelMemberNotificationLevel } from "../../../src/services/channels/types";
import { User } from "../../../src/utils/types";
import {
  ChannelUtils,
  get as getChannelUtils,
  getMemberUtils,
  ChannelMemberUtils,
} from "../channels/utils";
import { MessageNotification } from "../../../src/services/messages/types";
import { PubsubServiceAPI } from "../../../src/core/platform/services/pubsub/api";
import { ChannelMember } from "../../../src/services/channels/entities";
import { MentionNotification } from "../../../src/services/notifications/types";

describe("The notification for user mentions", () => {
  let platform: TestPlatform;
  let channelUtils: ChannelUtils;
  let channelMemberUtils: ChannelMemberUtils;
  let channelService: ChannelServiceAPI;
  let pubsubService: PubsubServiceAPI;

  beforeEach(async () => {
    platform = await init({
      services: [
        "webserver",
        "database",
        "search",
        "storage",
        "pubsub",
        "user",
        "websocket",
        "channels",
        "auth",
        "search",
        "applications",
        "files",
        "push",
        "notifications",
        "counter",
        "platform-services",
      ],
    });
    channelUtils = getChannelUtils(platform);
    channelMemberUtils = getMemberUtils(platform);
    channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
    pubsubService = platform.platform.getProvider<PubsubServiceAPI>("pubsub");
  });

  afterEach(async () => {
    await platform?.tearDown();
    platform = null;
  });

  async function createChannel(): Promise<Channel> {
    const channel = channelUtils.getChannel(platform.currentUser.id);
    const creationResult = await channelService.channels.save(
      channel,
      {},
      channelUtils.getContext(),
    );

    return creationResult.entity;
  }

  async function joinChannel(userId: string, channel: Channel): Promise<ChannelMember> {
    const user: User = { id: userId };
    const member = channelMemberUtils.getMember(channel, user);

    const memberCreationResult = await channelService.members.save(
      member,
      {},
      channelUtils.getChannelContext(channel, user),
    );
    return memberCreationResult.entity;
  }

  async function updateNotificationLevel(
    channel: Channel,
    member: ChannelMember,
    level: ChannelMemberNotificationLevel,
  ): Promise<void> {
    member.notification_level = level;
    await channelService.members.save(
      member,
      {},
      channelUtils.getChannelContext(channel, { id: member.user_id }),
    );

    return;
  }

  function pushMessage(message: MessageNotification): Promise<void> {
    return pubsubService.publish<MessageNotification>("message:created", {
      data: message,
    });
  }

  it("should mention all users when preferences are default ones", async done => {
    const threadId = uuidv1();
    const messageId = uuidv1();
    const unknownUser = uuidv1();
    const channel = await createChannel();
    const member = await joinChannel(platform.currentUser.id, channel);
    const member2 = await joinChannel(uuidv1(), channel);
    const member3 = await joinChannel(uuidv1(), channel);

    pubsubService.subscribe<MentionNotification>("notification:mentions", message => {
      if (message.data.message_id === messageId) {
        expect(message.data.mentions.users).not.toContain(member.user_id); //The sender is not in the notified users
        expect(message.data.mentions.users).toContain(member2.user_id);
        expect(message.data.mentions.users).toContain(member3.user_id);
        expect(message.data.mentions.users).not.toContain(unknownUser);
        done();
      }
    });

    pushMessage({
      channel_id: channel.id,
      company_id: channel.company_id,
      creation_date: Date.now(),
      id: messageId,
      sender: platform.currentUser.id,
      thread_id: threadId,
      workspace_id: channel.workspace_id,
      mentions: {
        users: [member.user_id, member2.user_id, unknownUser, member3.user_id],
      },
      title: "",
      text: "",
    });
  });

  it("should not mention user when notification level is set to NONE", async done => {
    const threadId = uuidv1();
    const messageId = uuidv1();
    const unknownUser = uuidv1();
    const channel = await createChannel();
    const member = await joinChannel(platform.currentUser.id, channel);
    const member2 = await joinChannel(uuidv1(), channel);
    const member3 = await joinChannel(uuidv1(), channel);

    await updateNotificationLevel(channel, member2, ChannelMemberNotificationLevel.NONE);

    pubsubService.subscribe<MentionNotification>("notification:mentions", message => {
      if (message.data.message_id === messageId) {
        expect(message.data.mentions.users).not.toContain(member.user_id);
        expect(message.data.mentions.users).toContain(member3.user_id);
        expect(message.data.mentions.users).not.toContain(member2.user_id);
        done();
      }
    });

    pushMessage({
      channel_id: channel.id,
      company_id: channel.company_id,
      creation_date: Date.now(),
      id: messageId,
      sender: platform.currentUser.id,
      thread_id: threadId,
      workspace_id: channel.workspace_id,
      mentions: {
        users: [member.user_id, member2.user_id, unknownUser, member3.user_id],
      },
      title: "",
      text: "",
    });
  });

  it("should mention user when notification level is set to channel mention and notification is for @all", async done => {
    const threadId = uuidv1();
    const messageId = uuidv1();
    const channel = await createChannel();
    const member = await joinChannel(platform.currentUser.id, channel);
    const member2 = await joinChannel(uuidv1(), channel);
    const member3 = await joinChannel(uuidv1(), channel);

    await updateNotificationLevel(channel, member2, ChannelMemberNotificationLevel.MENTIONS);
    await updateNotificationLevel(channel, member3, ChannelMemberNotificationLevel.ME);

    pubsubService.subscribe<MentionNotification>("notification:mentions", message => {
      if (message.data.message_id === messageId) {
        expect(message.data.mentions.users).not.toContain(member.user_id);
        expect(message.data.mentions.users).toContain(member2.user_id);
        expect(message.data.mentions.users).not.toContain(member3.user_id);
        done();
      }
    });

    pushMessage({
      channel_id: channel.id,
      company_id: channel.company_id,
      creation_date: Date.now(),
      id: messageId,
      sender: platform.currentUser.id,
      thread_id: threadId,
      workspace_id: channel.workspace_id,
      mentions: {
        users: [],
        specials: ["all"],
      },
      title: "",
      text: "",
    });
  });

  it("should mention user when notification level is set to channel mention and notification is for @here", async done => {
    const threadId = uuidv1();
    const messageId = uuidv1();
    const channel = await createChannel();
    const member = await joinChannel(platform.currentUser.id, channel);
    const member2 = await joinChannel(uuidv1(), channel);
    const member3 = await joinChannel(uuidv1(), channel);

    await updateNotificationLevel(channel, member2, ChannelMemberNotificationLevel.MENTIONS);
    await updateNotificationLevel(channel, member3, ChannelMemberNotificationLevel.ME);

    pubsubService.subscribe<MentionNotification>("notification:mentions", message => {
      if (message.data.message_id === messageId) {
        expect(message.data.mentions.users).not.toContain(member.user_id);
        expect(message.data.mentions.users).toContain(member2.user_id);
        expect(message.data.mentions.users).not.toContain(member3.user_id);
        done();
      }
    });

    pushMessage({
      channel_id: channel.id,
      company_id: channel.company_id,
      creation_date: Date.now(),
      id: messageId,
      sender: platform.currentUser.id,
      thread_id: threadId,
      workspace_id: channel.workspace_id,
      mentions: {
        users: [],
        specials: ["here"],
      },
      title: "",
      text: "",
    });
  });

  it("should mention user when notification level is set to ME", async done => {
    const threadId = uuidv1();
    const messageId = uuidv1();
    const channel = await createChannel();
    const member = await joinChannel(platform.currentUser.id, channel);
    const member2 = await joinChannel(uuidv1(), channel);
    const member3 = await joinChannel(uuidv1(), channel);

    await updateNotificationLevel(channel, member2, ChannelMemberNotificationLevel.ME);

    pubsubService.subscribe<MentionNotification>("notification:mentions", message => {
      if (message.data.message_id === messageId) {
        expect(message.data.mentions.users).not.toContain(member.user_id);
        expect(message.data.mentions.users).not.toContain(member3.user_id);
        expect(message.data.mentions.users).toContain(member2.user_id);
        done();
      }
    });

    pushMessage({
      channel_id: channel.id,
      company_id: channel.company_id,
      creation_date: Date.now(),
      id: messageId,
      sender: platform.currentUser.id,
      thread_id: threadId,
      workspace_id: channel.workspace_id,
      mentions: {
        users: [member2.user_id],
      },
      title: "",
      text: "",
    });
  });
});
