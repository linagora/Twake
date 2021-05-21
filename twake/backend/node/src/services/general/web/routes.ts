import { FastifyInstance, FastifyPluginCallback } from "fastify";
import _ from "lodash";
import { languages, version } from "../constants";
import { Languages, ServerConfiguration } from "../types";

const routes: FastifyPluginCallback<{ configuration: ServerConfiguration["configuration"] }> = (
  fastify: FastifyInstance,
  options,
  next,
) => {
  fastify.route({
    method: "GET",
    url: "/server",
    handler: async (): Promise<ServerConfiguration> => {
      const accounts = options.configuration.accounts;
      return {
        status: "ready",
        version: version,
        configuration: {
          ..._.pick(options.configuration, "help_link"),
          accounts: {
            type: accounts.type,
            console: _.pick(
              accounts.console,
              "account_management_url",
              "company_management_url",
              "collaborators_management_url",
            ),
            internal: _.pick(
              accounts.internal,
              "disable_account_creation",
              "disable_email_verification",
            ),
          },
        },
      };
    },
  });

  fastify.route({
    method: "GET",
    url: "/locales",
    handler: async (): Promise<Languages> => {
      return languages;
    },
  });

  fastify.route({
    method: "GET",
    url: "/locales/:language",
    handler: async (): Promise<any> => {
      return {};
    },
  });

  next();
};

export default routes;
