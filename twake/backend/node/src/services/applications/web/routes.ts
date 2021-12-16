import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { RealtimeServiceAPI } from "../../../core/platform/services/realtime/api";
import { ApplicationServiceAPI } from "../api";
import { ApplicationController } from "./controllers/applications";
import { CompanyApplicationController } from "./controllers/company-applications";

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

  /**
   * Applications collection
   * Marketplace of applications
   */

  //Get and search list of applications in the marketplace
  fastify.route({
    method: "GET",
    url: `${applicationsUrl}`,
    preValidation: [fastify.authenticate],
    handler: applicationController.list.bind(applicationController),
  });

  //Get a single application in the marketplace
  fastify.route({
    method: "GET",
    url: `${applicationsUrl}/:application_id`,
    preValidation: [fastify.authenticate],
    handler: applicationController.get.bind(applicationController),
  });

  //Create application (must be my company application and I must be company admin)
  fastify.route({
    method: "POST",
    url: `${applicationsUrl}`,
    preValidation: [fastify.authenticate],
    handler: applicationController.save.bind(applicationController),
  });

  //Edit application (must be my company application and I must be company admin)
  fastify.route({
    method: "POST",
    url: `${applicationsUrl}/:application_id`,
    preValidation: [fastify.authenticate],
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
    handler: companyApplicationController.list.bind(applicationController),
  });

  //Get one application of a company
  fastify.route({
    method: "GET",
    url: `${companyApplicationsUrl}/:application_id`,
    preValidation: [fastify.authenticate],
    handler: companyApplicationController.get.bind(applicationController),
  });

  //Remove an application from a company
  fastify.route({
    method: "DELETE",
    url: `${companyApplicationsUrl}/:application_id`,
    preValidation: [fastify.authenticate],
    handler: companyApplicationController.delete.bind(applicationController),
  });

  //Add an application to the company
  fastify.route({
    method: "POST",
    url: `${companyApplicationsUrl}/:application_id`,
    preValidation: [fastify.authenticate],
    handler: companyApplicationController.save.bind(applicationController),
  });

  //Application event triggered by a user
  fastify.route({
    method: "POST",
    url: `${applicationsUrl}/:application_id/event`,
    preValidation: [fastify.authenticate],
    handler: applicationController.event.bind(applicationController),
  });

  next();
};

export default routes;
