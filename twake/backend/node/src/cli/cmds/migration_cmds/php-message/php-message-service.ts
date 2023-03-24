import {
  DeleteResult,
  ExecutionContext,
  ListResult,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import Repository, {
  FindFilter,
} from "../../../../core/platform/services/database/services/orm/repository/repository";
import { PhpMessagesServiceAPI } from "./types";
import { PhpMessage, PhpMessagePrimaryKey } from "./php-message-entity";
import gr from "../../../../services/global-resolver";

export interface PhpMessageExecutionContext extends ExecutionContext {
  channel_id: string;
  parent_message_id?: string;
  id?: string;
}

export class PhpMessagesService implements PhpMessagesServiceAPI {
  version: "1";
  public repository: Repository<PhpMessage>;

  async init(): Promise<this> {
    this.repository = await gr.database.getRepository<PhpMessage>("message", PhpMessage);
    return this;
  }

  get(pk: { parent_message_id?: string; channel_id?: string; id: string }): Promise<PhpMessage> {
    if (pk.channel_id) {
      pk.channel_id = `${pk.channel_id}`;
      pk.channel_id.substring(0, 14) + "1" + pk.channel_id.substring(14 + 1);
    }
    return this.repository.findOne(pk, {}, undefined);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(pk: PhpMessagePrimaryKey): Promise<DeleteResult<PhpMessage>> {
    throw Error("not implemented");
  }

  async list<ListOptions>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    pagination: Pagination,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: ListOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: PhpMessageExecutionContext,
  ): Promise<ListResult<PhpMessage>> {
    const findFilter: FindFilter = {
      channel_id: context.channel_id,
      parent_message_id: context.parent_message_id,
      //id: context.id,
    };

    const list = await this.repository.find(findFilter, { pagination }, undefined);
    return list;
  }
}
