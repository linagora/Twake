
import { FastifyInstance } from "fastify";
import routes from "./routes";

export default (fastify: FastifyInstance): void => {
  fastify.log.info("Configuring /auth");
  fastify.register(routes, { prefix: "/auth" });
};
