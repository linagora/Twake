import { FastifyReply, FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import {
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
  ResourceUpdateResponse,
} from "../../../../utils/types";
import { Message } from "../../entities/messages";
import { MessageListQueryParameters, ThreadExecutionContext } from "../../types";
import { handleError } from "../../../../utils/handleError";
import { Pagination } from "../../../../core/platform/framework/api/crud-service";
import { getThreadMessageWebsocketRoom } from "../realtime";
import { ThreadPrimaryKey } from "../../entities/threads";
import { extendExecutionContentWithChannel } from "./index";
import gr from "../../../global-resolver";

export class MessagesController
  implements
    CrudController<
      ResourceGetResponse<Message>,
      ResourceUpdateResponse<Message>,
      ResourceListResponse<Message>,
      ResourceDeleteResponse
    >
{
  async save(
    request: FastifyRequest<{
      Querystring: {
        include_users: boolean;
      };
      Params: {
        company_id: string;
        thread_id: string;
        message_id?: string;
      };
      Body: {
        resource: Message;
        options: {
          previous_thread: string;
        };
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceUpdateResponse<Message>> {
    const context = getThreadExecutionContext(request);
    try {
      if (request.body.options?.previous_thread) {
        //First move the message to another thread, then edit it
        await gr.services.messages.messages.move(
          { id: request.params.message_id || undefined },
          {
            previous_thread: request.body.options?.previous_thread,
          },
          context,
        );
      }

      const thread = await gr.services.messages.threads.get({
        id: context.thread.id,
      } as ThreadPrimaryKey);

      if (!thread) {
        throw "Message must be in a thread";
      }

      const result = await gr.services.messages.messages.save(
        {
          id: request.params.message_id || undefined,
          ...request.body.resource,
        },
        {},
        extendExecutionContentWithChannel(thread.participants, context),
      );

      let entity = result.entity;

      if (request.query.include_users) {
        entity = await gr.services.messages.messages.includeUsersInMessage(entity);
      }

      return {
        resource: entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async forceDelete(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        thread_id: string;
        message_id: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const context = getThreadExecutionContext(request);
    try {
      await gr.services.messages.messages.forceDelete(
        {
          thread_id: request.params.thread_id,
          id: request.params.message_id,
        },
        context,
      );
      return {
        status: "success",
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async delete(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        thread_id: string;
        message_id: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    const context = getThreadExecutionContext(request);
    try {
      await gr.services.messages.messages.delete(
        {
          thread_id: request.params.thread_id,
          id: request.params.message_id,
        },
        context,
      );
      return {
        status: "success",
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async get(
    request: FastifyRequest<{
      Querystring: MessageListQueryParameters;
      Params: {
        company_id: string;
        thread_id: string;
        message_id: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<Message>> {
    const context = getThreadExecutionContext(request);
    try {
      let resource = await gr.services.messages.messages.get(
        {
          thread_id: request.params.thread_id,
          id: request.params.message_id,
        },
        context,
      );

      if (request.query.include_users) {
        resource = await gr.services.messages.messages.includeUsersInMessage(resource);
      }

      return {
        resource: resource,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async list(
    request: FastifyRequest<{
      Querystring: MessageListQueryParameters;
      Params: {
        company_id: string;
        thread_id: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceListResponse<Message>> {
    const context = getThreadExecutionContext(request);
    try {
      const resources = await gr.services.messages.messages.list(
        new Pagination(
          request.query.page_token,
          request.query.limit,
          request.query.direction !== "history",
        ),
        { ...request.query, include_users: request.query.include_users || false },
        context,
      );

      let entities = [];
      if (request.query.include_users) {
        for (const msg of resources.getEntities()) {
          entities.push(await gr.services.messages.messages.includeUsersInMessage(msg));
        }
      } else {
        entities = resources.getEntities();
      }

      return {
        resources: entities,
        ...(request.query.websockets && {
          websockets: gr.platformServices.realtime.sign(
            [{ room: getThreadMessageWebsocketRoom(context) }],
            context.user.id,
          ),
        }),
        ...(resources.page_token && {
          next_page_token: resources.page_token,
        }),
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async reaction(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        thread_id: string;
        message_id: string;
      };
      Body: {
        reactions: string[];
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceUpdateResponse<Message>> {
    const context = getThreadExecutionContext(request);
    try {
      const result = await gr.services.messages.messages.reaction(
        {
          id: request.params.message_id,
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
        message_id: string;
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
      const result = await gr.services.messages.messages.bookmark(
        {
          id: request.params.message_id,
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
        message_id: string;
      };
      Body: {
        pin: boolean;
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceUpdateResponse<Message>> {
    const context = getThreadExecutionContext(request);
    try {
      const result = await gr.services.messages.messages.pin(
        {
          id: request.params.message_id,
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
    thread: { id: request.params.thread_id },
    company: { id: request.params.company_id },
    url: request.url,
    method: request.routerMethod,
    reqId: request.id,
    transport: "http",
  };
}
