import { FastifyPluginCallback, FastifyRequest } from "fastify";
import fastifyJwt from "fastify-jwt";
import fp from "fastify-plugin";
import config from "../../../../config";

type JwtType = {
  sub: string;
  exp: number;
  refresh_exp: number;
  updated_at: number;
  org: {
    [wompanyId: string]: {
      role: string; //Not implemented
      wks: {
        [workspaceId: string]: {
          adm: boolean;
        };
      };
    };
  };
};

const jwtPlugin: FastifyPluginCallback = (fastify, _opts, next) => {
  fastify.register(fastifyJwt, {
    secret: config.get("auth.jwt.secret"),
  });

  fastify.decorate("authenticate", async (request: FastifyRequest) => {
    try {
      const jwt: JwtType = await request.jwtVerify();
      request.currentUser = { id: jwt.sub };
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
