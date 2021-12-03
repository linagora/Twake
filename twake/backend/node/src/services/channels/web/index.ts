import { FastifyInstance, FastifyRegisterOptions } from "fastify";
import { RealtimeServiceAPI } from "../../../core/platform/services/realtime/api";
import ChannelServiceAPI from "../provider";
import routes from "./routes";

export default (
  fastify: FastifyInstance,
  options: FastifyRegisterOptions<{
    prefix: string;
    service: ChannelServiceAPI;
    realtime: RealtimeServiceAPI;
  }>,
): void => {
  fastify.log.debug("Configuring /internal/services/channels/v1 routes");
  fastify.register(routes, options);
};
