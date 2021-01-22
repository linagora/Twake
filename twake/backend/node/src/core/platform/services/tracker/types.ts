import { Channel as ChannelEntity, ChannelMember } from "../../../../services/channels/entities";
import { User } from "../../../../services/types";
import { MessageNotification } from "../../../../services/messages/types";

export enum TrackerEventActions {
  TWAKE_CHANNEL_CREATED = "twake:channel:created",
  TWAKE_CHANNEL_MEMBER_CREATED = "twake:channel:member:created",
  TWAKE_CHANNEL_MESSAGE_SENT = "twake:channel:message_sent",
  TWAKE_OPEN_CLIENT = "twake:open_client",
  TWAKE_CHANNEL_JOIN = "twake:channel:join",
  TWAKE_CHANNEL_INVITE = "twake:channel:invite",
}

export interface TrackerDataListener {
  user?: User;
  channel?: ChannelEntity;
  member?: ChannelMember;
  message?: MessageNotification;
}

export type IdentityType =
  | { userId: string | number }
  | { userId?: string | number; anonymousId: string | number };

export type IdentifyObjectType = IdentityType & {
  traits?: { [key: string]: unknown };
  timestamp?: Date;
  context?: { [key: string]: unknown };
};

export type TrackedEventType = IdentityType & {
  event: TrackerEventActions;
  properties?: { [key: string]: unknown };
  timestamp?: Date;
  context?: { [key: string]: unknown };
};
