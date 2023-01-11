import { FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../../utils/types";
import { Tags } from "../../entities";
export class TagsController
  implements
    CrudController<
      ResourceGetResponse<Tags>,
      ResourceCreateResponse<Tags>,
      ResourceListResponse<Tags>,
      ResourceDeleteResponse
    >
{
  async get(request: FastifyRequest): Promise<ResourceGetResponse<Tags>> {
    throw new Error("Not implemented" + request);
  }

  async list(request: FastifyRequest): Promise<ResourceListResponse<Tags>> {
    throw new Error("Not implemented" + request);
  }

  async save(request: FastifyRequest): Promise<ResourceCreateResponse<Tags>> {
    throw new Error("Not implemented" + request);
  }

  async update(request: FastifyRequest): Promise<ResourceCreateResponse<Tags>> {
    throw new Error("Not implemented" + request);
  }

  async delete(request: FastifyRequest): Promise<ResourceDeleteResponse> {
    throw new Error("Not implemented" + request);
  }
}
