import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import UserDevice, { TYPE as UserDeviceType } from "../../../../services/user/entities/user_device";
import { NotificationConfiguration, PushNotificationMessage } from "../../types";
import { logger } from "../../../../core/platform/framework/logger";

export class MobilePushService {
  name: "MobilePushService";
  version: "1";
  repository: Repository<UserDevice>;

  constructor(
    private database: DatabaseServiceAPI,
    private pushConfiguration: NotificationConfiguration["push"] | null,
  ) {}

  async init(): Promise<this> {
    this.repository = await this.database.getRepository<UserDevice>(UserDeviceType, UserDevice);
    return this;
  }

  //Fixme: add a bulk system to group requests to fcm
  async push(message: PushNotificationMessage): Promise<void> {
    if (this.pushConfiguration?.type !== "fcm") {
      logger.info(`${this.name} - Push configuration not set to fcm`);
      return;
    }

    const firebaseEndpoint = this.pushConfiguration.fcm.endpoint;
    const firebaseApiKey = this.pushConfiguration.fcm.key;

    // Get devices and loop over devices
    const userId = message.user;
    (await this.repository.find({ user_id: userId })).getEntities().forEach(async device => {
      const deviceIdentifier = device.value;

      const deviceData = {
        company_id: message.company_id,
        workspace_id: message.workspace_id,
        channel_id: message.channel_id,
        message_id: message.message_id,
        thread_id: message.thread_id,
      };

      const pushMessage = {
        data: {
          notification_data: deviceData,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        notification: {
          title: message.title,
          body: message.text,
          sound: "default",
          badge: message.badge_value,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        collapse_key: message.channel_id,
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
    });
  }
}
