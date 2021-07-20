import { ConsoleServiceAPI } from "../api";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  ConsoleExecutionContext,
  ConsoleHookBody,
  ConsoleHookBodyContent,
  ConsoleHookCompany,
  ConsoleHookResponse,
} from "../types";
import Company from "../../user/entities/company";
import { CrudExeption } from "../../../core/platform/framework/api/crud-service";

export class ConsoleController {
  constructor(protected consoleService: ConsoleServiceAPI) {}

  private async validateCompany(content: ConsoleHookBodyContent): Promise<void> {
    if (!content.company || !content.company.code) {
      throw CrudExeption.badRequest("Company is required");
    }
  }

  private async getCompanyDataFromConsole(
    company: ConsoleHookCompany,
  ): Promise<ConsoleHookCompany> {
    const consoleResponse = this.consoleService.getClient().fetchCompanyInfo(company.code);
    return consoleResponse;
  }

  private async updateCompany(company: ConsoleHookCompany): Promise<Company> {
    const companyDTO = await this.getCompanyDataFromConsole(company);
    return this.consoleService.getClient().updateLocalCompanyFromConsole(companyDTO);
  }

  async hook(
    request: FastifyRequest<{ Body: ConsoleHookBody }>,
    reply: FastifyReply,
  ): Promise<ConsoleHookResponse> {
    try {
      const context = getExecutionContext(request, this.consoleService);

      switch (request.body.type) {
        case "company_user_added":
        case "company_user_activated":
        case "company_user_updated":
          await this.userAdded(request.body.content);
          break;
        case "company_user_deactivated":
          await this.userRemoved(request.body.content);
          break;
        case "user_updated":
          await this.userUpdated(request.body.content);
          break;
        case "plan_updated":
          await this.planUpdated(request.body.content);
          break;
        case "company_deleted":
          await this.companyRemoved(request.body.content);
          break;
        case "company_created":
        case "company_updated":
          await this.companyUpdated(request.body.content);
          break;
        default:
          reply.notImplemented("Unimplemented");
          return;
      }
    } catch (e) {
      reply.status(400);
      return {
        error: e.message,
      };
    }

    return {
      success: true,
    };
  }

  private async userAdded(content: ConsoleHookBodyContent): Promise<void> {
    throw new Error("Not implemented");

    // await this.consoleService
    //   .getClient()
    //   .addLocalUserFromConsole(content.user._id, company, content.user);
  }

  private async userRemoved(content: ConsoleHookBodyContent): Promise<void> {
    await this.validateCompany(content);
    const company = await this.updateCompany(content.company);
    await this.consoleService.getClient().removeCompanyUser(content.user._id, company);
  }

  private async userUpdated(content: ConsoleHookBodyContent) {
    const user = await this.consoleService
      .getClient()
      .updateLocalUserFromConsole(content.user._id, content.user);

    await this.consoleService.processPendingUser(user);
  }

  private async companyRemoved(content: ConsoleHookBodyContent) {
    await this.validateCompany(content);
    await this.consoleService.getClient().removeCompany({
      identity_provider: "console",
      identity_provider_id: content.company.code,
    });
  }

  private async companyUpdated(content: ConsoleHookBodyContent) {
    await this.validateCompany(content);
    await this.updateCompany(content.company);
  }

  private async planUpdated(content: ConsoleHookBodyContent) {
    await this.validateCompany(content);
    await this.updateCompany(content.company);
  }
}

function getExecutionContext(
  request: FastifyRequest<{ Body: ConsoleHookBody }>,
  service: ConsoleServiceAPI,
): ConsoleExecutionContext {
  return {
    user: request.currentUser,
    url: request.url,
    method: request.routerMethod,
    transport: "http",
    options: service.consoleOptions,
  };
}
