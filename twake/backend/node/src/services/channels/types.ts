import { ExecutionContext } from "../../core/platform/framework/api/crud-service";
import { Workspace, Channel } from "../types";

export interface WorkspaceExecutionContext extends ExecutionContext {
  workspace: Workspace;
}

export interface ChannelExecutionContext extends ExecutionContext {
  channel: Channel;
}

export enum ChannelType {
  DIRECT = "direct",
}

export enum ChannelVisibility {
  PRIVATE = "private",
  PUBLIC = "public",
  DIRECT = "direct",
}

export enum ChannelMemberType {
  MEMBER = "member",
  GUEST = "guest",
  BOT = "bot",
}

export enum ChannelMemberNotificationLevel {
  ALL = "all",
  NONE = "none",
  GROUP_MENTIONS = "group_mentions",
  USER_MENTIONS = "user_mentions",
}
