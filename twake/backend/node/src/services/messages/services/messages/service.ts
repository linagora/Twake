import {
  SaveResult,
  OperationType,
  DeleteResult,
  ListResult,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import { ResourcePath } from "../../../../core/platform/services/realtime/types";
import { RealtimeDeleted, RealtimeSaved, TwakeContext } from "../../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { MessageServiceAPI, MessageThreadMessagesServiceAPI } from "../../api";
import { getInstance, Message } from "../../entities/messages";
import { ThreadExecutionContext } from "../../types";
import { getThreadMessageWebsocketRoom } from "../../web/realtime";

export class ThreadMessagesService implements MessageThreadMessagesServiceAPI {
  version: "1";
  repository: Repository<Message>;

  constructor(private database: DatabaseServiceAPI, private service: MessageServiceAPI) {}

  async init(context: TwakeContext): Promise<this> {
    this.repository = await this.database.getRepository<Message>("message", Message);
    return this;
  }

  get(
    pk: Pick<Message, "company_id" | "thread_id" | "id">,
    context?: ThreadExecutionContext,
  ): Promise<Message> {
    return this.repository.findOne(pk);
  }

  @RealtimeSaved<Message>((bookmark, context) => [
    {
      room: ResourcePath.get(getThreadMessageWebsocketRoom(context as ThreadExecutionContext)),
      path: getThreadMessageWebsocketRoom(context as ThreadExecutionContext) + "/" + bookmark.id,
    },
  ])
  async save<SaveOptions>(
    item: Message,
    options?: SaveOptions,
    context?: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    return new SaveResult<Message>("message", null, OperationType.CREATE);
  }

  @RealtimeDeleted<Message>((bookmark, context) => [
    {
      room: ResourcePath.get(getThreadMessageWebsocketRoom(context as ThreadExecutionContext)),
      path: getThreadMessageWebsocketRoom(context as ThreadExecutionContext) + "/" + bookmark.id,
    },
  ])
  async delete(pk: Message, context?: ThreadExecutionContext): Promise<DeleteResult<Message>> {
    const instance = await this.repository.findOne(pk);
    if (instance) await this.repository.remove(instance);
    return new DeleteResult<Message>("message", instance, !!instance);
  }

  async list<ListOption>(
    pagination: Pagination,
    options?: ListOption,
    context?: ThreadExecutionContext,
  ): Promise<ListResult<Message>> {
    const list = await this.repository.find(
      { user_id: context.user.id, company_id: context.thread.company_id },
      { pagination },
    );
    return list;
  }
}
