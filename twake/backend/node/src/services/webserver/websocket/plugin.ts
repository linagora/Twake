import { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";
import socketIO from "socket.io";
import SocketIORedis from "socket.io-redis";
import config from "../../../core/config";

const socketIOPlugin: FastifyPluginCallback<SocketIO.ServerOptions> = (fastify, opts, next) => {
  const io = socketIO(fastify.server, opts);

  const adapterConfiguration = config.get<Array<string>>("websocket.adapter.types");

  if (adapterConfiguration.includes("redis")) {
    const configuration = config.get<SocketIORedis.SocketIORedisOptions>("websocket.adapter.redis");

    fastify.log.info("Configuring socket.io with redis %o", configuration);

    io.adapter(SocketIORedis(configuration));
  }

  fastify.decorate("io", io);

  next();
};

export default fp(socketIOPlugin, {
  name: "fastify-socketio"
});
