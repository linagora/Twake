import { FastifyPluginCallback, FastifyRequest } from "fastify";
import fastifyJwt from "fastify-jwt";
import fp from "fastify-plugin";
import config from "../../../../config";

type JwtType = {
  sub: string;
  nbf: number;
  refresh_nbf: number;
  iat: number;
  org: {
    [companyId: string]: {
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
      request.currentUser = { ...{ org: jwt.org }, ...{ id: jwt.sub } };
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
