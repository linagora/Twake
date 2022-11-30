import { FastifyRequest } from "fastify";
import { logger } from "src/core/platform/framework";
import { Pagination } from "src/core/platform/framework/api/crud-service";
import globalResolver from "src/services/global-resolver";
import {
  PaginationQueryParameters,
  ResourceDeleteResponse,
  ResourceGetResponse,
} from "src/utils/types";
import { DriveFile } from "../../entities/drive-file";
import { CompanyExecutionContext } from "../../types";

type RequestParams = {
  company_id: string;
};

type ItemRequestParams = RequestParams & {
  id: string;
};

export class DocumentsController {
  create = async (request: FastifyRequest<{ Params: RequestParams }>) => {
    const context = getCompanyExecutionContext(request);
    return {};
  };

  delete = async (
    request: FastifyRequest<{ Params: ItemRequestParams }>,
  ): Promise<ResourceDeleteResponse> => {
    const context = getCompanyExecutionContext(request);

    try {
      await globalResolver.services.documents.delete(request.params.id, context);

      return {
        status: "success",
      };
    } catch (error) {
      logger.error("failed to delete drive item", error);

      return {
        status: "error",
      };
    }
  };

  get = async (
    request: FastifyRequest<{ Params: ItemRequestParams; Querystring: PaginationQueryParameters }>,
  ): Promise<ResourceGetResponse<DriveFile[]>> => {
    const context = getCompanyExecutionContext(request);

    const { id } = request.params;
    const items = await globalResolver.services.documents.get(
      id,
      new Pagination(request.query.page_token, request.query.limit),
      context,
    );

    return {
      resource: items.getEntities(),
    };
  };

  update = async (request: FastifyRequest<{ Params: ItemRequestParams }>) => {
    const context = getCompanyExecutionContext(request);
    return {};
  };

  updateVersion = async (request: FastifyRequest<{ Params: ItemRequestParams }>) => {
    const context = getCompanyExecutionContext(request);
    return {};
  };
}

/**
 * Gets the company execution context
 *
 * @param { FastifyRequest<{ Params: { company_id: string } }>} req
 * @returns {CompanyExecutionContext}
 */
const getCompanyExecutionContext = (
  req: FastifyRequest<{ Params: { company_id: string } }>,
): CompanyExecutionContext => ({
  user: req.currentUser,
  company: { id: req.params.company_id },
  url: req.url,
  method: req.routerMethod,
  reqId: req.id,
  transport: "http",
});
