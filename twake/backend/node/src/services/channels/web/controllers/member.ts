import { CrudController } from "../../../../core/platform/services/webserver/types";
import { Pagination } from "../../../../core/platform/framework/api/crud-service";
import { ChannelMember, ChannelMemberPrimaryKey } from "../../entities";
import { MemberService } from "../../provider";
import {
  ChannelMemberParameters,
  ChannelParameters,
  CreateChannelMemberBody,
  PaginationQueryParameters,
  UpdateChannelMemberBody,
} from "../types";
import { FastifyReply, FastifyRequest } from "fastify";
import { ChannelExecutionContext } from "../../types";
import { plainToClass } from "class-transformer";
import { handleError } from "../../../../utils/handleError";
import { getChannelRooms } from "../../services/member/realtime";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
  ResourceUpdateResponse,
  User,
} from "../../../../utils/types";
import { RealtimeServiceAPI } from "../../../../core/platform/services/realtime/api";

export class ChannelMemberCrudController
  implements
    CrudController<
      ResourceGetResponse<ChannelMember>,
      ResourceCreateResponse<ChannelMember>,
      ResourceListResponse<ChannelMember>,
      ResourceDeleteResponse
    >
{
  constructor(protected websockets: RealtimeServiceAPI, protected service: MemberService) {}

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
  ): Promise<ResourceGetResponse<ChannelMember>> {
    if (!isCurrentUser(request.params.member_id, request.currentUser)) {
      reply.badRequest("User does not have enough rights to get member");

      return;
    }

    const resource = await this.service.get(
      this.getPrimaryKey(request),
      getExecutionContext(request),
    );

    if (!resource) {
      reply.notFound(`Channel member ${request.params.member_id} not found`);

      return;
    }

    return {
      resource,
    };
  }

  async save(
    request: FastifyRequest<{ Body: CreateChannelMemberBody; Params: ChannelMemberParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceCreateResponse<ChannelMember>> {
    const entity = plainToClass(ChannelMember, {
      ...request.body.resource,
      ...{
        company_id: request.params.company_id,
        workspace_id: request.params.workspace_id,
        channel_id: request.params.id,
      },
    });

    try {
      const result = await this.service.save(entity, {}, getExecutionContext(request));

      if (result.entity) {
        reply.code(201);
      }

      return {
        resource: result.entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async update(
    request: FastifyRequest<{ Body: UpdateChannelMemberBody; Params: ChannelMemberParameters }>,
    reply: FastifyReply,
  ): Promise<ResourceUpdateResponse<ChannelMember>> {
    const entity = plainToClass(ChannelMember, {
      ...request.body.resource,
      ...this.getPrimaryKey(request),
    });

    if (!isCurrentUser(entity.user_id, request.currentUser)) {
      reply.badRequest("Current user can not update this member");

      return;
    }

    try {
      const result = await this.service.save(entity, {}, getExecutionContext(request));

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
  ): Promise<ResourceDeleteResponse> {
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
      Querystring: PaginationQueryParameters & { company_role?: string };
      Params: ChannelParameters;
    }>,
  ): Promise<ResourceListResponse<ChannelMember>> {
    const list = await this.service.list(
      new Pagination(request.query.page_token, request.query.limit),
      { company_role: request.query.company_role },
      getExecutionContext(request),
    );

    return {
      ...{
        resources: list.getEntities(),
      },
      ...(request.query.websockets && {
        websockets: this.websockets.sign(
          getChannelRooms(request.params, request.currentUser),
          request.currentUser.id,
        ),
      }),
      ...(list.page_token && {
        next_page_token: list.page_token,
      }),
    };
  }

  /**
   *
   * @param request Private exists
   * @param reply
   */
  async exists(
    request: FastifyRequest<{ Params: ChannelMemberParameters }>,
    reply: FastifyReply,
  ): Promise<Response> {
    const resource = await this.service.get(
      this.getPrimaryKey(request),
      getExecutionContext(request),
    );

    if (!resource) {
      return reply.status(200).send({ has_access: false });
    }

    return reply.status(200).send({ has_access: true });
  }
}

function getExecutionContext(
  request: FastifyRequest<{ Params: ChannelParameters }>,
): ChannelExecutionContext {
  return {
    user: request.currentUser,
    url: request.url,
    method: request.routerMethod,
    reqId: request.id,
    transport: "http",
    channel: {
      id: request.params.id,
      company_id: request.params.company_id,
      workspace_id: request.params.workspace_id,
    },
  };
}

function isCurrentUser(memberId: string, user: User): boolean {
  return memberId && memberId === user.id;
}
