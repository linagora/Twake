import { FastifyInstance } from "fastify";
import jwtPlugin from "./jwt";

export function configureAuthentication(fastify: FastifyInstance): void {
  fastify.register(jwtPlugin);
}
