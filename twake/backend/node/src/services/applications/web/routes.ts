import { FastifyInstance, FastifyPluginCallback, FastifyRequest } from "fastify";
import { RealtimeServiceAPI } from "../../../core/platform/services/realtime/api";
import { ApplicationServiceAPI } from "../api";
import { ApplicationController } from "./controllers/applications";
import { CompanyApplicationController } from "./controllers/company-applications";
import { WorkspaceBaseRequest } from "../../workspaces/web/types";

import Application from "../entities/application";
import assert from "assert";
import { applicationEventHookSchema, applicationPostSchema } from "./schemas";

const applicationsUrl = "/applications";
const companyApplicationsUrl = "/companies/:company_id/applications";

const routes: FastifyPluginCallback<{
  service: ApplicationServiceAPI;
  realtime: RealtimeServiceAPI;
}> = (fastify: FastifyInstance, options, next) => {
  const applicationController = new ApplicationController(options.service);
  const companyApplicationController = new CompanyApplicationController(
    options.realtime,
    options.service,
  );

  const adminCheck = async (request: FastifyRequest<{ Body: Application }>) => {
    const companyId = request.body.company_id;
    const userId = request.currentUser.id;
    assert(companyId, "company_id is not defined");
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
    if (companyUser.role !== "admin") {
      throw fastify.httpErrors.forbidden("You must be an admin of this company");
    }
  };

  /**
   * Applications collection
   * Marketplace of applications
   */

  //Get and search list of applications in the marketplace
  fastify.route({
    method: "GET",
    url: `${applicationsUrl}`,
    preValidation: [fastify.authenticate],
    // schema: applicationGetSchema,
    handler: applicationController.list.bind(applicationController),
  });

  //Get a single application in the marketplace
  fastify.route({
    method: "GET",
    url: `${applicationsUrl}/:application_id`,
    preValidation: [fastify.authenticate],
    // schema: applicationGetSchema,
    handler: applicationController.get.bind(applicationController),
  });

  //Create application (must be my company application and I must be company admin)
  fastify.route({
    method: "POST",
    url: `${applicationsUrl}`,
    preHandler: [adminCheck],
    preValidation: [fastify.authenticate],
    schema: applicationPostSchema,
    handler: applicationController.save.bind(applicationController),
  });

  //Edit application (must be my company application and I must be company admin)
  fastify.route({
    method: "POST",
    url: `${applicationsUrl}/:application_id`,
    preHandler: [adminCheck],
    preValidation: [fastify.authenticate],
    schema: applicationPostSchema,
    handler: applicationController.save.bind(applicationController),
  });

  /**
   * Company applications collection
   * Company-wide available applications
   * (must be my company application and I must be company admin)
   */

  //Get list of applications for a company
  fastify.route({
    method: "GET",
    url: `${companyApplicationsUrl}`,
    preValidation: [fastify.authenticate],
    handler: companyApplicationController.list.bind(companyApplicationController),
  });

  //Get one application of a company
  fastify.route({
    method: "GET",
    url: `${companyApplicationsUrl}/:application_id`,
    preValidation: [fastify.authenticate],
    handler: companyApplicationController.get.bind(companyApplicationController),
  });

  //Remove an application from a company
  fastify.route({
    method: "DELETE",
    url: `${companyApplicationsUrl}/:application_id`,
    preValidation: [fastify.authenticate],
    handler: companyApplicationController.delete.bind(companyApplicationController),
  });

  //Add an application to the company
  fastify.route({
    method: "POST",
    url: `${companyApplicationsUrl}/:application_id`,
    preValidation: [fastify.authenticate],
    handler: companyApplicationController.save.bind(companyApplicationController),
  });

  //Application event triggered by a user
  fastify.route({
    method: "POST",
    url: `${applicationsUrl}/:application_id/event`,
    preValidation: [fastify.authenticate],
    schema: applicationEventHookSchema,
    handler: applicationController.event.bind(applicationController),
  });

  next();
};

export default routes;
