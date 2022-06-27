import { CrudController } from "../../../../core/platform/services/webserver/types";
import { CrudException, Pagination } from "../../../../core/platform/framework/api/crud-service";
import { ChannelMember, ChannelMemberPrimaryKey, ChannelMemberWithUser } from "../../entities";
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
import gr from "../../../global-resolver";
import { formatUser } from "../../../../utils/users";

export class ChannelMemberCrudController
  implements
    CrudController<
      ResourceGetResponse<ChannelMember>,
      ResourceCreateResponse<ChannelMember>,
      ResourceListResponse<ChannelMember>,
      ResourceDeleteResponse
    >
{
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
      throw CrudException.badRequest("User does not have enough rights to get member");
    }

    const resource = await gr.services.channels.members.get(
      this.getPrimaryKey(request),
      getExecutionContext(request),
    );

    if (!resource) {
      throw CrudException.notFound(`Channel member ${request.params.member_id} not found`);
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
      const result = await gr.services.channels.members.save(
        entity,
        {},
        getExecutionContext(request),
      );

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
      throw CrudException.badRequest("Current user can not update this member");
    }

    try {
      const result = await gr.services.channels.members.save(
        entity,
        {},
        getExecutionContext(request),
      );

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
      const deleteResult = await gr.services.channels.members.delete(
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
      Querystring: PaginationQueryParameters & { company_role?: string; search?: string };
      Params: ChannelParameters;
    }>,
  ): Promise<ResourceListResponse<ChannelMemberWithUser>> {
    let list: ChannelMember[] = [];
    let nextPageToken: string = null;
    const resources = [];
    const context = getExecutionContext(request);

    if (request.query.search) {
      const users = await gr.services.users.search(
        new Pagination(request.query.page_token, request.query.limit),
        {
          search: request.query.search,
          companyId: request.params.company_id,
        },
        context,
      );

      nextPageToken = users.nextPage?.page_token;

      for (const user of users.getEntities()) {
        const channelMember = await gr.services.channels.members.getChannelMember(user, {
          company_id: request.params.company_id,
          workspace_id: request.params.workspace_id,
          id: request.params.id,
        });

        if (channelMember) {
          list.push(channelMember);
        }
      }
    } else {
      const channelMembers = await gr.services.channels.members.list(
        new Pagination(request.query.page_token, request.query.limit),
        { company_role: request.query.company_role },
        context,
      );

      nextPageToken = channelMembers.nextPage?.page_token;
      list = channelMembers.getEntities();
    }

    for (const member of list) {
      if (member) {
        const user = await formatUser(await gr.services.users.get({ id: member.user_id }), {
          includeCompanies: true,
        });
        resources.push({ ...member, user });
      }
    }

    return {
      ...{
        resources,
      },
      ...(request.query.websockets && {
        websockets: gr.platformServices.realtime.sign(
          getChannelRooms(request.params, request.currentUser),
          request.currentUser.id,
        ),
      }),
      next_page_token: nextPageToken,
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
    const resource = await gr.services.channels.members.get(
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
