import { CrudController } from "../../../../core/platform/services/webserver/types";
import { getWorkspaceRooms } from "../../realtime";
import { Pagination } from "../../../../core/platform/framework/api/crud-service";
import { ChannelMember } from "../../entities";
import { ChannelPrimaryKey, MemberService } from "../../provider";
import {
  ChannelCreateResponse,
  ChannelDeleteResponse,
  ChannelGetResponse,
  ChannelListResponse,
  ChannelMemberParameters,
  ChannelParameters,
  PaginationQueryParameters,
} from "../types";
import { FastifyRequest } from "fastify";
import { getExecutionContext } from ".";

export class ChannelMemberCrudController
  implements
    CrudController<
      ChannelGetResponse<ChannelMember>,
      ChannelCreateResponse<ChannelMember>,
      ChannelListResponse<ChannelMember>,
      ChannelDeleteResponse
    > {
  constructor(protected service: MemberService) {}

  getPrimaryKey(request: FastifyRequest<{ Params: ChannelMemberParameters }>): ChannelPrimaryKey {
    return {
      id: request.params.id,
      company_id: request.params.company_id,
      workspace_id: request.params.workspace_id,
    };
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
