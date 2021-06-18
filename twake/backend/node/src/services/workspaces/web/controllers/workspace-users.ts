import { CrudController } from "../../../../core/platform/services/webserver/types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
  uuid,
} from "../../../../utils/types";
import { WorkspaceServiceAPI } from "../../api";
import {
  WorkspacePendingUserRequest,
  WorkspaceRequest,
  WorkspaceUserInvitationResponse,
  WorkspaceUserInvitationResponseItem,
  WorkspaceUserObject,
  WorkspaceUsersAddBody,
  WorkspaceUsersBaseRequest,
  WorkspaceUsersInvitationItem,
  WorkspaceUsersInvitationRequestBody,
  WorkspaceUsersRequest,
} from "../types";
import { FastifyReply, FastifyRequest } from "fastify";
import { CompaniesServiceAPI, UsersServiceAPI } from "../../../user/api";

import { WorkspaceUsersExecutionContext } from "../../types";
import WorkspaceUser from "../../entities/workspace_user";
import User from "../../../user/entities/user";
import CompanyUser from "../../../user/entities/company_user";
import { CompanyShort, CompanyUserRole, CompanyUserStatus } from "../../../user/web/types";
import Company from "../../../user/entities/company";
import { chain } from "lodash";
import { CrudExeption } from "../../../../core/platform/framework/api/crud-service";
import WorkspacePendingUser from "../../entities/workspace_pending_users";

