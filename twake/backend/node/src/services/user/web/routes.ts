import { FastifyInstance, FastifyPluginCallback, FastifyRequest, RouteShorthandOptions } from "fastify";
import { UsersCrudController } from "./controller";
import UserServiceAPI from "../api";
import { getUserSchema } from "./schemas";

const usersUrl = "/users";

const routes: FastifyPluginCallback<{
  service: UserServiceAPI
}> = (fastify: FastifyInstance, options, next) => {
  const usersController = new UsersCrudController(options.service.users);
  const accessControl = async (request: FastifyRequest) => {
    // TODO
    const authorized = true

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

  next();
};

export default routes;
