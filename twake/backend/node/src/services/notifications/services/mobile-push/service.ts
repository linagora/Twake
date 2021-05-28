import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import UserDevice, { TYPE as UserDeviceType } from "../../../../services/user/entities/user_device";
import { PushNotificationMessage } from "../../types";
import { logger } from "../../../../core/platform/framework/logger";
import { PushServiceAPI } from "../../../../core/platform/services/push/api";

export class MobilePushService {
  name: "MobilePushService";
  version: "1";
  repository: Repository<UserDevice>;

  constructor(private database: DatabaseServiceAPI, private pushService: PushServiceAPI) {}

  async init(): Promise<this> {
    this.repository = await this.database.getRepository<UserDevice>(UserDeviceType, UserDevice);
    return this;
  }

  //Fixme: add a bulk system to group requests to fcm
  async push(message: PushNotificationMessage): Promise<void> {
    // Get devices and loop over devices
    const userId = message.user;
    const devices = (await this.repository.find({ user_id: userId }))
      .getEntities()
      .map(d => d.value);

    const notification = {
      title: message.title,
      body: message.text,
      sound: "default",
      badge: message.badge_value,
    };

    const options = {
      notification_data: {
        company_id: message.company_id,
        workspace_id: message.workspace_id,
        channel_id: message.channel_id,
        message_id: message.message_id,
        thread_id: message.thread_id,
      },
      collapse_key: message.channel_id,
    };

    await this.pushService.push(devices, notification, options);
  }
}
