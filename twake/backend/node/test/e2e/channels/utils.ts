import { v4 as uuidv4 } from "uuid";
import { ChannelMember } from "../../../src/services/channels/entities";
import { Channel } from "../../../src/services/channels/entities/channel";
import {
  ChannelExecutionContext,
  ChannelVisibility,
  WorkspaceExecutionContext,
} from "../../../src/services/channels/types";
import { User } from "../../../src/services/types";
import { TestPlatform } from "../setup";

export interface ChannelUtils {
  getContext(user?: User): WorkspaceExecutionContext;
  getChannel(owner?: string): Channel;
  getDirectChannel(owner?: string): Channel;
  getChannelContext(channel: Channel, user: User): ChannelExecutionContext;
}

export interface ChannelMemberUtils {
  getMember(channel: Channel, user: User): ChannelMember;
}

export function getMemberUtils(platform: TestPlatform): ChannelMemberUtils {
  return {
    getMember,
  };

  function getMember(channel: Channel, user: User): ChannelMember {
    const member = new ChannelMember();

    member.company_id = platform.workspace.company_id;
    member.workspace_id = platform.workspace.workspace_id;
    member.channel_id = channel?.id;
    member.user_id = user?.id;

    return member;
  }
}

export function get(platform: TestPlatform): ChannelUtils {
  return {
    getContext,
    getChannel,
    getDirectChannel,
    getChannelContext,
  };

  function getContext(user?: User): WorkspaceExecutionContext {
    return {
      workspace: platform.workspace,
      user: user || platform.currentUser,
    };
  }

  function getChannelContext(channel: Channel, user?: User): ChannelExecutionContext {
    return {
      channel,
      user,
    };
  }

  /**
   * Get a new channel instance
   *
   * @param owner will be a random uuidv4 if not defined
   */
  function getChannel(owner: string = uuidv4()): Channel {
    const channel = new Channel();

    channel.name = "Test Channel";
    channel.company_id = platform.workspace.company_id;
    channel.workspace_id = platform.workspace.workspace_id;
    channel.is_default = false;
    channel.visibility = ChannelVisibility.PUBLIC;
    channel.archived = false;
    channel.owner = owner;

    return channel;
  }

  function getDirectChannel(owner: string = uuidv4()): Channel {
    const channel = getChannel(owner);

    channel.visibility = ChannelVisibility.DIRECT;
    channel.workspace_id = ChannelVisibility.DIRECT;
    channel.name = "A direct channel";

    return channel;
  }
}
