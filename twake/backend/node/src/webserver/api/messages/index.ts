import { FastifyInstance } from "fastify";
import routes from "./routes";

export default (fastify: FastifyInstance): void => {
  fastify.log.info("Configuring /messages");
  fastify.register(routes, { prefix: "/messages" });
};
