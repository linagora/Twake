import { FastifyInstance, FastifyRegisterOptions } from "fastify";
import ChannelServiceAPI from "../provider";
import routes from "./routes";

export default (
  fastify: FastifyInstance,
  options: FastifyRegisterOptions<{ prefix: string; service: ChannelServiceAPI }>,
): void => {
  fastify.log.debug("Configuring /internal/services/channels/v1 routes");
  fastify.register(routes, options);
};
