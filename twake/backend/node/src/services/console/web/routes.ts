import { FastifyInstance, FastifyPluginCallback, FastifyRequest } from "fastify";
import { consoleHookSchema } from "./schemas";
import crypto from "crypto";

import { ConsoleServiceAPI } from "../api";
// import { WorkspaceBaseRequest, WorkspaceUsersBaseRequest, WorkspaceUsersRequest } from "./types";
import { ConsoleController } from "./controller";
import { ConsoleHookBody, ConsoleHookQueryString } from "../types";

const hookUrl = "/hook";

const routes: FastifyPluginCallback<{
  service: ConsoleServiceAPI;
}> = (fastify: FastifyInstance, options, next) => {
  const controller = new ConsoleController(options.service);

  const accessControl = async (
    request: FastifyRequest<{ Body: ConsoleHookBody; Querystring: ConsoleHookQueryString }>,
  ) => {
    if (options.service.consoleType != "remote") {
      console.error("Console hook: Hook service is only for the remote console");
      throw fastify.httpErrors.notImplemented("Hook service is only for the remote console");
    }

    if (request.query.secret_key != options.service.consoleOptions.hook.token) {
      console.error("Console hook: wrong secret");
      throw fastify.httpErrors.forbidden("Wrong secret");
    }

    const publicKey = options.service.consoleOptions.hook.public_key;

    if (publicKey) {
      const input = JSON.stringify({ content: request.body.content, type: request.body.type });
      const signatureBase64 = request.body.signature;
      const verifier = crypto.createVerify("RSA-SHA512").update(input);
      if (!verifier.verify(publicKey, signatureBase64, "base64")) {
        console.error("Console hook: Signature verification failed");
        throw fastify.httpErrors.forbidden("Signature verification failed");
      }
    }
  };

  fastify.route({
    method: "POST",
    url: `${hookUrl}`,
    preHandler: [accessControl],
    schema: consoleHookSchema,
    handler: controller.hook.bind(controller),
  });

  next();
};

export default routes;
