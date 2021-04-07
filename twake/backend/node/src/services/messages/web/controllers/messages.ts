import { FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import { MessageServiceAPI } from "../../api";
import {
  ResourceUpdateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../types";
import { Message } from "../../entities/messages";

export class MessagesController
  implements
    CrudController<
      ResourceGetResponse<Message>,
      ResourceUpdateResponse<Message>,
      ResourceListResponse<Message>,
      ResourceDeleteResponse
    > {
  constructor(protected service: MessageServiceAPI) {}

  async save(request: FastifyRequest<{}>): Promise<ResourceUpdateResponse<Message>> {
    return new ResourceUpdateResponse();
  }

  async list(request: FastifyRequest<{}>): Promise<ResourceListResponse<Message>> {
    return new ResourceListResponse();
  }

  async reaction(request: FastifyRequest<{}>): Promise<ResourceUpdateResponse<Message>> {
    return new ResourceUpdateResponse();
  }

  async bookmark(request: FastifyRequest<{}>): Promise<ResourceUpdateResponse<Message>> {
    return new ResourceUpdateResponse();
  }

  async pin(request: FastifyRequest<{}>): Promise<ResourceUpdateResponse<Message>> {
    return new ResourceUpdateResponse();
  }
}
