import { FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import { MessageServiceAPI } from "../../api";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../../services/types";
import { Message } from "../../entities/messages";

export class ViewsController
  implements
    CrudController<
      ResourceGetResponse<Message>,
      ResourceCreateResponse<Message>,
      ResourceListResponse<Message>,
      ResourceDeleteResponse
    > {
  constructor(protected service: MessageServiceAPI) {}

  async list(request: FastifyRequest<{}>): Promise<ResourceListResponse<Message>> {
    return new ResourceListResponse();
  }

  async listFiles(request: FastifyRequest<{}>): Promise<ResourceListResponse<Message>> {
    return new ResourceListResponse();
  }
}
