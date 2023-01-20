import { FastifyReply, FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../../utils/types";
import { Tags } from "../../entities";
import gr from "../../../global-resolver";
import { ExecutionContext } from "src/core/platform/framework/api/crud-service";
import { handleError } from "../../../../utils/handleError";

export class TagsController
  implements
    CrudController<
      ResourceGetResponse<Tags>,
      ResourceCreateResponse<Tags>,
      ResourceListResponse<Tags>,
      ResourceDeleteResponse
    >
{
  async get(
    request: FastifyRequest<{ Params: { company_id: string; tag_id: string } }>,
  ): Promise<ResourceGetResponse<Tags>> {
    const tag = await gr.services.tags.get({
      company_id: request.params.company_id,
      tag_id: request.params.tag_id,
    });
    return { resource: tag };
  }

  async list(
    request: FastifyRequest<{ Params: { company_id: string } }>,
  ): Promise<ResourceListResponse<Tags>> {
    const list = await gr.services.tags.list({
      company_id: request.params.company_id,
    });
    const resources = list.getEntities();
    return { resources };
  }

  async save(
    request: FastifyRequest<{
      Params: { company_id: string; tag_id?: string };
      Body: { name: string; colour: string };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceCreateResponse<Tags>> {
    const context = getExecutionContext(request);
    const tag_id = request.params.tag_id ? request.params.tag_id : "";

    const entity = {
      company_id: request.params.company_id,
      tag_id: tag_id,
      name: request.body.name,
      colour: request.body.colour,
    };

    try {
      const save_result = await gr.services.tags.save(entity, context);

      if (save_result) {
        reply.code(201);
      }

      return {
        resource: save_result.entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async delete(
    request: FastifyRequest<{ Params: { company_id: string; tag_id: string } }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    const context = getExecutionContext(request);

    try {
      const deleteResult = await gr.services.tags.delete(
        {
          company_id: request.params.company_id,
          tag_id: request.params.tag_id,
        },
        context,
      );

      if (deleteResult.deleted) {
        reply.code(204);
        return {
          status: "success",
        };
      }
    } catch (err) {
      handleError(reply, err);
    }
  }
}

function getExecutionContext(request: FastifyRequest): ExecutionContext {
  return {
    user: request.currentUser,
    url: request.url,
    method: request.routerMethod,
    transport: "http",
  };
}
