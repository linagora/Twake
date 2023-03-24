import { logger } from "../../../core/platform/framework";
import { HookType } from "../../applications-api/types";
import { MessageQueueHandler } from "../../../core/platform/services/message-queue/api";
import { MessageHook } from "../../messages/types";
import gr from "../../global-resolver";
import { ExecutionContext } from "../../../core/platform/framework/api/crud-service";

export class InternalToHooksProcessor implements MessageQueueHandler<MessageHook, void> {
  readonly topics = {
    in: "application:hook:message",
  };

  readonly options = {
    unique: true,
    ack: true,
    queue: "application:hook:message:consumer1",
  };

  readonly name = "Application::InternalToHooksProcessor";

  validate(_: HookType): boolean {
    return true;
  }

  async process(message: HookType, context?: ExecutionContext): Promise<void> {
    logger.debug(`${this.name} - Receive hook of type ${message.type}`);

    const application = await gr.services.applications.marketplaceApps.get(
      {
        id: message.application_id,
      },
      context,
    );

    //TODO Check application access rights (hooks)
    const access = application.access;

    // Check application still exists in the company
    if (
      !(await gr.services.applications.companyApps.get({
        company_id: message.company_id,
        application_id: message.application_id,
        id: undefined,
      }))
    ) {
      logger.error(
        `${this.name} - Application ${message.application_id} not found in company ${message.company_id}`,
      );
      return;
    }

    await gr.services.applications.hooks.notifyApp(
      message.application_id,
      null,
      null,
      "hook",
      null,
      { message },
      null,
      null,
      context,
    );
  }
}
