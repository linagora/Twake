import { FastifyInstance, FastifyRegisterOptions } from "fastify";
import { RealtimeServiceAPI } from "../../../core/platform/services/realtime/api";
import { MessageServiceAPI } from "../api";
import routes from "./routes";
import ChannelServiceAPI from "../../channels/provider";

export default (
  fastify: FastifyInstance,
  options: FastifyRegisterOptions<{
    prefix: string;
    service: MessageServiceAPI;
    realtime: RealtimeServiceAPI;
    channelService: ChannelServiceAPI;
  }>,
): void => {
  fastify.log.debug("Configuring /internal/services/messages/v1 routes");
  fastify.register(routes, options);
};
