import { FastifyInstance } from "fastify";
import websocketPlugin from "./plugin";

export default function configureWebsocket(fastify: FastifyInstance): void {
  fastify.register(websocketPlugin, {
    path: "/socket.io",
  });
}
