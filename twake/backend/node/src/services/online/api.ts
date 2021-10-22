import { TwakeServiceProvider } from "../../core/platform/framework";

export type UsersOnlineMessage = {
  ids: Array<string>;
};

export interface OnlineServiceAPI extends TwakeServiceProvider {
  isOnline(userId: string): Promise<boolean>;
  setOnline(userIds: Array<string>): Promise<void>;
  setOffline(userIds: Array<string>): Promise<void>;
}
