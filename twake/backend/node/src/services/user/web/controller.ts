import { FastifyReply, FastifyRequest } from "fastify";
import {
  CrudExeption,
  ExecutionContext,
  ListResult,
  Pagination,
} from "../../../core/platform/framework/api/crud-service";

import { CrudController } from "../../../core/platform/services/webserver/types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../utils/types";
import UserServiceAPI from "../api";

import User from "../entities/user";
import {
  CompanyObject,
  CompanyParameters,
  CompanyStatsObject,
  CompanyUserObject,
  DeregisterDeviceParams,
  RegisterDeviceBody,
  RegisterDeviceParams,
  UserListQueryParameters,
  UserObject,
  UserParameters,
} from "./types";
import Company from "../entities/company";
import CompanyUser from "../entities/company_user";
import { RealtimeServiceAPI } from "../../../core/platform/services/realtime/api";
import coalesce from "../../../utils/coalesce";
import { getCompanyRooms, getUserRooms } from "../realtime";

export class UsersCrudController
  implements
    CrudController<
      ResourceGetResponse<UserObject>,
      ResourceCreateResponse<UserObject>,
      ResourceListResponse<UserObject>,
      ResourceDeleteResponse
    >
{
  constructor(protected realtime: RealtimeServiceAPI, protected service: UserServiceAPI) {}

  async get(
    request: FastifyRequest<{ Params: UserParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<UserObject>> {
    const context = getExecutionContext(request);

    let id = request.params.id;
    if (request.params.id === "me") {
      id = context.user.id;
    }

    const user = await this.service.users.get({ id: id }, getExecutionContext(request));

    if (!user) {
      throw CrudExeption.notFound(`User ${id} not found`);
    }

    const userObject = await this.service.formatUser(user, {
      includeCompanies: context.user.id === id,
    });

    return {
      resource: userObject,
      websocket: context.user.id
        ? this.realtime.sign(getUserRooms(user), context.user.id)[0]
        : undefined,
    };
  }

  async save(
    request: FastifyRequest<{ Body: { resource: Partial<UserObject> }; Params: UserParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceCreateResponse<UserObject>> {
    const context = getExecutionContext(request);

    const user = await this.service.users.get(
      { id: context.user.id },
      getExecutionContext(request),
    );
    if (!user) {
      reply.notFound(`User ${context.user.id} not found`);
      return;
    }

    user.status_icon = coalesce(request.body.resource, user.status_icon);

    await this.service.users.save(user, {}, context);

    return {
      resource: await this.service.formatUser(user),
    };
  }

  async setPreferences(
    request: FastifyRequest<{ Body: User["preferences"] }>,
  ): Promise<User["preferences"]> {
    const preferences = await this.service.users.setPreferences(
      { id: request.currentUser.id },
      request.body,
    );
    return preferences;
  }

  async list(
    request: FastifyRequest<{ Querystring: UserListQueryParameters }>,
  ): Promise<ResourceListResponse<UserObject>> {
    const context = getExecutionContext(request);

    const userIds = request.query.user_ids ? request.query.user_ids.split(",") : [];

    let users: ListResult<User>;
    if (request.query.search) {
      users = await this.service.users.search(
        new Pagination(request.query.page_token, request.query.limit),
        {
          search: request.query.search,
          companyId: request.query.search_company_id,
        },
        context,
      );
    } else {
      users = await this.service.users.list(
        new Pagination(request.query.page_token, request.query.limit),
        { userIds },
        context,
      );
    }

    const resUsers = await Promise.all(
      users.getEntities().map(user =>
        this.service.formatUser(user, {
          includeCompanies: request.query.include_companies,
        }),
      ),
    );

    // return users;
    return {
      resources: resUsers,
      websockets: this.realtime.sign([], context.user.id), // empty for now
    };
  }

  async getUserCompanies(
    request: FastifyRequest<{ Params: UserParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceListResponse<CompanyObject>> {
    const context = getExecutionContext(request);

    const user = await this.service.users.get({ id: request.params.id }, context);

    if (!user) {
      throw CrudExeption.notFound(`User ${request.params.id} not found`);
    }

    const [currentUserCompanies, requestedUserCompanies] = await Promise.all(
      [context.user.id, request.params.id].map(userId =>
        this.service.users.getUserCompanies({ id: userId }),
      ),
    );

    const currentUserCompaniesIds = new Set(currentUserCompanies.map(a => a.group_id));

    const companiesCache = new Map<string, Company>();
    const retrieveCompanyCached = async (companyId: string): Promise<Company> => {
      const company =
        companiesCache.get(companyId) ||
        (await this.service.companies.getCompany({ id: companyId }));
      companiesCache.set(companyId, company);
      return company;
    };

    const combos = (await Promise.all(
      requestedUserCompanies
        .filter(a => currentUserCompaniesIds.has(a.group_id))
        .map((uc: CompanyUser) =>
          retrieveCompanyCached(uc.group_id).then(async (c: Company) => [
            c,
            uc,
            await this.getCompanyStats(c),
          ]),
        ),
    )) as [Company, CompanyUserObject, CompanyStatsObject][];

    return {
      resources: combos.map(combo => this.service.formatCompany(...combo)),
      websockets: this.realtime.sign([], context.user.id),
    };
  }

  async getCompany(
    request: FastifyRequest<{ Params: CompanyParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<CompanyObject>> {
    const company = await this.service.companies.getCompany({ id: request.params.id });
    const context = getExecutionContext(request);

    if (!company) {
      throw CrudExeption.notFound(`Company ${request.params.id} not found`);
    }

    return {
      resource: this.service.formatCompany(company, null, await this.getCompanyStats(company)),
      websocket: context.user?.id
        ? this.realtime.sign(getCompanyRooms(company), context.user.id)[0]
        : undefined,
    };
  }

  private async getCompanyStats(company: Company): Promise<CompanyStatsObject> {
    return {
      created_at: company.dateAdded,
      total_members: company.stats?.total_members || 0,
      total_guests: company.stats?.total_guests || 0,
      total_messages: await this.service.statistics.get(company.id, "messages"),
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

    await this.service.users.registerUserDevice(
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

    const userDevices = await this.service.users.getUserDevices({ id: context.user.id });

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
    const userDevices = await this.service.users.getUserDevices({ id: context.user.id });
    const device = await userDevices.find(ud => ud.id == request.params.value);
    if (device) {
      await this.service.users.deregisterUserDevice(device.id);
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
