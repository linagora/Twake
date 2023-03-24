import { FastifyRequest } from "fastify";
import { Pagination } from "../../../../../core/platform/framework/api/crud-service";
import { PaginationQueryParameters, ResourceListResponse } from "../../../../../utils/types";
import gr from "../../../../global-resolver";
import { PublicFile } from "../../../../../services/files/entities/file";
import { getCompanyExecutionContext } from "../views";
import { FileSearchResult } from "./search-files";

export default async (
  request: FastifyRequest<{
    Params: { company_id: string };
    Querystring: {
      page_token: string;
      limit?: string;
      type?: "user_upload" | "user_download";
      media?: "media_only" | "file_only";
    };
  }>,
): Promise<ResourceListResponse<FileSearchResult>> => {
  const userFiles = await gr.services.messages.views.listUserMarkedFiles(
    request.currentUser.id,
    request.query.type || "both",
    request.query.media || "both",
    getCompanyExecutionContext(request),
    new Pagination(request.query.page_token, String(request.query.limit || 100)),
  );

  return {
    resources: userFiles.getEntities().filter(a => a?.metadata?.external_id) as FileSearchResult[],
    next_page_token: userFiles?.nextPage?.page_token,
  };
};
