import { FastifyInstance, FastifyPluginCallback, FastifyRequest } from "fastify";
import { WorkspacesCrudController } from "./controllers/workspaces";
import {
  createWorkspaceSchema,
  createWorkspaceUserSchema,
  deleteWorkspaceInviteTokenSchema,
  deleteWorkspacePendingUsersSchema,
  deleteWorkspaceUserSchema,
  getWorkspaceInviteTokenSchema,
  getWorkspacePendingUsersSchema,
  getWorkspaceSchema,
  getWorkspacesSchema,
  getWorkspaceUserSchema,
  getWorkspaceUsersSchema,
  inviteWorkspaceUserSchema,
  joinInviteTokenSchema,
  postWorkspaceInviteTokenSchema,
  updateWorkspaceSchema,
  updateWorkspaceUserSchema,
} from "./schemas";

import WorkspaceServicesAPI from "../api";
import { WorkspaceBaseRequest, WorkspaceUsersBaseRequest, WorkspaceUsersRequest } from "./types";
import { WorkspaceUsersCrudController } from "./controllers/workspace-users";
import { hasWorkspaceAdminLevel, hasWorkspaceMemberLevel } from "../../../utils/workspace";
import { WorkspaceInviteTokensCrudController } from "./controllers/workspace-invite-tokens";
import WorkspaceUser from "../entities/workspace_user";

const workspacesUrl = "/companies/:company_id/workspaces";
const workspacePendingUsersUrl = "/companies/:company_id/workspaces/:workspace_id/pending";
const workspaceUsersUrl = "/companies/:company_id/workspaces/:workspace_id/users";
const workspaceInviteTokensUrl = "/companies/:company_id/workspaces/:workspace_id/users/tokens";

