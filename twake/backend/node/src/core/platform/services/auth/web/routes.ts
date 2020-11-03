import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { v4 as uuidv4 } from "uuid";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, _opts, next) => {
  fastify.get("/login", async (_request, reply) => {
    reply.send({ token: fastify.jwt.sign({ id: uuidv4() }) });
  });

  next();
};

export default routes;
