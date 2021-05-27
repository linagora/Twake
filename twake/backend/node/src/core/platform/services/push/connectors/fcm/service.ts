import { option } from "yargs";
import { logger } from "../../../../framework";
import { PushConfiguration, PushMessageNotification, PushMessageOptions } from "../../types";
import { PushConnector } from "../connector";

export default class FcmPushConnector implements PushConnector {
  name = "FcmPushConnector";

  constructor(readonly configuration: PushConfiguration["fcm"]) {}

  async push(
    devices: string[],
    notification: PushMessageNotification,
    options: PushMessageOptions,
  ): Promise<void> {
    const firebaseEndpoint = this.configuration.endpoint;
    const firebaseApiKey = this.configuration.key;

    for (const deviceIdentifier of devices) {
      const pushMessage = {
        data: {
          notification_data: options.notification_data,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        notification: { ...notification, click_action: "FLUTTER_NOTIFICATION_CLICK" },
        collapse_key: options.collapse_key,
        registration_ids: [deviceIdentifier],
      };

      //Push to fcm
      try {
        const response = await (
          await fetch(firebaseEndpoint, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `key=${firebaseApiKey}`,
            },
            body: JSON.stringify(pushMessage),
          })
        ).json();
        logger.info(`${this.name} - Reply from FCM: ${JSON.stringify(response)}`);
      } catch (e) {
        logger.error(`${this.name} - Error while sending message to FCM`, e);
      }
    }
  }
}
