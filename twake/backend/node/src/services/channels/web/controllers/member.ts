import { CrudController } from "../../../../core/platform/services/webserver/types";
import { getWorkspaceRooms } from "../../realtime";
import { Pagination } from "../../../../core/platform/framework/api/crud-service";
import { ChannelMember, ChannelMemberPrimaryKey } from "../../entities";
import { MemberService } from "../../provider";
import {
  ChannelCreateResponse,
  ChannelDeleteResponse,
  ChannelGetResponse,
  ChannelListResponse,
  ChannelMemberParameters,
  ChannelParameters,
  ChannelUpdateResponse,
  CreateChannelMemberBody,
  PaginationQueryParameters,
  UpdateChannelMemberBody,
} from "../types";
import { FastifyReply, FastifyRequest } from "fastify";
import { ChannelExecutionContext } from "../../types";
import { plainToClass } from "class-transformer";
import { handleError } from ".";

export class ChannelMemberCrudController
  implements
    CrudController<
      ChannelGetResponse<ChannelMember>,
      ChannelCreateResponse<ChannelMember>,
      ChannelListResponse<ChannelMember>,
      ChannelDeleteResponse
    > {
  constructor(protected service: MemberService) {}

  getPrimaryKey(
    request: FastifyRequest<{ Params: ChannelMemberParameters }>,
  ): ChannelMemberPrimaryKey {
    return {
      user_id: request.params.member_id,
      channel_id: request.params.id,
      company_id: request.params.company_id,
      workspace_id: request.params.workspace_id,
    };
  }

  async get(
    request: FastifyRequest<{ Params: ChannelMemberParameters }>,
    reply: FastifyReply,
  ): Promise<ChannelGetResponse<ChannelMember>> {
    const resource = await this.service.get(
      this.getPrimaryKey(request),
      getExecutionContext(request),
    );

    if (!resource) {
      reply.notFound(`Channel member ${request.params.member_id} not found`);

      return;
    }

    return {
      websocket: {
        room: "/TODO",
      },
      resource,
    };
  }

  async save(
    request: FastifyRequest<{ Body: CreateChannelMemberBody; Params: ChannelMemberParameters }>,
    reply: FastifyReply,
  ): Promise<ChannelCreateResponse<ChannelMember>> {
    const entity = plainToClass(ChannelMember, {
      ...request.body.resource,
      ...{
        company_id: request.params.company_id,
        workspace_id: request.params.workspace_id,
        channel_id: request.params.id,
      },
    });

    try {
      const result = await this.service.save(entity, getExecutionContext(request));

      if (result.entity) {
        reply.code(201);
      }

      return {
        websocket: {
          room: "/TODO",
        },
        resource: result.entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async update(
    request: FastifyRequest<{ Body: UpdateChannelMemberBody; Params: ChannelMemberParameters }>,
    reply: FastifyReply,
  ): Promise<ChannelUpdateResponse<ChannelMember>> {
    const entity = plainToClass(ChannelMember, {
      ...request.body.resource,
      ...this.getPrimaryKey(request),
    });

    try {
      const result = await this.service.save(entity, getExecutionContext(request));

      if (result.entity) {
        reply.code(200);
      }

      return {
        resource: result.entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async delete(
    request: FastifyRequest<{ Params: ChannelMemberParameters }>,
    reply: FastifyReply,
  ): Promise<ChannelDeleteResponse> {
    try {
      const deleteResult = await this.service.delete(
        this.getPrimaryKey(request),
        getExecutionContext(request),
      );

      if (deleteResult.deleted) {
        reply.code(204);

        return {
          status: "success",
        };
      }

      return {
        status: "error",
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  /**
   * List channel members
   *
   * @param request
   */
  async list(
    request: FastifyRequest<{
      Querystring: PaginationQueryParameters;
      Params: ChannelParameters;
    }>,
  ): Promise<ChannelListResponse<ChannelMember>> {
    const list = await this.service.list(
      new Pagination(request.query.page_token, request.query.max_results),
      getExecutionContext(request),
    );

    return {
      ...{
        resources: list.entities || [],
      },
      ...(request.query.websockets && {
        websockets: getWorkspaceRooms(request.params, request.currentUser, true),
      }),
      ...(list.page_token && {
        next_page_token: list.page_token,
      }),
    };
  }
}

function getExecutionContext(
  request: FastifyRequest<{ Params: ChannelParameters }>,
): ChannelExecutionContext {
  return {
    user: request.currentUser,
    url: request.url,
    method: request.routerMethod,
    transport: "http",
    channel: {
      id: request.params.id,
      company_id: request.params.company_id,
      workspace_id: request.params.workspace_id,
    },
  };
}
