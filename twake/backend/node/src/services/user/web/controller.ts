import { FastifyReply, FastifyRequest } from "fastify";
import { ExecutionContext, Pagination } from "../../../core/platform/framework/api/crud-service";

import { CrudController } from "../../../core/platform/services/webserver/types";
import { ResourceListResponse } from "../../../services/types";
import { ResourceDeleteResponse } from "../../../services/types";
import { ResourceCreateResponse } from "../../../services/types";
import { ResourceGetResponse } from "../../../services/types";
import { CompaniesServiceAPI, UsersServiceAPI } from "../api";

import User from "../entities/user";
import { UserListQueryParameters, UserParameters, UserResponse } from "./types";
import assert from "assert";

export class UsersCrudController
  implements
    CrudController<
      ResourceGetResponse<UserResponse>,
      ResourceCreateResponse<User>,
      ResourceListResponse<UserResponse>,
      ResourceDeleteResponse
    > {
  constructor(protected service: UsersServiceAPI, protected companyService: CompaniesServiceAPI) {
    assert(service, "service is not inited");
    assert(companyService, "companyService is not inited");
  }

  private async formatUser(user: User, includeCompanies: boolean): Promise<UserResponse> {
    let resUser = {
      id: user.id,
      provider: user.identity_provider,
      provider_id: user.identity_provider_id,
      email: user.email_canonical,
      is_verified: Boolean(user.mail_verified),
      picture: user.picture,
      first_name: user.first_name,
      last_name: user.last_name,
      created_at: user.creation_date,
      deleted: Boolean(user.deleted),
      status: user.status_icon,
      last_activity: user.last_activity,
    } as UserResponse;

    if (includeCompanies) {
      const userCompanies = (await this.service.getUserCompanies({ id: user.id })).getEntities();

      const companiesCache = {} as { [key: string]: any };

      resUser = {
        ...resUser,
        preference: {
          locale: user.language,
          timezone: user.timezone,
        },

        companies: await Promise.all(
          userCompanies.map(async uc => {
            const company =
              companiesCache[uc.group_id] ||
              (await this.companyService.getCompany({ id: uc.group_id }));
            companiesCache[uc.group_id] = company;

            return {
              role: uc.role,
              status: "", // "active" | "deactivated" | "invited", // FIXME: unknown source
              company: {
                id: uc.group_id,
                name: company.name,
                logo: company.logo,
              },
            };
          }),
        ),
      };
    }

    return resUser;
  }

  async get(
    request: FastifyRequest<{ Params: UserParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<UserResponse>> {
    const context = getExecutionContext(request);
    const user = await this.service.get({ id: request.params.id }, getExecutionContext(request));

    if (!user) {
      reply.notFound(`User ${request.params.id} not found`);

      return;
    }

    return {
      resource: await this.formatUser(user, context.user.id === request.params.id),
      websocket: undefined, // empty for now
    };
  }

  async list(
    request: FastifyRequest<{ Querystring: UserListQueryParameters }>,
  ): Promise<ResourceListResponse<UserResponse>> {
    const pagination = new Pagination(request.query.page_token, "10");
    const context = getExecutionContext(request);

    const userIds = request.query.user_ids ? request.query.user_ids.split(",") : [];

    const users = await this.service.list(
      // new Pagination(request.query.page_token, request.query.limit),
      pagination,
      { userIds },
      context,
    );

    // const companyIds = request.query.company_ids ? request.query.company_ids.split(",") : null;

    const resUsers = await Promise.all(
      users.getEntities().map(user => this.formatUser(user, request.query.include_companies)),
    );

    // return users;
    return {
      resources: resUsers,
      websockets: [], // empty for now
    };
  }
}
function getExecutionContext(request: FastifyRequest): ExecutionContext {
  return {
    user: request.currentUser,
    url: request.url,
    method: request.routerMethod,
    transport: "http",
  };
}
