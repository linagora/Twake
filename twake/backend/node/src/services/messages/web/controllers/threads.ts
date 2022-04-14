import { FastifyReply, FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../../utils/types";
import { handleError } from "../../../../utils/handleError";
import { CompanyExecutionContext } from "../../types";
import { ParticipantObject, Thread } from "../../entities/threads";
import gr from "../../../global-resolver";

export class ThreadsController
  implements
    CrudController<
      ResourceGetResponse<Thread>,
      ResourceCreateResponse<Thread>,
      ResourceListResponse<Thread>,
      ResourceDeleteResponse
    >
{
  async save(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        thread_id: string;
      };
      Body: {
        resource: {
          participants: ParticipantObject[];
        };
        options: {
          message: any;
          participants: { add: ParticipantObject[]; remove: ParticipantObject[] };
        };
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceCreateResponse<Thread>> {
    const context = getCompanyExecutionContext(request);
    try {
      const result = await gr.services.messages.threads.save(
        {
          id: request.params.thread_id || undefined,
          participants: request.body.resource.participants || undefined,
        },
        {
          message: request.body.options.message,
          participants: request.body.options.participants,
        },
        context,
      );
      return {
        resource: result.entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }
}

function getCompanyExecutionContext(
  request: FastifyRequest<{
    Params: { company_id: string };
  }>,
): CompanyExecutionContext {
  return {
    user: request.currentUser,
    company: { id: request.params.company_id },
    url: request.url,
    method: request.routerMethod,
    reqId: request.id,
    transport: "http",
  };
}
