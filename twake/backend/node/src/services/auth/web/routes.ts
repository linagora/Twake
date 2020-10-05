import { FastifyInstance, FastifyPluginCallback } from "fastify";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, _opts, next) => {
  fastify.get("/login", async (_request, reply) => {
    // TODO: Get the credentials from req, authenticate user
    const token = fastify.jwt.sign({ _id: 1 });

    reply.send({ token });
  });

  next();
};

export default routes;