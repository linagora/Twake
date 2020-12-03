import { ExecutionContext } from "../../core/platform/framework/api/crud-service";

export type NotificationExecutionContext = ExecutionContext;

export enum ChannelNotificationPreferencesType {
  ALL = "all",
  MENTIONS = "mentions",
  ME = "me",
  NONE = "none",
}
