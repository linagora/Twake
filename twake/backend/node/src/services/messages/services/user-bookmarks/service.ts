import {
  SaveResult,
  DeleteResult,
  ListResult,
  OperationType,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import { RealtimeDeleted, RealtimeSaved, TwakeContext } from "../../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { MessageUserBookmarksServiceAPI } from "../../api";
import { getInstance, UserMessageBookmark } from "../../entities/user-message-bookmarks";
import { CompanyExecutionContext } from "../../types";
import { ResourcePath } from "../../../../core/platform/services/realtime/types";
import { getUserBookmarksWebsocketRoom } from "../../web/realtime";

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
    pk: Pick<UserMessageBookmark, "company_id" | "user_id" | "id">,
    context?: CompanyExecutionContext,
  ): Promise<UserMessageBookmark> {
    return this.repository.findOne(pk);
  }

  @RealtimeSaved<UserMessageBookmark>((bookmark, context) => [
    {
      room: ResourcePath.get(getUserBookmarksWebsocketRoom(context as CompanyExecutionContext)),
      path: getUserBookmarksWebsocketRoom(context as CompanyExecutionContext) + "/" + bookmark.id,
    },
  ])
  async save<SaveOptions>(
    item: Pick<UserMessageBookmark, "name" | "id">,
    options?: SaveOptions,
    context?: CompanyExecutionContext,
  ): Promise<SaveResult<UserMessageBookmark>> {
    //Disallow duplicates
    const entities = (await this.list(null, {}, context)).getEntities();
    for (const entity of entities) {
      if (item.name === entity.name) {
        return new SaveResult<UserMessageBookmark>(
          "user_message_bookmark",
          entity,
          OperationType.EXISTS,
        );
      }
    }

    const instance = getInstance({
      company_id: context.company.id,
      user_id: context.user.id,
      ...item,
    });
    await this.repository.save(instance);
    return new SaveResult<UserMessageBookmark>(
      "user_message_bookmark",
      instance,
      item.id ? OperationType.UPDATE : OperationType.CREATE,
    );
  }

  @RealtimeDeleted<UserMessageBookmark>((bookmark, context) => [
    {
      room: ResourcePath.get(getUserBookmarksWebsocketRoom(context as CompanyExecutionContext)),
      path: getUserBookmarksWebsocketRoom(context as CompanyExecutionContext) + "/" + bookmark.id,
    },
  ])
  async delete(
    pk: Pick<UserMessageBookmark, "company_id" | "user_id" | "id">,
    context?: CompanyExecutionContext,
  ): Promise<DeleteResult<UserMessageBookmark>> {
    const instance = await this.repository.findOne(pk);
    if (instance) await this.repository.remove(instance);
    return new DeleteResult<UserMessageBookmark>("user_message_bookmark", instance, !!instance);
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
