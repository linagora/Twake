import { FastifyInstance } from "fastify";
import users from "./users";
import messages from "./messages";

export function registerRoutes(fastify: FastifyInstance): void {
  fastify.register((instance, _opts, next) => {
    users(instance);
    messages(instance);
    next();
  }, {
    prefix: "/api"
  });
}
