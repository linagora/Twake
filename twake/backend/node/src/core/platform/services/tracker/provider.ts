import Analytics from "analytics-node";
import { TwakeServiceProvider } from "../../framework";

export type IdentityType =
  | { userId: string | number }
  | { userId?: string | number; anonymousId: string | number };

export type IdentifyObjectType = IdentityType & {
  traits?: { [key: string]: unknown };
  timestamp?: Date;
  context?: { [key: string]: unknown };
};

export type TrackedEventType = IdentityType & {
  event:
    | "twake:open"
    | "twake:message_sent"
    | "twake:chanel_create"
    | "twake:chanel_join"
    | "twake:chanel_invite"
    | "console:add_user"
    | "console:signup_email_validation"
    | "console:signup_user_creation";
  properties?: { [key: string]: unknown };
  timestamp?: Date;
  context?: { [key: string]: unknown };
};

export default interface TrackerAPI extends TwakeServiceProvider {
  identify(identity: IdentifyObjectType, callback?: (err: Error) => void): Promise<Analytics>;
  track(tracker: TrackedEventType, callback?: (err: Error) => void): Promise<Analytics>;
}
