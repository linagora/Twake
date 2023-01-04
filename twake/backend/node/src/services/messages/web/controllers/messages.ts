import { FastifyReply, FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import {
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
  ResourceUpdateResponse,
} from "../../../../utils/types";
import { getInstance as getMessageInstance, Message } from "../../entities/messages";
import {
  CompanyExecutionContext,
  MessageListQueryParameters,
  MessageReadType,
  ThreadExecutionContext,
} from "../../types";
import { handleError } from "../../../../utils/handleError";
import { CrudException, Pagination } from "../../../../core/platform/framework/api/crud-service";
import { getThreadMessageWebsocketRoom } from "../realtime";
import { ThreadPrimaryKey } from "../../entities/threads";
import { extendExecutionContentWithChannel } from "./index";
import gr from "../../../global-resolver";
import { formatUser } from "../../../../utils/users";
import { UserObject } from "../../../../services/user/web/types";

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

      const thread = await gr.services.messages.threads.get(
        {
          id: context.thread.id,
        } as ThreadPrimaryKey,
        context,
      );

      if (!thread) {
        throw "Message must be in a thread";
      }

      let hasOneMembership = false;
      for (const participant of thread.participants) {
        if (thread.created_by === context.user.id) {
          hasOneMembership = true;
          break;
        }
        if (participant.type === "channel") {
          const isMember = await gr.services.channels.members.getChannelMember(
            { id: context.user.id },
            {
              company_id: participant.company_id,
              workspace_id: participant.workspace_id,
              id: participant.id,
            },
          );
          if (isMember) {
            hasOneMembership = true;
            break;
          }
        } else if (participant.type === "user") {
          if (participant.id === context.user.id) {
            hasOneMembership = true;
            break;
          }
        }
      }
      if (!hasOneMembership) {
        throw CrudException.notFound("You can't post in this thread");
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
        entity = await gr.services.messages.messages.includeUsersInMessage(entity, context);
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
        getMessageInstance({
          thread_id: request.params.thread_id,
          id: request.params.message_id,
        }),
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
        getMessageInstance({
          thread_id: request.params.thread_id,
          id: request.params.message_id,
        }),
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
        resource = await gr.services.messages.messages.includeUsersInMessage(resource, context);
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
          entities.push(await gr.services.messages.messages.includeUsersInMessage(msg, context));
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

  async download(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        thread_id: string;
        message_id: string;
        message_file_id: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<{ status: "ok" }> {
    const context = getThreadExecutionContext(request);
    try {
      await gr.services.messages.messages.download(
        {
          id: request.params.message_id,
          thread_id: request.params.thread_id,
          message_file_id: request.params.message_file_id,
        },
        {},
        context,
      );
      return {
        status: "ok",
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  /**
   * Delete link preview handler
   *
   * @param {FastifyRequest} request - The request object
   * @param {FastifyReply} reply - The reply object
   * @returns {Promise<ResourceUpdateResponse<Message>>} - The response object
   */
  async deleteLinkPreview(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        thread_id: string;
        message_id: string;
        encoded_url: string;
      };
      Body: {
        url: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceUpdateResponse<Message>> {
    const context = getThreadExecutionContext(request);
    try {
      const result = await gr.services.messages.messages.deleteLinkPreview(
        {
          message_id: request.params.message_id,
          thread_id: request.params.thread_id,
          link: request.body.url,
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

  /**
   * Mark messages as seen
   *
   * @param {FastifyRequest} request - The request object
   * @param {FastifyReply} reply - The reply object
   * @returns {Promise<boolean>} - The response promise
   */
  async read(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        workspace_id: string;
      };
      Body: MessageReadType;
    }>,
    reply: FastifyReply,
  ): Promise<boolean> {
    try {
      const { messages, channel_id } = request.body;
      const context: CompanyExecutionContext = {
        company: { id: request.params.company_id },
        user: request.currentUser,
        url: request.url,
        method: request.routerMethod,
        reqId: request.id,
        transport: "http",
      };

      const result = await gr.services.messages.messages.read(messages, {
        ...context,
        channel_id,
        workspace_id: request.params.workspace_id,
      });
      return !!result;
    } catch (err) {
      handleError(reply, err);
      return false;
    }
  }

  /**
   * get users who've seen the message
   *
   * @param {FastifyRequest} request - the request object
   * @param {FastifyReply} reply - the reply object
   * @returns {Promise<ResourceListResponse<UserObject>>} - the users list
   */
  async seenBy(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        workspace_id: string;
        thread_id: string;
        message_id: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceListResponse<UserObject>> {
    try {
      const { message_id, workspace_id } = request.params;
      const context = getThreadExecutionContext(request);

      const userIds = await gr.services.messages.messages.listSeenBy(message_id, {
        ...context,
        workspace: { id: workspace_id },
      });

      const users = await Promise.all(userIds.map(id => gr.services.users.get({ id }, context)));
      const resources = await Promise.all(users.map(user => formatUser(user)));

      return {
        resources,
      };
    } catch (error) {
      handleError(reply, error);
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
