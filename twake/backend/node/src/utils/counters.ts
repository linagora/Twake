import { Column } from "../core/platform/services/database/services/orm/decorators";
import Repository from "../core/platform/services/database/services/orm/repository/repository";
import { ExecutionContext, Pagination } from "../core/platform/framework/api/crud-service";
import { isMatch } from "lodash";

export const countRepositoryItems = async (
  repository: Repository<any>,
  pk: any,
  filter: any = {},
  context?: ExecutionContext,
) => {
  let pagination: Pagination = { limitStr: "100" };
  let total = 0;
  do {
    const listResult = await repository.find(pk, { pagination }, context);
    listResult.filterEntities(a => isMatch(a, filter));
    total += listResult.getEntities().length;
    pagination = listResult.nextPage as Pagination;
  } while (pagination.page_token);
  return total;
};
