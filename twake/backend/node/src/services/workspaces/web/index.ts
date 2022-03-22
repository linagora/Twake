import { FastifyInstance, FastifyRegisterOptions } from "fastify";
import { RealtimeServiceAPI } from "../../../core/platform/services/realtime/api";
import routes from "./routes";

export default (
  fastify: FastifyInstance,
  options: FastifyRegisterOptions<{
    prefix: string;
    realtime: RealtimeServiceAPI;
  }>,
): void => {
  fastify.log.debug("Configuring /workspaces routes");
  fastify.register(routes, options);
};
