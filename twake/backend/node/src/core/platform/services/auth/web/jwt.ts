import { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import fastifyJwt from "fastify-jwt";
import fp from "fastify-plugin";
import config from "../../../../config";

const jwtPlugin: FastifyPluginCallback = (fastify, _opts, next) => {
  fastify.register(fastifyJwt, {
    secret: config.get("auth.jwt.secret")
  });

  fastify.decorate("authenticate", async (request: FastifyRequest) => {
    try {
      request.currentUser = await request.jwtVerify();
      request.log.debug(`Authenticated as user ${request.currentUser.id}`);
    } catch (err) {
      throw fastify.httpErrors.unauthorized("Bad credentials");
    }
  });

  next();
};

export default fp(jwtPlugin, {
  name: "authenticate"
});
