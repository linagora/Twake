import { logger, TwakeContext } from "../../../../core/platform/framework";
import { NotificationEngineAPI, NotificationServiceAPI, NotificationHandler } from "../../api";
import { NewChannelMessageProcessor } from "./processors/new-channel-message";

/**
 * The notification engine is in charge of processing data and delivering user notifications on the right place
 */
export class NotificationEngine implements NotificationEngineAPI {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlers: Map<string, NotificationHandler<any, any>> = new Map();

  constructor(private service: NotificationServiceAPI) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(handler: NotificationHandler<any, any>): void {
    if (!handler) {
      return;
    }
    this.handlers.set(handler.getName(), handler);
  }

  async init(context: TwakeContext): Promise<this> {
    this.register(new NewChannelMessageProcessor(this.service));

    await Promise.all(
      Array.from(this.handlers.values()).map(async handler => {
        logger.info(`Initializing notification handler ${handler.getName()}`);
        await handler.init(context);
      }),
    );

    return this;
  }
}
