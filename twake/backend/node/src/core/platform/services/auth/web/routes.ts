import { FastifyInstance, FastifyPluginCallback } from "fastify";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, _opts, next) => {
  fastify.get("/login", async (_request, reply) => {
    reply.send({ token: fastify.jwt.sign({ id: 1 }) });
  });

  next();
};

export default routes;
