import { FastifyInstance, FastifyPluginCallback, FastifyRequest } from "fastify";
import { UsersCrudController } from "./controller";
import UserServiceAPI from "../api";
import {
  deleteDeviceSchema,
  getCompanySchema,
  getDevicesSchema,
  getUserCompaniesSchema,
  getUserSchema,
  getUsersSchema,
  postDevicesSchema,
  setUserPreferencesSchema,
} from "./schemas";
import { RealtimeServiceAPI } from "../../../core/platform/services/realtime/api";

const usersUrl = "/users";

const routes: FastifyPluginCallback<{
  service: UserServiceAPI;
  realtime: RealtimeServiceAPI;
}> = (fastify: FastifyInstance, options, next) => {
  const usersController = new UsersCrudController(options.realtime, options.service);
  const accessControl = async (request: FastifyRequest) => {
    // TODO
    const authorized = true;

    if (!authorized) {
      throw fastify.httpErrors.badRequest("Invalid company/workspace");
    }
  };

  fastify.route({
    method: "GET",
    url: `${usersUrl}/:id`,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: getUserSchema,
    handler: usersController.get.bind(usersController),
  });

  fastify.route({
    method: "POST",
    url: `${usersUrl}/me/preferences`,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: setUserPreferencesSchema,
    handler: usersController.setPreferences.bind(usersController),
  });

  fastify.route({
    method: "POST",
    url: `${usersUrl}/me`,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: setUserPreferencesSchema,
    handler: usersController.save.bind(usersController),
  });

  fastify.route({
    method: "GET",
    url: `${usersUrl}`,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: getUsersSchema,
    handler: usersController.list.bind(usersController),
  });

  // Get a list of companies for a user, only common companies with current user are returned.
  fastify.route({
    method: "GET",
    url: `${usersUrl}/:id/companies`,
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: getUserCompaniesSchema, //Fixme currently not working because we don't know features in advances and so it doesn't pass
    handler: usersController.getUserCompanies.bind(usersController),
  });

  //Get a company by id and public information (this route is public and doesn't need to be authenticated)
  fastify.route({
    method: "GET",
    url: "/companies/:id",
    preValidation: [fastify.authenticateOptional],
    schema: getCompanySchema, //Fixme currently not working because we don't know features in advances and so it doesn't pass
    handler: usersController.getCompany.bind(usersController),
  });

  fastify.route({
    method: "POST",
    url: "/devices",
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: postDevicesSchema,
    handler: usersController.registerUserDevice.bind(usersController),
  });

  fastify.route({
    method: "GET",
    url: "/devices",
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: getDevicesSchema,
    handler: usersController.getRegisteredDevices.bind(usersController),
  });

  fastify.route({
    method: "DELETE",
    url: "/devices/:value",
    preHandler: accessControl,
    preValidation: [fastify.authenticate],
    schema: deleteDeviceSchema,
    handler: usersController.deregisterUserDevice.bind(usersController),
  });

  next();
};

export default routes;
