import { FastifyInstance, FastifyPluginCallback } from "fastify";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, options, next) => {
  next();
};

export default routes;
