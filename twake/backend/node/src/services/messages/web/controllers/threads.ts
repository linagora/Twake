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

export class ThreadsController
  implements
    CrudController<
      ResourceGetResponse<Message>,
      ResourceCreateResponse<Message>,
      ResourceListResponse<Message>,
      ResourceDeleteResponse
    > {
  constructor(protected service: MessageServiceAPI) {}

  async save(request: FastifyRequest<{}>): Promise<ResourceCreateResponse<Message>> {
    return new ResourceCreateResponse();
  }
}
