import { FastifyInstance, FastifyPluginCallback, FastifyRequest } from "fastify";
import { UsersCrudController } from "./controller";
import UserServiceAPI from "../api";
import { getCompanySchema, getUserCompaniesSchema, getUserSchema, getUsersSchema } from "./schemas";

const usersUrl = "/users";

const routes: FastifyPluginCallback<{
  service: UserServiceAPI;
}> = (fastify: FastifyInstance, options, next) => {
  const usersController = new UsersCrudController(options.service.users, options.service.companies);
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
    schema: getUserCompaniesSchema,
    handler: usersController.getUserCompanies.bind(usersController),
  });

  //Get a company by id and public information (this route is public and doesn't need to be authenticated)
  fastify.route({
    method: "GET",
    url: "/companies/:id",
    schema: getCompanySchema,
    handler: usersController.getCompany.bind(usersController),
  });

  next();
};

export default routes;
