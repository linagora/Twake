import { plainToClass } from "class-transformer";
import { FastifyReply, FastifyRequest } from "fastify";
import { HttpErrorCodes } from "fastify-sensible/lib/httpError";
import { CrudExeption, Pagination } from "../../../core/platform/framework/api/crud-service";
import { CrudController } from "../../../core/platform/services/webserver/types";
import { Channel } from "../entities";
import ChannelServiceAPI, { ChannelPrimaryKey } from "../provider";
import { getWebsocketInformation, getWorkspaceRooms } from "../realtime";
import { WorkspaceExecutionContext } from "../types";
import {
  BaseChannelsParameters,
  ChannelCreateResponse,
  ChannelDeleteResponse,
  ChannelGetResponse,
  ChannelListQueryParameters,
  ChannelListResponse,
  ChannelParameters,
  ChannelUpdateResponse,
  CreateChannelBody,
  UpdateChannelBody,
} from "./types";

export class ChannelCrudController
  implements
    CrudController<
      ChannelGetResponse,
      ChannelCreateResponse,
      ChannelListResponse,
      ChannelDeleteResponse
    > {
  constructor(protected service: ChannelServiceAPI) {}

  getExecutionContext(
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

  getPrimaryKey(request: FastifyRequest<{ Params: ChannelParameters }>): ChannelPrimaryKey {
    return {
      id: request.params.id,
      company_id: request.params.company_id,
      workspace_id: request.params.workspace_id,
    };
  }

  async get(
    request: FastifyRequest<{ Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<ChannelGetResponse> {
    const resource = await this.service.get(
      this.getPrimaryKey(request),
      this.getExecutionContext(request),
    );

    if (!resource) {
      throw reply.notFound(`Channel ${request.params.id} not found`);
    }

    return {
      websocket: getWebsocketInformation(resource),
      resource,
    };
  }

  async save(
    request: FastifyRequest<{ Body: CreateChannelBody; Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<ChannelCreateResponse> {
    const entity = plainToClass(Channel, {
      ...request.body.resource,
      ...{
        company_id: request.params.company_id,
        workspace_id: request.params.workspace_id,
      },
    });

    try {
      const result = await this.service.save(entity, this.getExecutionContext(request));

      if (result.entity) {
        reply.code(201);
      }

      return {
        websocket: getWebsocketInformation(result.entity),
        resource: result.entity,
      };
    } catch (err) {
      this.handleError(reply, err);
    }
  }

  async update(
    request: FastifyRequest<{ Body: UpdateChannelBody; Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<ChannelUpdateResponse> {
    const entity = plainToClass(Channel, {
      ...request.body.resource,
      ...{
        company_id: request.params.company_id,
        workspace_id: request.params.workspace_id,
        id: request.params.id,
      },
    });

    try {
      const result = await this.service.save(entity, this.getExecutionContext(request));

      if (result.entity) {
        reply.code(201);
      }

      return {
        websocket: getWebsocketInformation(result.entity),
        resource: result.entity,
      };
    } catch (err) {
      this.handleError(reply, err);
    }
  }

  async list(
    request: FastifyRequest<{
      Querystring: ChannelListQueryParameters;
      Params: BaseChannelsParameters;
    }>,
  ): Promise<ChannelListResponse> {
    const list = await this.service.list(
      new Pagination(request.query.page_token, request.query.limit),
      this.getExecutionContext(request),
    );

    return {
      ...{
        resources: list.entities || [],
      },
      ...(request.query.websockets && {
        websockets: getWorkspaceRooms(request.params, request.currentUser, request.query.mine),
      }),
      ...(list.page_token && {
        next_page_token: list.page_token,
      }),
    };
  }

  async delete(
    request: FastifyRequest<{ Params: ChannelParameters }>,
    reply: FastifyReply,
  ): Promise<ChannelDeleteResponse> {
    try {
      const deleteResult = await this.service.delete(
        this.getPrimaryKey(request),
        this.getExecutionContext(request),
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
      this.handleError(reply, err);
    }
  }

  handleError(reply: FastifyReply, err: Error): void {
    if (err instanceof CrudExeption) {
      const crudException: CrudExeption = err;
      reply.getHttpError(crudException.status as HttpErrorCodes, crudException.message);
    } else {
      throw err;
    }
  }
}
