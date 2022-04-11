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

    const application = await this.applicationService.applications.get({
      id: message.application_id,
    });

    //TODO Check application access rights (hooks)
    const access = application.access;

    // Check application still exists in the company
    if (
      !(await this.applicationService.companyApplications.get({
        company_id: message.company_id,
        application_id: message.application_id,
      }))
    ) {
      logger.error(
        `${this.name} - Application ${message.application_id} not found in company ${message.company_id}`,
      );
      return;
    }

    await this.applicationService.hooks.notifyApp(
      message.application_id,
      null,
      null,
      "hook",
      null,
      { message },
      null,
      null,
    );
  }
}
