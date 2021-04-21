import {
  SaveResult,
  DeleteResult,
  ListResult,
  OperationType,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import { TwakeContext } from "../../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { MessageUserBookmarksServiceAPI } from "../../api";
import { Thread } from "../../entities/threads";
import { getInstance, UserMessageBookmark } from "../../entities/user-message-bookmarks";
import { CompanyExecutionContext } from "../../types";

type UserMessageBookmarkListOptions = {
  user_id: string;
  company_id: string;
};
export class UserBookmarksService implements MessageUserBookmarksServiceAPI {
  version: "1";
  repository: Repository<UserMessageBookmark>;

  constructor(private database: DatabaseServiceAPI) {}

  async init(context: TwakeContext): Promise<this> {
    this.repository = await this.database.getRepository<UserMessageBookmark>(
      "user_message_bookmarks",
      UserMessageBookmark,
    );
    return this;
  }

  get(
    pk: Pick<UserMessageBookmark, "company_id" | "user_id" | "name">,
    context?: CompanyExecutionContext,
  ): Promise<UserMessageBookmark> {
    return this.repository.findOne(pk);
  }
  async save<SaveOptions>(
    item: UserMessageBookmark,
    options?: SaveOptions,
    context?: CompanyExecutionContext,
  ): Promise<SaveResult<UserMessageBookmark>> {
    await this.repository.save(getInstance(item));
    return new SaveResult<UserMessageBookmark>("user_message_bookmark", item, OperationType.CREATE);
  }

  async delete(
    pk: Pick<UserMessageBookmark, "company_id" | "user_id" | "name">,
    context?: CompanyExecutionContext,
  ): Promise<DeleteResult<UserMessageBookmark>> {
    await this.repository.remove(getInstance(pk));
    return new DeleteResult<UserMessageBookmark>("user_message_bookmark", pk, true);
  }

  async list<ListOption>(
    pagination: Pagination,
    options?: ListOption,
    context?: CompanyExecutionContext,
  ): Promise<ListResult<UserMessageBookmark>> {
    const list = await this.repository.find(
      { user_id: context.user.id, company_id: context.company.id },
      { pagination },
    );
    return list;
  }
}
