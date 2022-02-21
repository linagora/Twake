import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
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
import {
  IncomingPubsubMessage,
  PubsubServiceAPI,
} from "../../../src/core/platform/services/pubsub/api";
import { ChannelMember } from "../../../src/services/channels/entities";
import { MentionNotification } from "../../../src/services/notifications/types";
import { threadId } from "worker_threads";

describe("The notification for user mentions", () => {
  let platform: TestPlatform;
  let channelUtils: ChannelUtils;
  let channelMemberUtils: ChannelMemberUtils;
  let channelService: ChannelServiceAPI;
  let pubsubService: PubsubServiceAPI;
  let pubsubHandler: (message: IncomingPubsubMessage<MentionNotification>) => void = _ => {};

  beforeAll(async () => {
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
        "statistics",
        "platform-services",
      ],
    });
    channelUtils = getChannelUtils(platform);
    channelMemberUtils = getMemberUtils(platform);
    channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
    pubsubService = platform.platform.getProvider<PubsubServiceAPI>("pubsub");
    pubsubService.subscribe<MentionNotification>("notification:mentions", message => {
      pubsubHandler(message);
    });
  });

  afterAll(async () => {
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

  async function joinChannel(
    userId: string,
    channel: Channel,
    notificationLevel?: ChannelMemberNotificationLevel,
  ): Promise<ChannelMember> {
    const user: User = { id: userId };
    const member = channelMemberUtils.getMember(channel, user);

    if (notificationLevel) member.notification_level = notificationLevel;

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

  it("should mention all users when preferences are MENTION", async done => {
    const threadId = uuidv1();
    const messageId = uuidv1();
    const unknownUser = uuidv1();
    const channel = await createChannel();
    const member = await joinChannel(
      platform.currentUser.id,
      channel,
      ChannelMemberNotificationLevel.MENTIONS,
    );
    const member2 = await joinChannel(uuidv1(), channel, ChannelMemberNotificationLevel.MENTIONS);
    const member3 = await joinChannel(uuidv1(), channel, ChannelMemberNotificationLevel.MENTIONS);

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
      title: "test",
      text: "should mention all users when preferences are MENTION ones",
    });

    const message = await new Promise<IncomingPubsubMessage<MentionNotification>>(
      resolve => (pubsubHandler = resolve),
    );
    expect(message.data.mentions.users).not.toContain(member.user_id); //The sender is not in the notified users
    expect(message.data.mentions.users).toContain(member2.user_id);
    expect(message.data.mentions.users).toContain(member3.user_id);
    expect(message.data.mentions.users).not.toContain(unknownUser);

    done();
  });

  it("should mention all users when preferences are default ones (ALL)", async done => {
    const messageId = uuidv1();
    const unknownUser = uuidv1();
    const channel = await createChannel();
    const member = await joinChannel(platform.currentUser.id, channel);
    const member2 = await joinChannel(uuidv1(), channel);
    const member3 = await joinChannel(uuidv1(), channel);

    pushMessage({
      channel_id: channel.id,
      company_id: channel.company_id,
      creation_date: Date.now(),
      id: messageId,
      sender: platform.currentUser.id,
      thread_id: messageId, //Only thread initial messages generate notifications
      workspace_id: channel.workspace_id,
      title: "test",
      text: "should mention all users when preferences are default ones (ALL)",
    });

    const message = await new Promise<IncomingPubsubMessage<MentionNotification>>(
      resolve => (pubsubHandler = resolve),
    );
    expect(message.data.mentions.users).not.toContain(member.user_id); //The sender is not in the notified users
    expect(message.data.mentions.users).toContain(member2.user_id);
    expect(message.data.mentions.users).toContain(member3.user_id);
    expect(message.data.mentions.users).not.toContain(unknownUser);

    done();
  });

  it("should not mention users with preferences ALL for replies of threads there are not member of", async done => {
    const threadId = uuidv1();
    const messageId = uuidv1();
    const channel = await createChannel();
    const member = await joinChannel(platform.currentUser.id, channel);
    const member2 = await joinChannel(uuidv1(), channel);
    const member3 = await joinChannel(uuidv1(), channel);

    pushMessage({
      channel_id: channel.id,
      company_id: channel.company_id,
      creation_date: Date.now(),
      id: messageId,
      sender: platform.currentUser.id,
      thread_id: threadId,
      workspace_id: channel.workspace_id,
      mentions: {
        users: [member.user_id, member2.user_id],
      },
      title: "test",
      text: "should mention all users when preferences are default ones (ALL)",
    });

    const message = await new Promise<IncomingPubsubMessage<MentionNotification>>(
      resolve => (pubsubHandler = resolve),
    );
    expect(message.data.mentions.users).not.toContain(member.user_id); //The sender is not in the notified users
    expect(message.data.mentions.users).not.toContain(member3.user_id);

    done();
  });

  it("should not mention user when notification level is set to NONE", async done => {
    const threadId = uuidv1();
    const messageId = uuidv1();
    const unknownUser = uuidv1();
    const channel = await createChannel();
    const member = await joinChannel(
      platform.currentUser.id,
      channel,
      ChannelMemberNotificationLevel.MENTIONS,
    );
    const member2 = await joinChannel(uuidv1(), channel, ChannelMemberNotificationLevel.NONE);
    const member3 = await joinChannel(uuidv1(), channel, ChannelMemberNotificationLevel.MENTIONS);

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
      title: "test",
      text: "should not mention user when notification level is set to NONE",
    });

    const message = await new Promise<IncomingPubsubMessage<MentionNotification>>(
      resolve => (pubsubHandler = resolve),
    );
    expect(message.data.mentions.users).not.toContain(member.user_id);
    expect(message.data.mentions.users).toContain(member3.user_id);
    expect(message.data.mentions.users).not.toContain(member2.user_id);

    done();
  });

  it("should mention user when notification level is set to channel mention and notification is for @all", async done => {
    const threadId = uuidv1();
    const messageId = uuidv1();
    const channel = await createChannel();
    const member = await joinChannel(
      platform.currentUser.id,
      channel,
      ChannelMemberNotificationLevel.MENTIONS,
    );
    const member2 = await joinChannel(uuidv1(), channel, ChannelMemberNotificationLevel.MENTIONS);
    const member3 = await joinChannel(uuidv1(), channel, ChannelMemberNotificationLevel.ME);

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
      title: "test",
      text: "should mention user when notification level is set to channel mention and notification is for @all",
    });

    const message = await new Promise<IncomingPubsubMessage<MentionNotification>>(
      resolve => (pubsubHandler = resolve),
    );
    expect(message.data.mentions.users).not.toContain(member.user_id);
    expect(message.data.mentions.users).toContain(member2.user_id);
    expect(message.data.mentions.users).not.toContain(member3.user_id);

    done();
  });

  it("should mention user when notification level is set to channel mention and notification is for @here", async done => {
    const threadId = uuidv1();
    const messageId = uuidv1();
    const channel = await createChannel();
    const member = await joinChannel(platform.currentUser.id, channel);
    const member2 = await joinChannel(uuidv1(), channel, ChannelMemberNotificationLevel.MENTIONS);
    const member3 = await joinChannel(uuidv1(), channel, ChannelMemberNotificationLevel.ME);

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
      title: "test",
      text: "should mention user when notification level is set to channel mention and notification is for @here",
    });

    const message = await new Promise<IncomingPubsubMessage<MentionNotification>>(
      resolve => (pubsubHandler = resolve),
    );

    //Sender dont get notified
    expect(message.data.mentions.users).not.toContain(member.user_id);
    expect(message.data.mentions.users).toContain(member2.user_id);
    expect(message.data.mentions.users).not.toContain(member3.user_id);

    done();
  });

  it("should mention user when notification level is set to ME and updated notification later", async done => {
    const threadId = uuidv1();
    const messageId = uuidv1();
    const channel = await createChannel();
    const member = await joinChannel(
      platform.currentUser.id,
      channel,
      ChannelMemberNotificationLevel.NONE,
    );
    const member2 = await joinChannel(uuidv1(), channel, ChannelMemberNotificationLevel.NONE);
    const member3 = await joinChannel(uuidv1(), channel, ChannelMemberNotificationLevel.NONE);

    await new Promise(resolve => setTimeout(resolve, 1000)); //Wait for the channel members to be created

    await updateNotificationLevel(channel, member, ChannelMemberNotificationLevel.MENTIONS);
    await updateNotificationLevel(channel, member2, ChannelMemberNotificationLevel.ME);
    await updateNotificationLevel(channel, member3, ChannelMemberNotificationLevel.MENTIONS);

    await new Promise(resolve => setTimeout(resolve, 1000)); //Wait for the channel members to be created

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
      title: "test",
      text: "should mention user when notification level is set to ME and updated notification later",
    });

    const message = await new Promise<IncomingPubsubMessage<MentionNotification>>(
      resolve => (pubsubHandler = resolve),
    );
    expect(message.data.mentions.users).not.toContain(member.user_id);
    expect(message.data.mentions.users).not.toContain(member3.user_id);
    expect(message.data.mentions.users).toContain(member2.user_id);

    done();
  });
});
