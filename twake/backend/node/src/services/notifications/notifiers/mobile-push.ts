import { logger } from "../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { Notifier } from ".";

const TOPIC = "notification:push:mobile";

export class MobilePushNotifier implements Notifier {
  private static instance: MobilePushNotifier;

  static get(pubsub: PubsubServiceAPI): Notifier {
    if (!MobilePushNotifier.instance) {
      MobilePushNotifier.instance = new MobilePushNotifier(pubsub);
    }

    return MobilePushNotifier.instance;
  }

  private constructor(private pubsub: PubsubServiceAPI) {}

  async notify<Message>(user: string, message: Message): Promise<void> {
    logger.info(`MobilePushNotifier - Push to mobile ${user}`);
    logger.debug(`MobilePushNotifier - Push to mobile ${user}, ${JSON.stringify(message)}`);

    try {
      await this.pubsub.publish<Message>(TOPIC, {
        data: message,
      });
    } catch (err) {
      logger.warn({ err }, `MobilePushNotifier - Error while sending notification to user ${user}`);
    }
  }
}
