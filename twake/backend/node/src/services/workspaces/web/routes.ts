import { FastifyInstance, FastifyPluginCallback, FastifyRequest } from "fastify";
import { WorkspacesCrudController } from "./controller";
import { getWorkspaceSchema, getWorkspacesSchema, postWorkspaceSchema } from "./schemas";

import WorkspaceServicesAPI from "../api";
import { WorkspaceBaseRequest } from "./types";

const workspacesUrl = "/companies/:company_id/workspaces";

const routes: FastifyPluginCallback<{
  service: WorkspaceServicesAPI;
}> = (fastify: FastifyInstance, options, next) => {
  const workspacesController = new WorkspacesCrudController(options.service.workspaces);

  const accessControl = async (request: FastifyRequest) => {
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
      throw fastify.httpErrors.unauthorized("User does not belong to this company");
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
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: getWorkspaceSchema,
    handler: workspacesController.get.bind(workspacesController),
  });

  fastify.route({
    method: "POST",
    url: `${workspacesUrl}`,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: postWorkspaceSchema,
    handler: workspacesController.save.bind(workspacesController),
  });

  fastify.route({
    method: "POST",
    url: `${workspacesUrl}/:id`,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: postWorkspaceSchema,
    handler: workspacesController.save.bind(workspacesController),
  });

  fastify.route({
    method: "DELETE",
    url: `${workspacesUrl}/:id`,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    handler: workspacesController.delete.bind(workspacesController),
  });

  next();
};

export default routes;
