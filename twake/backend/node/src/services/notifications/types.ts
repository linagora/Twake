import { ExecutionContext } from "../../core/platform/framework/api/crud-service";
import { Channel, ChannelMember } from "../channels/entities";
import { UserNotificationPreferences } from "./entities";
import { PaginationQueryParameters } from "../channels/web/types";
import { specialMention } from "../messages/types";
import { uuid } from "../../utils/types";

export type NotificationConfiguration = {
  push: {
    type: "fcm";
    fcm: {
      endpoint: string;
      key: string;
    };
  };
};

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
  title: string;
  text: string;
};

export type MentionNotificationResult = MentionNotification;

export type ChannelReadMessage = { member: ChannelMember; channel: Channel };
export type ChannelUnreadMessage = ChannelReadMessage;

export type PushNotificationMessage = {
  company_id: uuid;
  workspace_id: uuid | "direct";
  channel_id: uuid;
  message_id: uuid;
  thread_id: uuid;
  badge_value: number;
  user: string;
  title: string;
  text: string;
};
export type PushNotificationMessageResult = PushNotificationMessage;

export class CreateNotificationPreferencesBody {
  resource: Pick<UserNotificationPreferences, "user_id">;
}

export interface NotificationListQueryParameters extends PaginationQueryParameters {
  company_id: uuid;
  workspace_id: uuid | "direct";
  channel_id: uuid;
  thread_id: uuid;
  all_companies: boolean;
}

export interface NotificationListUrlParameters {
  company_id: uuid;
}

export interface NotificationPreferenceListQueryParameters extends PaginationQueryParameters {
  workspace_id: uuid | "all";
  company_id: uuid | "all";
  user_id: uuid;
}
