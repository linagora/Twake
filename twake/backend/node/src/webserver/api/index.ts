import { FastifyInstance } from "fastify";
import users from "./users";
import messages from "./messages";
import auth from "./auth";

export function registerRoutes(fastify: FastifyInstance): void {
  fastify.register((instance, _opts, next) => {
    users(instance);
    messages(instance);
    auth(instance);
    next();
  }, {
    prefix: "/api"
  });
}
