import { TwakeServiceProvider } from "../../framework";
import { PushMessageNotification, PushMessageOptions } from "./types";

export interface PushServiceAPI extends TwakeServiceProvider {
  push(
    devices: string[],
    notification: PushMessageNotification,
    options?: PushMessageOptions,
  ): Promise<void>;
}
