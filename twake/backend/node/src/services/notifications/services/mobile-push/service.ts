import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { PushNotificationMessage } from "../../types";
import { PushServiceAPI } from "../../../../core/platform/services/push/api";
import User, { TYPE as UserType } from "../../../user/entities/user";
import { CrudExeption } from "../../../../core/platform/framework/api/crud-service";

export class MobilePushService {
  name: "MobilePushService";
  version: "1";
  userRepository: Repository<User>;

  constructor(private database: DatabaseServiceAPI, private pushService: PushServiceAPI) {}

  async init(): Promise<this> {
    this.userRepository = await this.database.getRepository<User>(UserType, User);
    return this;
  }

  //Fixme: add a bulk system to group requests to fcm
  async push(message: PushNotificationMessage): Promise<void> {
    // Get devices and loop over devices
    const userId = message.user;

    const user = await this.userRepository.findOne({ id: userId });

    if (!user) {
      throw CrudExeption.notFound(`User ${userId} not found`);
    }

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

    await this.pushService.push(user.devices, notification, options);
  }
}