export class WorkspaceUsersCrudController
  implements
    CrudController<
      ResourceGetResponse<WorkspaceUserObject>,
      ResourceCreateResponse<WorkspaceUserObject>,
      ResourceListResponse<WorkspaceUserObject>,
      ResourceDeleteResponse
    > {
  constructor(
    protected workspaceService: WorkspaceServiceAPI,
    protected companyService: CompaniesServiceAPI,
    protected usersService: UsersServiceAPI,
  ) {}

  private formatWorkspaceUser(
    workspaceUser: WorkspaceUser,
    currentCompanyId: uuid,
    user: User,
    userCompanies: CompanyUser[],
    companiesMap: Map<string, Company>,
  ): WorkspaceUserObject {
    const res: WorkspaceUserObject = {
      id: workspaceUser.id,
      company_id: currentCompanyId,
      user_id: workspaceUser.userId,
      workspace_id: workspaceUser.workspaceId,
      created_at: workspaceUser.dateAdded,
      role: workspaceUser.role,
      user: {
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
        companies: userCompanies.map(cu => {
          const company = companiesMap.get(cu.group_id);
          return {
            role: cu.role as CompanyUserRole,
            status: "active" as CompanyUserStatus, // FIXME: with real status
            company: {
              id: company.id,
              name: company.name,
              logo: company.logo,
            } as CompanyShort,
          };
        }),
      },
    };

    return res;
  }

  private async getCompaniesMap(companyUsers: CompanyUser[]) {
    const companiesMap: Map<string, Company> = new Map(
      (
        await Promise.all(
          chain(companyUsers)
            .map("group_id")
            .uniq()
            .value()
            .map(companyId => this.companyService.getCompany({ id: companyId })),
        )
      ).map(c => [c.id, c]),
    );
    return companiesMap;
  }

  async list(
    request: FastifyRequest<{ Params: WorkspaceUsersBaseRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceListResponse<WorkspaceUserObject>> {
    const context = getExecutionContext(request);

    const allWorkspaceUsers = await this.workspaceService
      .getUsers({
        workspaceId: context.workspace_id,
      })
      .then(a => a.getEntities());

    const allUsersMap = new Map(
      (
        await Promise.all(allWorkspaceUsers.map(wu => this.usersService.get({ id: wu.userId })))
      ).map(user => [user.id, user]),
    );

    const allCompanyUsers: CompanyUser[] = [].concat(
      ...(await Promise.all(
        allWorkspaceUsers.map(wu => this.usersService.getUserCompanies({ id: wu.userId })),
      )),
    );

    const companyUsersMap = new Map<string, Set<CompanyUser>>();

    for (const companyUser of allCompanyUsers) {
      if (!companyUsersMap.has(companyUser.user_id)) {
        companyUsersMap.set(companyUser.user_id, new Set());
      }
      companyUsersMap.get(companyUser.user_id).add(companyUser);
    }

    const companiesMap = await this.getCompaniesMap(allCompanyUsers);

    const resources = allWorkspaceUsers.map(async wu =>
      this.formatWorkspaceUser(
        wu,
        context.company_id,
        allUsersMap.get(wu.userId),
        Array.from(companyUsersMap.get(wu.userId)),
        companiesMap,
      ),
    );

    return {
      resources: await Promise.all(resources),
    };
  }

  private async getForOne(
    userId: uuid,
    context: WorkspaceUsersExecutionContext,
  ): Promise<WorkspaceUserObject> {
    const workspaceUser = await this.workspaceService.getUser({
      workspaceId: context.workspace_id,
      userId: userId,
    });

    const user = await this.usersService.get({ id: userId });

    if (!user) {
      throw CrudExeption.badRequest("User entity not found");
    }

    const userCompanies: CompanyUser[] = await this.usersService.getUserCompanies({ id: userId });

    const companiesMap = await this.getCompaniesMap(userCompanies);

    return this.formatWorkspaceUser(
      workspaceUser,
      context.company_id,
      user,
      userCompanies,
      companiesMap,
    );
  }

  async get(
    request: FastifyRequest<{ Params: WorkspaceUsersRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<WorkspaceUserObject>> {
    const context = getExecutionContext(request);

    const resource = await this.getForOne(context.user.id, context);

    return {
      resource,
    };
  }

  async save(
    request: FastifyRequest<{ Body: WorkspaceUsersAddBody; Params: WorkspaceUsersRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<WorkspaceUserObject>> {
    const context = getExecutionContext(request);
    const userId = request.params.user_id || request.body.resource.user_id;
    const role = request.body.resource.role;

    const companyUser = await this.companyService.getCompanyUser(
      { id: context.company_id },
      { id: userId },
    );

    if (!companyUser) {
      reply.badRequest(`User ${userId} does not belong to this company`);
      return;
    }

    const workspaceUser = await this.workspaceService.getUser({
      workspaceId: context.workspace_id,
      userId: userId,
    });

    if (request.params.user_id) {
      // ON UPDATE
      if (!workspaceUser) {
        reply.notFound(`User ${userId} not found in this workspace`);
        return;
      }
      await this.workspaceService.updateUserRole(
        { workspaceId: context.workspace_id, userId },
        role,
      );
    } else {
      // ON ADD
      if (!workspaceUser) {
        await this.workspaceService.addUser({ id: context.workspace_id }, { id: userId }, role);
      }
    }

    const resource = await this.getForOne(userId, context);

    reply.status(201);

    return {
      resource: resource,
    };
  }
  async delete(
    request: FastifyRequest<{ Params: WorkspaceUsersRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    const context = getExecutionContext(request);

    const workspaceUser = await this.workspaceService.getUser({
      workspaceId: context.workspace_id,
      userId: request.params.user_id,
    });

    if (!workspaceUser) {
      reply.notFound("Default channel has not been found");
      return;
    }

    await this.workspaceService.removeUser({
      workspaceId: context.workspace_id,
      userId: request.params.user_id,
    });

    reply.status(204);
    return {
      status: "success",
    };
  }

  async invite(
    request: FastifyRequest<{
      Body: WorkspaceUsersInvitationRequestBody;
      Params: WorkspaceUsersRequest;
    }>,
    reply: FastifyReply,
  ): Promise<WorkspaceUserInvitationResponse> {
    const context = getExecutionContext(request);

    const allUsers = this.companyService.getCompanyUser(
      { id: context.company_id },
      { id: context.user.id },
    );

    const usersInTwake: Map<string, User> = new Map(
      await this.usersService
        .getByEmails(request.body.invitations.map(a => a.email))
        .then(users => users.map(user => [user.email_canonical, user])),
    );

    const workspacePendingUsers: Map<string, WorkspacePendingUser> = new Map(
      await this.workspaceService
        .getPendingUsers({
          workspace_id: context.workspace_id,
        })
        .then(pendingUsers => pendingUsers.map(pendingUser => [pendingUser.email, pendingUser])),
    );

    const responses: WorkspaceUserInvitationResponseItem[] = [];

    const putUserToPending = async (invitation: WorkspaceUsersInvitationItem) => {
      await this.workspaceService.addPendingUser(
        {
          workspace_id: context.workspace_id,
          email: invitation.email,
        },
        invitation.role,
        invitation.company_role,
      );
      responses.push({ email: invitation.email, status: "ok" });
    };

    const usersToProcessImmediately = [];

    for (const invitation of request.body.invitations) {
      if (workspacePendingUsers.has(invitation.email)) {
        responses.push({
          email: invitation.email,
          status: "error",
          message: "Pending user already exists",
        });
        continue;
      }

      if (usersInTwake.has(invitation.email)) {
        const user = usersInTwake.get(invitation.email);
        const userInCompany = await this.companyService.getCompanyUser(
          { id: context.company_id },
          { id: user.id },
        );
        if (!userInCompany) {
          // TODO: call console API
        }

        const userInWorkspace = await this.workspaceService.getUser({
          workspaceId: context.workspace_id,
          userId: user.id,
        });

        if (userInWorkspace) {
          responses.push({
            email: invitation.email,
            status: "error",
            message: "User is already in workspace",
          });
          continue;
        }
        usersToProcessImmediately.push(user);
      }
      await putUserToPending(invitation);
    }

    await Promise.all(usersToProcessImmediately.map(user => this.processPendingUser(user)));

    return {
      resources: responses,
    };
  }

  async processPendingUser(user: User): Promise<void> {
    const userCompanies = await this.companyService.getAllForUser(user.id);
    for (const userCompany of userCompanies) {
      const workspaces = await this.workspaceService.getAllForCompany(userCompany.group_id);
      for (const workspace of workspaces) {
        const pendingUserPk = {
          workspace_id: workspace.id,
          email: user.email_canonical,
        };
        const pendingUser = await this.workspaceService.getPendingUser(pendingUserPk);

        if (pendingUser) {
          await this.workspaceService.removePendingUser(pendingUserPk);
          await this.workspaceService.addUser(
            { id: workspace.id },
            { id: user.id },
            pendingUser.role,
          );
        }
      }
    }
  }

  async deletePending(
    request: FastifyRequest<{ Params: WorkspacePendingUserRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    try {
      await this.workspaceService.removePendingUser({
        workspace_id: request.params.workspace_id,
        email: request.params.email,
      });

      return { status: "success" };
    } catch (e) {
      return {
        status: "error",
      };
    }
  }

  async listPending(
    request: FastifyRequest<{ Params: WorkspacePendingUserRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceListResponse<WorkspaceUsersInvitationItem>> {
    const resources = await this.workspaceService.getPendingUsers({
      workspace_id: request.params.workspace_id,
    });

    return {
      resources,
    };
  }
}

function getExecutionContext(
  request: FastifyRequest<{ Params: WorkspaceUsersBaseRequest }>,
): WorkspaceUsersExecutionContext {
  return {
    user: request.currentUser,
    company_id: request.params.company_id,
    workspace_id: request.params.workspace_id,
    url: request.url,
    method: request.routerMethod,
    transport: "http",
  };
}
