import { FastifyReply, FastifyRequest } from "fastify";
import {
  ExecutionContext,
  ListResult,
  CrudExeption,
  Pagination,
} from "../../../core/platform/framework/api/crud-service";

import { CrudController } from "../../../core/platform/services/webserver/types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../utils/types";
import { CompaniesServiceAPI, UsersServiceAPI } from "../api";

import User from "../entities/user";
import {
  CompanyObject,
  CompanyParameters,
  CompanyShort,
  CompanyUserObject,
  CompanyUserRole,
  CompanyUserStatus,
  DeregisterDeviceParams,
  RegisterDeviceBody,
  RegisterDeviceParams,
  UserListQueryParameters,
  UserObject,
  UserParameters,
} from "./types";
import Company from "../entities/company";
import CompanyUser from "../entities/company_user";
import { WorkspaceUsersRequest } from "../../workspaces/web/types";

export class UsersCrudController
  implements
    CrudController<
      ResourceGetResponse<UserObject>,
      ResourceCreateResponse<User>,
      ResourceListResponse<UserObject>,
      ResourceDeleteResponse
    > {
  constructor(protected service: UsersServiceAPI, protected companyService: CompaniesServiceAPI) {}

  private async formatUser(user: User, includeCompanies: boolean): Promise<UserObject> {
    let resUser = {
      id: user.id,
      provider: user.identity_provider,
      provider_id: user.identity_provider_id,
      email: user.email_canonical,
      username: user.username_canonical,
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
      const userCompanies = await this.service.getUserCompanies({ id: user.id });

      const companies = await Promise.all(
        userCompanies.map(async uc => {
          const company = await this.companyService.getCompany({ id: uc.group_id });
          return {
            role: uc.role as CompanyUserRole,
            status: "active" as CompanyUserStatus, // FIXME: with real status
            company: {
              id: uc.group_id,
              name: company.name,
              logo: company.logo,
            } as CompanyShort,
          } as CompanyUserObject;
        }),
      );

      resUser = {
        ...resUser,
        preference: {
          locale: user.preferences?.language || user.language,
          timezone: user.preferences?.timezone || user.timezone,
          allow_tracking: user.preferences?.allow_tracking || false,
        },

        companies,
      };
    }

    return resUser;
  }

  private formatCompany(
    companyEntity: Company,
    companyUserObject?: CompanyUserObject,
  ): CompanyObject {
    const res: CompanyObject = {
      id: companyEntity.id,
      name: companyEntity.name,
      logo: companyEntity.logo,
      plan: companyEntity.plan,
      stats: companyEntity.stats,
    };

    if (companyUserObject) {
      res.status = "active"; // FIXME: with real status
      res.role = companyUserObject.role;
    }

    return res;
  }

  async get(
    request: FastifyRequest<{ Params: UserParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<UserObject>> {
    const context = getExecutionContext(request);

    let id = request.params.id;
    if (request.params.id === "me") {
      id = context.user.id;
    }

    const user = await this.service.get({ id: id }, getExecutionContext(request));

    if (!user) {
      reply.notFound(`User ${id} not found`);

      return;
    }

    return {
      resource: await this.formatUser(user, context.user.id === id),
      websocket: undefined, // empty for now
    };
  }

  async list(
    request: FastifyRequest<{ Querystring: UserListQueryParameters }>,
  ): Promise<ResourceListResponse<UserObject>> {
    const context = getExecutionContext(request);

    const userIds = request.query.user_ids ? request.query.user_ids.split(",") : [];

    let users: ListResult<User>;
    if (request.query.search) {
      users = await this.service.search(
        new Pagination(request.query.page_token, request.query.limit),
        { search: request.query.search, companyId: request.query.search_company_id },
        context,
      );
    } else {
      users = await this.service.list(
        new Pagination(request.query.page_token, request.query.limit),
        { userIds },
        context,
      );
    }

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

    const [currentUserCompanies, requestedUserCompanies] = (await Promise.all(
      [context.user.id, request.params.id].map(userId =>
        this.service.getUserCompanies({ id: userId }),
      ),
    )) as [CompanyUser[], CompanyUser[]];

    const currentUserCompaniesIds = new Set(currentUserCompanies.map(a => a.group_id));

    const companiesCache = new Map<string, Company>();
    const retrieveCompanyCached = async (companyId: string): Promise<Company> => {
      const company: Company =
        companiesCache.get(companyId) || (await this.companyService.getCompany({ id: companyId }));
      companiesCache.set(companyId, company);
      return company;
    };

    const combos = (await Promise.all(
      requestedUserCompanies
        .filter(a => currentUserCompaniesIds.has(a.group_id))
        .map((uc: CompanyUser) => retrieveCompanyCached(uc.group_id).then((c: Company) => [c, uc])),
    )) as [Company, CompanyUserObject][];

    return {
      resources: combos.map(combo => this.formatCompany(...combo)),
      websockets: [],
    };
  }

  async getCompany(
    request: FastifyRequest<{ Params: CompanyParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<CompanyObject>> {
    const company = await this.companyService.getCompany({ id: request.params.id });

    if (!company) {
      reply.notFound(`User ${request.params.id} not found`);
      return;
    }

    return {
      resource: this.formatCompany(company),
      websocket: undefined, // empty for now
    };
  }

  async registerUserDevice(
    request: FastifyRequest<{ Body: RegisterDeviceBody }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<RegisterDeviceParams>> {
    const resource = request.body.resource;
    if (resource.type !== "FCM") {
      throw CrudExeption.badRequest("Type should be FCM only");
    }
    const context = getExecutionContext(request);

    await this.service.registerUserDevice(
      { id: context.user.id },
      resource.value,
      resource.type,
      resource.version,
    );

    return {
      resource: request.body.resource,
    };
  }

  async getRegisteredDevices(
    request: FastifyRequest<{ Params: UserParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceListResponse<RegisterDeviceParams>> {
    const context = getExecutionContext(request);

    const userDevices = await this.service.getUserDevices({ id: context.user.id });

    return {
      resources: userDevices.map(
        ud => ({ type: ud.type, value: ud.id, version: ud.version } as RegisterDeviceParams),
      ),
    };
  }

  async deregisterUserDevice(
    request: FastifyRequest<{ Params: DeregisterDeviceParams }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    const context = getExecutionContext(request);
    const userDevices = await this.service.getUserDevices({ id: context.user.id });
    const device = await userDevices.find(ud => ud.id == request.params.value);
    if (device) {
      await this.service.deregisterUserDevice(device.id);
    }
    reply.status(204);
    return {
      status: "success",
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
