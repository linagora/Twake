import { FastifyRequest } from "fastify";
import { WorkspaceExecutionContext } from "../../types";
import { BaseChannelsParameters } from "../types";

export * from "./channel";
export * from "./member";

export function getExecutionContext(
  request: FastifyRequest<{ Params: BaseChannelsParameters }>,
): WorkspaceExecutionContext {
  return {
    user: request.currentUser,
    url: request.url,
    method: request.routerMethod,
    transport: "http",
    workspace: {
      company_id: request.params.company_id,
      workspace_id: request.params.workspace_id,
    },
  };
}
