import { FindOptions } from "../../../core/platform/services/database/services/orm/repository/repository";
import { Pagination } from "../../../core/platform/framework/api/crud-service";

export const buildMessageListPagination = (
  pagination: Pagination,
  messageIdKey: string,
): FindOptions => {
  const offset = pagination.page_token;
  pagination = { ...pagination, page_token: null };
  return {
    pagination,
    ...(!!offset && pagination.reversed && { $lte: [[messageIdKey, offset]] }),
    ...(!!offset && !pagination.reversed && { $gte: [[messageIdKey, offset]] }),
  };
};
