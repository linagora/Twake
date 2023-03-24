import { FastifyInstance, FastifyRegisterOptions } from "fastify";
import routes from "./routes";

export default (
  fastify: FastifyInstance,
  options: FastifyRegisterOptions<{
    prefix: string;
  }>,
) => {
  fastify.log.debug("Configuring /internal/services/previews/v1 routes");
  fastify.register(routes, options);
};
