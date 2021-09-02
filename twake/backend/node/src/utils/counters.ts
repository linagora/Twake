import { Column } from "../core/platform/services/database/services/orm/decorators";
import Repository from "../core/platform/services/database/services/orm/repository/repository";
import { Pagination } from "../core/platform/framework/api/crud-service";

export class CounterEntity {
  @Column("value", "counter")
  value: number;
}

export const countRepositoryItems = async (repository: Repository<any>, pk: any) => {
  let pagination: Pagination = { limitStr: "100" };
  let total = 0;
  do {
    const listResult = await repository.find(pk, { pagination });
    total += listResult.getEntities().length;
    pagination = listResult.nextPage as Pagination;
  } while (pagination.page_token);
  return total;
};
