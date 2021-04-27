import { FastifyReply, FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import { MessageServiceAPI } from "../../api";
import {
  ResourceUpdateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../types";
import { Message } from "../../entities/messages";
import { ThreadExecutionContext } from "../../types";
import { handleError } from "../../../../utils/handleError";

export class MessagesController
  implements
    CrudController<
      ResourceGetResponse<Message>,
      ResourceUpdateResponse<Message>,
      ResourceListResponse<Message>,
      ResourceDeleteResponse
    > {
  constructor(protected service: MessageServiceAPI) {}

  async save(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        thread_id: string;
        id?: string;
      };
      Body: {
        resource: Message;
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceUpdateResponse<Message>> {
    const context = getThreadExecutionContext(request);
    try {
      const result = await this.service.messages.save(
        {
          id: request.params.id || undefined,
          ...request.body.resource,
        },
        {},
        context,
      );
      return {
        resource: result.entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async delete(request: FastifyRequest<{}>): Promise<ResourceDeleteResponse> {
    return new ResourceDeleteResponse();
  }

  async get(request: FastifyRequest<{}>): Promise<ResourceGetResponse<Message>> {
    return new ResourceGetResponse();
  }

  async list(request: FastifyRequest<{}>): Promise<ResourceListResponse<Message>> {
    return new ResourceListResponse();
  }

  async reaction(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        thread_id: string;
        id: string;
      };
      Body: {
        reactions: string[];
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceUpdateResponse<Message>> {
    const context = getThreadExecutionContext(request);
    try {
      const result = await this.service.messages.reaction(
        {
          id: request.params.id,
          reactions: request.body.reactions,
        },
        {},
        context,
      );
      return {
        resource: result.entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async bookmark(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        thread_id: string;
        id: string;
      };
      Body: {
        active: boolean;
        bookmark_id: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceUpdateResponse<Message>> {
    const context = getThreadExecutionContext(request);
    try {
      const result = await this.service.messages.bookmark(
        {
          id: request.params.id,
          bookmark_id: request.body.bookmark_id,
          active: request.body.active,
        },
        {},
        context,
      );
      return {
        resource: result.entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async pin(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        thread_id: string;
        id: string;
      };
      Body: {
        pin: boolean;
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceUpdateResponse<Message>> {
    const context = getThreadExecutionContext(request);
    try {
      const result = await this.service.messages.pin(
        {
          id: request.params.id,
          pin: request.body.pin,
        },
        {},
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

function getThreadExecutionContext(
  request: FastifyRequest<{
    Params: { company_id: string; thread_id: string };
  }>,
): ThreadExecutionContext {
  return {
    user: request.currentUser,
    thread: { company_id: request.params.company_id, id: request.params.thread_id },
    url: request.url,
    method: request.routerMethod,
    reqId: request.id,
    transport: "http",
  };
}
