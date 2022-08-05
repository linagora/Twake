import {
  DeleteResult,
  ExecutionContext,
  ListResult,
  OperationType,
  Pagination,
  SaveResult,
} from "../../../core/platform/framework/api/crud-service";
import {
  Initializable,
  RealtimeDeleted,
  RealtimeSaved,
  TwakeContext,
  TwakeServiceProvider,
} from "../../../core/platform/framework";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { getInstance, UserMessageBookmark } from "../entities/user-message-bookmarks";
import { CompanyExecutionContext } from "../types";
import { ResourcePath } from "../../../core/platform/services/realtime/types";
import { getUserBookmarksWebsocketRoom } from "../web/realtime";
import gr from "../../global-resolver";

export class UserBookmarksService implements TwakeServiceProvider, Initializable {
  version: "1";
  repository: Repository<UserMessageBookmark>;

  async init(context: TwakeContext): Promise<this> {
    this.repository = await gr.database.getRepository<UserMessageBookmark>(
      "user_message_bookmarks",
      UserMessageBookmark,
    );
    return this;
  }

  get(
    pk: Pick<UserMessageBookmark, "company_id" | "user_id" | "id">,
    context: CompanyExecutionContext,
  ): Promise<UserMessageBookmark> {
    return this.repository.findOne(pk, {}, context);
  }

  @RealtimeSaved<UserMessageBookmark>((bookmark, context) => [
    {
      room: ResourcePath.get(getUserBookmarksWebsocketRoom(context as CompanyExecutionContext)),
      path: getUserBookmarksWebsocketRoom(context as CompanyExecutionContext) + "/" + bookmark.id,
    },
  ])
  async save(
    { company_id, user_id, id, name }: SaveParams,
    context: CompanyExecutionContext,
  ): Promise<SaveResult<UserMessageBookmark>> {
    //Disallow duplicates
    const entities = (await this.list({ user_id, company_id }, context)).getEntities();

    for (const entity of entities) {
      if (name === entity.name) {
        return new SaveResult<UserMessageBookmark>(
          "user_message_bookmark",
          entity,
          OperationType.EXISTS,
        );
      }
    }

    const instance = getInstance({
      company_id: company_id,
      user_id: user_id,
      name,
    });
    if (id) {
      instance.id = id;
    }
    await this.repository.save(instance, context);

    return new SaveResult<UserMessageBookmark>(
      "user_message_bookmark",
      instance,
      id ? OperationType.UPDATE : OperationType.CREATE,
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
    const instance = await this.repository.findOne(pk, {}, context);
    if (instance) await this.repository.remove(instance, context);
    return new DeleteResult<UserMessageBookmark>("user_message_bookmark", instance, !!instance);
  }

  async list(
    { user_id, company_id, pagination }: ListParams,
    context: ExecutionContext,
  ): Promise<ListResult<UserMessageBookmark>> {
    return this.repository.find({ user_id, company_id }, { pagination }, context);
  }
}

type SaveParams = { user_id: string; company_id: string; name: string; id: string; test?: string };

type ListParams = {
  company_id: string;
  user_id: string;
  pagination?: Pagination;
};
