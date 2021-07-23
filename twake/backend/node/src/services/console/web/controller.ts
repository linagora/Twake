import { ConsoleServiceAPI } from "../api";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  AuthRequest,
  AuthResponse,
  ConsoleExecutionContext,
  ConsoleHookBody,
  ConsoleHookBodyContent,
  ConsoleHookCompany,
  ConsoleHookResponse,
  ConsoleHookUser,
} from "../types";
import Company from "../../user/entities/company";
import { CrudExeption } from "../../../core/platform/framework/api/crud-service";
import PasswordEncoder from "../../../utils/password-encoder";
import { AccessToken, JWTObject } from "../../../utils/types";
import AuthServiceAPI from "../../../core/platform/services/auth/provider";
import UserServiceAPI from "../../user/api";
import User from "../../user/entities/user";
import assert from "assert";
import { JWTDataType } from "../../../../../../frontend/src/app/services/JWTStorage";
import { JwtType } from "../../../core/platform/services/types";

export class ConsoleController {
  private passwordEncoder: PasswordEncoder;

  constructor(
    protected consoleService: ConsoleServiceAPI,
    protected authService: AuthServiceAPI,
    protected userService: UserServiceAPI,
  ) {
    this.passwordEncoder = new PasswordEncoder();
  }

  async auth(
    request: FastifyRequest<{ Body: AuthRequest }>,
    reply: FastifyReply,
  ): Promise<AuthResponse> {
    if (request.body.remote_access_token) {
      return { access_token: await this.authByToken(request.body.remote_access_token) };
    } else if (request.body.email && request.body.password) {
      return { access_token: await this.authByPassword(request.body.email, request.body.password) };
    } else {
      throw CrudExeption.badRequest("remote_access_token or email+password are required");
    }
  }

  async tokenRenewal(request: FastifyRequest, reply: FastifyReply): Promise<AuthResponse> {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer")) {
      throw CrudExeption.forbidden("Wrong authorization");
    }

    const token = authHeader.substr(7).trim();

    let data: JWTObject = null;
    try {
      data = this.authService.verifyToken(token);
    } catch (e) {
      throw CrudExeption.forbidden(e.message);
    }

    return { access_token: this.authService.generateJWT(data.sub, data.email) };
  }

  private async validateCompany(content: ConsoleHookBodyContent): Promise<void> {
    if (!content.company || !content.company.details || !content.company.details.code) {
      throw CrudExeption.badRequest("Company is required");
    }
  }

  private async getCompanyDataFromConsole(
    company: ConsoleHookCompany,
  ): Promise<ConsoleHookCompany> {
    assert(company.details, "getCompanyDataFromConsole: company details is missing");
    assert(company.details.code, "getCompanyDataFromConsole: company.details.code is missing");
    return this.consoleService.getClient().fetchCompanyInfo(company.details.code);
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
    const user = await this.consoleService.getClient().updateLocalUserFromConsole(content.user);

    await this.consoleService.processPendingUser(user);
  }

  private async companyRemoved(content: ConsoleHookBodyContent) {
    await this.validateCompany(content);

    assert(content.company, "content.company is missing");
    assert(content.company.details, "content.company.details is missing");
    assert(content.company.details.code, "content.company.details.code is missing");

    await this.consoleService.getClient().removeCompany({
      identity_provider: "console",
      identity_provider_id: content.company.details.code,
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

  private async authByPassword(email: string, password: string): Promise<AccessToken> {
    const user = await this.userService.users.getByEmail(email);
    if (user == null) {
      throw CrudExeption.forbidden("User doesn't exists");
    }
    const [storedPassword, salt] = await this.userService.users.getPassword({ id: user.id });
    if (!(await this.passwordEncoder.isPasswordValid(storedPassword, password, salt))) {
      throw CrudExeption.forbidden("Password doesn't match");
    }
    return this.authService.generateJWT(user.id, user.email_canonical);
  }

  private async authByToken(accessToken: string): Promise<AccessToken> {
    const client = this.consoleService.getClient();
    const userDTO = await client.getUserByAccessToken(accessToken);
    const user = await client.updateLocalUserFromConsole(userDTO);
    if (!user) {
      throw CrudExeption.notFound(`User details not found for access token ${accessToken}`);
    }
    return this.authService.generateJWT(user.id, user.email_canonical);
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
