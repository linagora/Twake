import { ExecutionContext } from "../../core/platform/framework/api/crud-service";
import { Channel, ChannelMember } from "../channels/entities";
import { PaginationQueryParameters } from "../channels/web/types";
import { specialMention } from "../messages/types";
import { uuid } from "../types";

export type NotificationExecutionContext = ExecutionContext;

export type MentionNotification = {
  company_id: uuid;
  workspace_id: uuid | "direct";
  channel_id: uuid;
  thread_id: uuid;
  message_id: uuid;
  creation_date: number;
  mentions?: {
    users: uuid[];
    specials?: specialMention[];
  };
};

export type MentionNotificationResult = MentionNotification;

export type ChannelReadMessage = { member: ChannelMember; channel: Channel };

export type CounterUpdateMessage = {
  company_id: uuid;
  workspace_id: uuid | "direct";
  channel_id: uuid;
  value: number;
  user: string;
};

export interface NotificationListQueryParameters extends PaginationQueryParameters {
  company_id: uuid;
  workspace_id: uuid | "direct";
  channel_id: uuid;
  thread_id: uuid;
}
