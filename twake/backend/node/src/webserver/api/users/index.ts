import { FastifyInstance } from "fastify";
import routes from "./routes";

export default (fastify: FastifyInstance) => {
  fastify.log.info('Configuring /users');
  routes(fastify);
}
