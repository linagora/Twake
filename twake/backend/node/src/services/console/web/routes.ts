import { FastifyInstance, FastifyPluginCallback, FastifyRequest } from "fastify";
import { authenticationSchema, consoleHookSchema, tokenRenewalSchema } from "./schemas";
import crypto from "crypto";
// import { WorkspaceBaseRequest, WorkspaceUsersBaseRequest, WorkspaceUsersRequest } from "./types";
import { ConsoleController } from "./controller";
import { ConsoleHookBody, ConsoleHookQueryString } from "../types";
import gr from "../../global-resolver";

const hookUrl = "/hook";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, options, next) => {
  const controller = new ConsoleController();

  const accessControl = async (
    request: FastifyRequest<{ Body: ConsoleHookBody; Querystring: ConsoleHookQueryString }>,
  ) => {
    if (gr.services.console.consoleType != "remote") {
      throw fastify.httpErrors.notImplemented("Hook service is only for the remote console");
    }

    if (
      (request.body.secret_key || request.query.secret_key) !==
      gr.services.console.consoleOptions.hook.token
    ) {
      throw fastify.httpErrors.forbidden("Wrong secret");
    }

    const publicKey = gr.services.console.consoleOptions.hook.public_key;

    if (publicKey) {
      const input = JSON.stringify({ content: request.body.content, type: request.body.type });
      const signatureBase64 = request.body.signature;
      const verifier = crypto.createVerify("RSA-SHA512").update(input);
      if (!verifier.verify(publicKey, signatureBase64, "base64")) {
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

  fastify.route({
    method: "POST",
    url: "/login",
    schema: authenticationSchema,
    handler: controller.auth.bind(controller),
  });

  fastify.route({
    method: "POST",
    url: "/signup",
    handler: controller.signup.bind(controller),
  });

  fastify.route({
    method: "POST",
    url: "/token",
    preValidation: [fastify.authenticate],
    schema: tokenRenewalSchema,
    handler: controller.tokenRenewal.bind(controller),
  });

  fastify.route({
    method: "POST",
    url: "/resend-verification-email",
    preValidation: [fastify.authenticate],
    handler: controller.resendVerificationEmail.bind(controller),
  });

  next();
};

export default routes;
