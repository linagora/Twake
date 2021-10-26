import { TwakeServiceProvider } from "../../core/platform/framework";

export type OnlineTuple = [string, boolean];

export type UsersOnlineMessage = Array<OnlineTuple>;

export type OnlineGetRequest = {
  /* Array of ids to get status */
  data: Array<string>;
};

export type OnlineGetResponse = {
  data: UsersOnlineMessage;
};

export interface OnlineServiceAPI extends TwakeServiceProvider {
  isOnline(userId: string): Promise<boolean>;
  setLastSeenOnline(userIds: Array<string>, lastSeen: number): Promise<void>;
}