const routes: FastifyPluginCallback<{
  service: WorkspaceServicesAPI;
}> = (fastify: FastifyInstance, options, next) => {
  const workspacesController = new WorkspacesCrudController(
    options.service.workspaces,
    options.service.companies,
  );

  const workspaceUsersController = new WorkspaceUsersCrudController(
    options.service.workspaces,
    options.service.companies,
    options.service.users,
    options.service.console,
  );

  const workspaceInviteTokensController = new WorkspaceInviteTokensCrudController(options.service);

  const accessControl = async () => {
    // TODO
    const authorized = true;

    if (!authorized) {
      throw fastify.httpErrors.badRequest("Invalid company/workspace");
    }
  };

  const companyCheck = async (request: FastifyRequest<{ Params: WorkspaceBaseRequest }>) => {
    const companyId = request.params.company_id;
    const userId = request.currentUser.id;

    const companyUser = await options.service.companies.getCompanyUser(
      { id: companyId },
      { id: userId },
    );

    if (!companyUser) {
      const company = await options.service.companies.getCompany({ id: companyId });
      if (!company) {
        throw fastify.httpErrors.notFound(`Company ${companyId} not found`);
      }
      throw fastify.httpErrors.forbidden("User does not belong to this company");
    }
  };

  const checkWorkspace = async (request: FastifyRequest<{ Params: WorkspaceUsersBaseRequest }>) => {
    const workspace = await options.service.workspaces.get({
      company_id: request.params.company_id,
      id: request.params.workspace_id,
    });
    if (!workspace) {
      throw fastify.httpErrors.notFound(`Workspace ${request.params.workspace_id} not found`);
    }
  };

  const checkUserWorkspace = async (
    request: FastifyRequest<{ Params: WorkspaceUsersRequest }>,
  ): Promise<WorkspaceUser> => {
    const companyId = request.params.workspace_id;
    const workspaceId = request.params.workspace_id;
    const userId = request.currentUser.id;
    const workspaceUser = await options.service.workspaces.getUser({ workspaceId, userId });

    if (!workspaceUser) {
      const workspace = await options.service.workspaces.get({
        company_id: companyId,
        id: workspaceId,
      });
      if (!workspace) {
        throw fastify.httpErrors.notFound(`Workspace ${workspaceId} not found`);
      } else {
        throw fastify.httpErrors.forbidden("Not member of the workspace");
      }
    }
    return workspaceUser;
  };

  const checkUserIsWorkspaceAdmin = async (
    request: FastifyRequest<{ Params: WorkspaceUsersRequest }>,
  ) => {
    const workspaceUser = await checkUserWorkspace(request);
    if (!hasWorkspaceAdminLevel(workspaceUser.role)) {
      throw fastify.httpErrors.forbidden("Only workspace moderator can perform this action");
    }
  };

  const checkUserIsWorkspaceMember = async (
    request: FastifyRequest<{ Params: WorkspaceUsersRequest }>,
  ) => {
    const workspaceUser = await checkUserWorkspace(request);
    if (!hasWorkspaceMemberLevel(workspaceUser.role)) {
      throw fastify.httpErrors.forbidden("Only workspace members can perform this action");
    }
  };

  fastify.route({
    method: "GET",
    url: `${workspacesUrl}`,
    preHandler: [accessControl, companyCheck],
    preValidation: [fastify.authenticate],
    schema: getWorkspacesSchema,
    handler: workspacesController.list.bind(workspacesController),
  });

  fastify.route({
    method: "GET",
    url: `${workspacesUrl}/:id`,
    preHandler: [accessControl, companyCheck],
    preValidation: [fastify.authenticate],
    schema: getWorkspaceSchema,
    handler: workspacesController.get.bind(workspacesController),
  });

  fastify.route({
    method: "POST",
    url: `${workspacesUrl}`,
    preHandler: [accessControl, companyCheck],
    preValidation: [fastify.authenticate],
    schema: createWorkspaceSchema,
    handler: workspacesController.save.bind(workspacesController),
  });

  fastify.route({
    method: "POST",
    url: `${workspacesUrl}/:id`,
    preHandler: [accessControl, companyCheck],
    preValidation: [fastify.authenticate],
    schema: updateWorkspaceSchema,
    handler: workspacesController.save.bind(workspacesController),
  });

  fastify.route({
    method: "DELETE",
    url: `${workspacesUrl}/:id`,
    preHandler: [accessControl, companyCheck],
    preValidation: [fastify.authenticate],
    handler: workspacesController.delete.bind(workspacesController),
  });

  fastify.route({
    method: "GET",
    url: `${workspaceUsersUrl}`,
    preHandler: [accessControl, companyCheck, checkWorkspace],
    preValidation: [fastify.authenticate],
    schema: getWorkspaceUsersSchema,
    handler: workspaceUsersController.list.bind(workspaceUsersController),
  });

  fastify.route({
    method: "GET",
    url: `${workspaceUsersUrl}/:user_id`,
    preHandler: [accessControl, companyCheck, checkWorkspace],
    preValidation: [fastify.authenticate],
    schema: getWorkspaceUserSchema,
    handler: workspaceUsersController.get.bind(workspaceUsersController),
  });

  fastify.route({
    method: "POST",
    url: `${workspaceUsersUrl}`,
    preHandler: [accessControl, companyCheck, checkUserIsWorkspaceAdmin],
    preValidation: [fastify.authenticate],
    schema: createWorkspaceUserSchema,
    handler: workspaceUsersController.save.bind(workspaceUsersController),
  });

  fastify.route({
    method: "POST",
    url: `${workspaceUsersUrl}/:user_id`,
    preHandler: [accessControl, companyCheck, checkUserIsWorkspaceAdmin],
    preValidation: [fastify.authenticate],
    schema: updateWorkspaceUserSchema,
    handler: workspaceUsersController.save.bind(workspaceUsersController),
  });

  fastify.route({
    method: "DELETE",
    url: `${workspaceUsersUrl}/:user_id`,
    preHandler: [accessControl, companyCheck, checkUserIsWorkspaceAdmin],
    preValidation: [fastify.authenticate],
    schema: deleteWorkspaceUserSchema,
    handler: workspaceUsersController.delete.bind(workspaceUsersController),
  });

  fastify.route({
    method: "POST",
    url: `${workspaceUsersUrl}/invite`,
    preHandler: [accessControl, companyCheck, checkUserIsWorkspaceAdmin],
    preValidation: [fastify.authenticate],
    schema: inviteWorkspaceUserSchema,
    handler: workspaceUsersController.invite.bind(workspaceUsersController),
  });

  fastify.route({
    method: "DELETE",
    url: `${workspacePendingUsersUrl}/:email`,
    preHandler: [accessControl, companyCheck, checkUserIsWorkspaceAdmin],
    preValidation: [fastify.authenticate],
    schema: deleteWorkspacePendingUsersSchema,
    handler: workspaceUsersController.deletePending.bind(workspaceUsersController),
  });

  fastify.route({
    method: "GET",
    url: `${workspacePendingUsersUrl}/:email`,
    preHandler: [accessControl, companyCheck, checkUserIsWorkspaceAdmin],
    preValidation: [fastify.authenticate],
    schema: getWorkspacePendingUsersSchema,
    handler: workspaceUsersController.listPending.bind(workspaceUsersController),
  });

  fastify.route({
    method: "GET",
    url: `${workspaceInviteTokensUrl}`,
    preHandler: [accessControl, companyCheck, checkUserIsWorkspaceMember],
    preValidation: [fastify.authenticate],
    schema: getWorkspaceInviteTokenSchema,
    handler: workspaceInviteTokensController.list.bind(workspaceInviteTokensController),
  });

  fastify.route({
    method: "POST",
    url: `${workspaceInviteTokensUrl}`,
    preHandler: [accessControl, companyCheck, checkUserIsWorkspaceMember],
    preValidation: [fastify.authenticate],
    schema: postWorkspaceInviteTokenSchema,
    handler: workspaceInviteTokensController.save.bind(workspaceInviteTokensController),
  });

  fastify.route({
    method: "DELETE",
    url: `${workspaceInviteTokensUrl}/:token`,
    preHandler: [accessControl, companyCheck, checkUserIsWorkspaceMember],
    preValidation: [fastify.authenticate],
    schema: deleteWorkspaceInviteTokenSchema,
    handler: workspaceInviteTokensController.delete.bind(workspaceInviteTokensController),
  });

  fastify.route({
    method: "POST",
    url: "/join",
    preHandler: [],
    preValidation: [fastify.authenticateOptional],
    schema: joinInviteTokenSchema,
    handler: workspaceInviteTokensController.join.bind(workspaceInviteTokensController),
  });

  next();
};

export default routes;
