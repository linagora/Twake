import { FastifyInstance } from "fastify";
import websocketPlugin from "../plugins/socket.io";

export default function configureWebsocket(fastify: FastifyInstance): void {
  fastify.register(websocketPlugin, {
    path: "/"
  });
}
