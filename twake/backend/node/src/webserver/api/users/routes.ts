import { FastifyInstance, FastifyPluginCallback, RouteShorthandOptions } from "fastify";
import { UserParams, CreateUserBody } from "./types";
import * as controller from "./controller";
import User from "../../../core/types/user";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, _opts, next) => {
  fastify.get("/", async (req): Promise<User[]> => {
    req.log.info("Get users");

    return controller.getUsers();
  });

  fastify.get<{
    Params: UserParams,
  }>("/:id", async (req): Promise<User> => {
    req.log.info(`Get user ${req.params.id}`);
    return controller.getUser(req.params.id);
  });

  const routeOptions: RouteShorthandOptions = {
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
