import socketIO from "socket.io";
import { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";

const socketIOPlugin: FastifyPluginCallback<{ io: socketIO.Server }> = (fastify, opts, next) => {
  fastify.decorate("io", opts.io);

  next();
};

export default fp(socketIOPlugin, {
  name: "fastify-socketio",
});
