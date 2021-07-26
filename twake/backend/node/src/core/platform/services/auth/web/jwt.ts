import { FastifyPluginCallback, FastifyRequest } from "fastify";
import fastifyJwt from "fastify-jwt";
import fp from "fastify-plugin";
import config from "../../../../config";
import { JwtType } from "../../types";

const jwtPlugin: FastifyPluginCallback = (fastify, _opts, next) => {
  fastify.register(fastifyJwt, {
    secret: config.get("auth.jwt.secret"),
  });

  fastify.decorate("authenticate", async (request: FastifyRequest) => {
    try {
      const jwt: JwtType = await request.jwtVerify();
      if (jwt.type === "refresh") {
        // TODO  in the future we must invalidate the refresh token (because it should be single use)
      }
      request.currentUser = {
        ...{ email: jwt.email },
        ...{ id: jwt.sub },
        ...{ identity_provider_id: jwt.provider_id },
        ...{ application_id: jwt.application_id || null },
        ...{ server_request: jwt.server_request || false },
      };
      request.log.debug(`Authenticated as user ${request.currentUser.id}`);
    } catch (err) {
      throw fastify.httpErrors.unauthorized("Bad credentials");
    }
  });

  next();
};

export default fp(jwtPlugin, {
  name: "authenticate",
});
