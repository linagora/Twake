import { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import fastifyJwt from "fastify-jwt";
import fp from "fastify-plugin";
import config from "../../core/config";

const jwtPlugin: FastifyPluginCallback = (fastify, _opts, next) => {
  fastify.register(fastifyJwt, {
    secret: config.get("auth.jwt.secret")
  });

  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send("You are not authenticated");
    }
  });

  next();
}

export default fp(jwtPlugin, {
  name: "authenticate"
});
