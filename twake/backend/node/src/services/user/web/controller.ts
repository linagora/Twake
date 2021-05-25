import { FastifyReply, FastifyRequest } from "fastify";
import { ExecutionContext, Pagination } from "../../../core/platform/framework/api/crud-service";

import { CrudController } from "../../../core/platform/services/webserver/types";
import { ResourceListResponse } from "../../../services/types";
import { ResourceDeleteResponse } from "../../../services/types";
import { ResourceCreateResponse } from "../../../services/types";
import { ResourceGetResponse } from "../../../services/types";
import { CompaniesServiceAPI, UsersServiceAPI } from "../api";

import User from "../entities/user";
import {
  UserCompanyObject,
  UserListQueryParameters,
  UserParameters,
  UserObject,
  UserCompanyRole,
  UserCompanyStatus,
  CompanyShort,
  CompanyObject,
  CompanyStatsObject,
  CompanyParameters,
} from "./types";
import assert from "assert";
import Company from "../entities/company";
import CompanyUser from "../entities/company_user";

export class UsersCrudController
  implements
    CrudController<
      ResourceGetResponse<UserObject>,
      ResourceCreateResponse<User>,
      ResourceListResponse<UserObject>,
      ResourceDeleteResponse
    > {
  private companiesCache: Map<string, Company>;

  constructor(protected service: UsersServiceAPI, protected companyService: CompaniesServiceAPI) {
    this.companiesCache = new Map<string, Company>();
  }

  private async retrieveCompany(companyId: string): Promise<Company> {
    const company: Company =
      this.companiesCache.get(companyId) ||
      (await this.companyService.getCompany({ id: companyId }));

    this.companiesCache.set(companyId, company);
    return company;
  }

  private async retrieveUserCompanies(userId: string): Promise<UserCompanyObject[]> {
    const userCompanies = (await this.service.getUserCompanies({ id: userId })).getEntities();

    return await Promise.all(
      userCompanies.map(async uc => {
        const company = await this.retrieveCompany(uc.group_id);

        return {
          role: uc.role as UserCompanyRole,
          status: "active" as UserCompanyStatus, // FIXME: with real status
          company: {
            id: uc.group_id,
            name: company.name,
            logo: company.logo,
          } as CompanyShort,
        } as UserCompanyObject;
      }),
    );
  }

  private async formatUser(user: User, includeCompanies: boolean): Promise<UserObject> {
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
    } as UserObject;

    if (includeCompanies) {
      resUser = {
        ...resUser,
        preference: {
          locale: user.language,
          timezone: user.timezone,
        },

        companies: await this.retrieveUserCompanies(user.id),
      };
    }

    return resUser;
  }

  private formatCompany(company: Company, companyUser?: CompanyUser): CompanyObject {
    const res: CompanyObject = {
      id: company.id,
      name: company.name,
      logo: company.logo,
      plan: company.plan,
      stats: company.stats,
    };

    if (companyUser) {
      res.status = "active"; // FIXME: real status
      res.role = companyUser.role;
    }

    return res;
  }

  async get(
    request: FastifyRequest<{ Params: UserParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<UserObject>> {
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
  ): Promise<ResourceListResponse<UserObject>> {
    const context = getExecutionContext(request);

    const userIds = request.query.user_ids ? request.query.user_ids.split(",") : [];

    const users = await this.service.list(
      new Pagination(request.query.page_token, request.query.limit),
      { userIds },
      context,
    );

    const resUsers = await Promise.all(
      users.getEntities().map(user => this.formatUser(user, request.query.include_companies)),
    );

    // return users;
    return {
      resources: resUsers,
      websockets: [], // empty for now
    };
  }

  async getUserCompanies(
    request: FastifyRequest<{ Params: UserParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceListResponse<CompanyObject>> {
    const context = getExecutionContext(request);

    const user = await this.service.get({ id: request.params.id }, getExecutionContext(request));

    if (!user) {
      reply.notFound(`User ${request.params.id} not found`);
      return;
    }

    const [currentUserCompanies, requestedUserCompanies] = await Promise.all(
      [context.user.id, request.params.id].map(id =>
        this.service.getUserCompanies({ id }).then(a => a.getEntities()),
      ),
    );

    const currentUserCompaniesIds = new Set(currentUserCompanies.map(a => a.group_id));

    const combos = (await Promise.all(
      requestedUserCompanies
        .filter(a => currentUserCompaniesIds.has(a.group_id))
        .map((uc: CompanyUser) => this.retrieveCompany(uc.group_id).then((c: Company) => [c, uc])),
    )) as [Company, CompanyUser][];

    return {
      resources: combos.map(combo => this.formatCompany(...combo)),
      websockets: [],
    };
  }

  async getCompany(
    request: FastifyRequest<{ Params: CompanyParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<CompanyObject>> {
    const company = await this.retrieveCompany(request.params.id);

    return {
      resource: this.formatCompany(company),
      websocket: undefined, // empty for now
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
