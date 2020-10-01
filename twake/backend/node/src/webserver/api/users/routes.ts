import { FastifyInstance, FastifyPluginCallback, RouteShorthandOptions } from "fastify";
import { UserParams, CreateUserBody } from "./types";
import * as controller from "./controller";
import User from "../../../core/types/user";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, _opts, next) => {
  fastify.get(
    "/",
    {
      preValidation: [fastify.authenticate]
    },
    async (req): Promise<User[]> => {
      req.log.info("Get users");

      return controller.getUsers();
  });

  fastify.get<{
    Params: UserParams,
  }>(
    "/:id",
    {
      preValidation: [fastify.authenticate]
    },
    async (req): Promise<User> => {
      req.log.debug(`Current user ${JSON.stringify(req.user)}`);
      req.log.info(`Get user ${req.params.id}`);
      return controller.getUser(req.params.id);
    });

  const routeOptions: RouteShorthandOptions = {
    preValidation: [fastify.authenticate],
    schema: {
      body: {
        type: "object",
        properties: {
          email: {
            type: "string"
          }
        }
      }
    }
  };

  fastify.post<{
    Body: CreateUserBody
  }>("/", routeOptions, async (req): Promise<User> => {
    req.log.info(`Creating user ${JSON.stringify(req.body)}`);
    return new User("1");
  });

  next();
};

export default routes;
