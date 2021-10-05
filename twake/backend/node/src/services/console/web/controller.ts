import { ConsoleServiceAPI } from "../api";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  AuthRequest,
  AuthResponse,
  ConsoleHookBody,
  ConsoleHookBodyContent,
  ConsoleHookCompany,
  ConsoleHookPreferenceContent,
  ConsoleHookResponse,
  ConsoleHookUser,
} from "../types";
import Company from "../../user/entities/company";
import { CrudExeption } from "../../../core/platform/framework/api/crud-service";
import PasswordEncoder from "../../../utils/password-encoder";
import { AccessToken } from "../../../utils/types";
import AuthServiceAPI from "../../../core/platform/services/auth/provider";
import UserServiceAPI from "../../user/api";
import assert from "assert";
import { logger } from "../../../core/platform/framework/logger";

export class ConsoleController {
  private passwordEncoder: PasswordEncoder;

  constructor(
    protected consoleService: ConsoleServiceAPI,
    protected authService: AuthServiceAPI,
    protected userService: UserServiceAPI,
  ) {
    this.passwordEncoder = new PasswordEncoder();
  }

  async auth(request: FastifyRequest<{ Body: AuthRequest }>): Promise<AuthResponse> {
    if (request.body.remote_access_token) {
      return { access_token: await this.authByToken(request.body.remote_access_token) };
    } else if (request.body.email && request.body.password) {
      return { access_token: await this.authByPassword(request.body.email, request.body.password) };
    } else {
      throw CrudExeption.badRequest("remote_access_token or email+password are required");
    }
  }

  async tokenRenewal(request: FastifyRequest): Promise<AuthResponse> {
    return {
      access_token: this.authService.generateJWT(
        request.currentUser.id,
        request.currentUser.email,
        {
          track: request.currentUser?.allow_tracking || false,
          provider_id: request.currentUser.identity_provider_id,
        },
      ),
    };
  }

  async resendVerificationEmail(
    request: FastifyRequest,
  ): Promise<{ success: boolean; email: string }> {
    const user = await this.userService.users.get({ id: request.currentUser.id });

    await this.consoleService.getClient().resendVerificationEmail(user.email_canonical);

    return {
      success: true,
      email: user.email_canonical,
    };
  }

  private async getCompanyDataFromConsole(
    company: ConsoleHookCompany | ConsoleHookCompany["details"],
  ): Promise<ConsoleHookCompany> {
    return this.consoleService
      .getClient()
      .fetchCompanyInfo(
        (company as ConsoleHookCompany["details"])?.code ||
          (company as ConsoleHookCompany)?.details?.code,
      );
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
      logger.info(`Received event ${request.body.type}`);

      switch (request.body.type) {
        case "company_user_added":
        case "company_user_activated":
        case "company_user_updated":
          await this.userAdded(request.body.content as ConsoleHookBodyContent);
          break;
        case "company_user_deactivated":
          await this.userDisabled(request.body.content as ConsoleHookBodyContent);
          break;
        case "user_updated":
          await this.userUpdated((request.body.content as ConsoleHookBodyContent).user._id);
          break;
        case "user_preference_updated":
          await this.userUpdated(
            (request.body.content as unknown as ConsoleHookPreferenceContent).preference.targetCode,
          );
          break;
        case "user_deleted":
          await this.userRemoved(request.body.content as ConsoleHookUser);
          break;
        case "plan_updated":
          await this.planUpdated(request.body.content as ConsoleHookBodyContent);
          break;
        case "company_deleted":
          await this.companyRemoved(request.body.content as ConsoleHookBodyContent);
          break;
        case "company_created":
        case "company_updated":
          await this.companyUpdated(request.body.content as ConsoleHookBodyContent);
          break;
        default:
          logger.info("Event not recognized");
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
    const userDTO = content.user;
    await this.consoleService.getClient().updateLocalUserFromConsole(userDTO._id);
  }

  private async userDisabled(content: ConsoleHookBodyContent): Promise<void> {
    const company = await this.updateCompany(content.company);
    await this.consoleService.getClient().removeCompanyUser(content.user._id, company);
  }

  private async userRemoved(content: ConsoleHookUser): Promise<void> {
    await this.consoleService.getClient().removeUser(content._id);
  }

  private async userUpdated(code: string) {
    const user = await this.consoleService.getClient().updateLocalUserFromConsole(code);
    await this.consoleService.processPendingUser(user);
  }

  private async companyRemoved(content: ConsoleHookBodyContent) {
    assert(content.company, "content.company is missing");
    assert(content.company.details, "content.company.details is missing");
    assert(content.company.details.code, "content.company.details.code is missing");

    await this.consoleService.getClient().removeCompany({
      identity_provider: "console",
      identity_provider_id: content.company.details.code,
    });
  }

  private async companyUpdated(content: ConsoleHookBodyContent) {
    await this.updateCompany(content.company);
  }

  private async planUpdated(content: ConsoleHookBodyContent) {
    await this.updateCompany(content.company);
  }

  private async authByPassword(email: string, password: string): Promise<AccessToken> {
    const user = await this.userService.users.getByEmail(email);
    if (!user) {
      throw CrudExeption.forbidden("User doesn't exists");
    }

    // allow to login in development mode with any password. This can be used to test without the console provider because the password is not stored locally...
    if (process.env.NODE_ENV !== "development") {
      const [storedPassword, salt] = await this.userService.users.getHashedPassword({
        id: user.id,
      });

      if (!(await this.passwordEncoder.isPasswordValid(storedPassword, password, salt))) {
        throw CrudExeption.forbidden("Password doesn't match");
      }
    }

    return this.authService.generateJWT(user.id, user.email_canonical, {
      track: user?.preferences?.allow_tracking || false,
      provider_id: user.identity_provider_id,
    });
  }

  private async authByToken(accessToken: string): Promise<AccessToken> {
    const client = this.consoleService.getClient();
    const userDTO = await client.getUserByAccessToken(accessToken);
    const user = await client.updateLocalUserFromConsole(userDTO._id);
    if (!user) {
      throw CrudExeption.notFound(`User details not found for access token ${accessToken}`);
    }
    return this.authService.generateJWT(user.id, user.email_canonical, {
      track: user?.preferences?.allow_tracking || false,
      provider_id: user.identity_provider_id,
    });
  }
}
