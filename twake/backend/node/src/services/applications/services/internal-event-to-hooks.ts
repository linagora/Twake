import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";
import { ApplicationServiceAPI } from "../api";
import { logger } from "../../../core/platform/framework";
import { HookType } from "../../applicationsapi/types";
import { PubsubHandler } from "../../../core/platform/services/pubsub/api";
import { MessageHook } from "../../messages/types";

export class InternalToHooksProcessor implements PubsubHandler<MessageHook, void> {
  readonly topics = {
    in: "application:hook:message",
  };

  readonly options = {
    unique: true,
    ack: true,
    queue: "application:hook:message:consumer1",
  };

  readonly name = "Application::InternalToHooksProcessor";

  constructor(
    readonly platformService: PlatformServicesAPI,
    readonly applicationService: ApplicationServiceAPI,
  ) {}

  validate(_: HookType): boolean {
    return true;
  }

  async process(message: HookType): Promise<void> {
    logger.debug(`${this.name} - Receive hook of type ${message.type}`);

    //TODO Check application access rights (hooks)

    await this.applicationService.hooks.notifyApp(
      message.application_id,
      null,
      null,
      "hook",
      null,
      { message },
    );
  }
}
