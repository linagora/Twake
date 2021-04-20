import { FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import { MessageServiceAPI } from "../../api";
import {
  ResourceUpdateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../../services/types";
import { UserMessageBookmark } from "../../entities/user-message-bookmarks";

export class UserBookmarksController
  implements
    CrudController<
      ResourceGetResponse<UserMessageBookmark>,
      ResourceUpdateResponse<UserMessageBookmark>,
      ResourceListResponse<UserMessageBookmark>,
      ResourceDeleteResponse
    > {
  constructor(protected service: MessageServiceAPI) {}

  async save(request: FastifyRequest<{}>): Promise<ResourceUpdateResponse<UserMessageBookmark>> {
    return new ResourceUpdateResponse();
  }

  async delete(request: FastifyRequest<{}>): Promise<ResourceDeleteResponse> {
    return new ResourceDeleteResponse();
  }

  async list(request: FastifyRequest<{}>): Promise<ResourceListResponse<UserMessageBookmark>> {
    return new ResourceListResponse();
  }
}
