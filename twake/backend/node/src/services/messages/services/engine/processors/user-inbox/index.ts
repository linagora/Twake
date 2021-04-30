import { MessageLocalEvent } from "../../../../types";
import { MessageServiceAPI } from "../../../../api";
import { DatabaseServiceAPI } from "../../../../../../core/platform/services/database/api";
import { Thread } from "../../../../entities/threads";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import { MessageUserInboxRef } from "../../../../entities/message-user-inbox-refs";

export class UserInboxViewProcessor {
  repository: Repository<MessageUserInboxRef>;

  constructor(readonly database: DatabaseServiceAPI, readonly service: MessageServiceAPI) {}

  async init() {
    this.repository = await this.database.getRepository<MessageUserInboxRef>(
      "message_user_inbox_refs",
      MessageUserInboxRef,
    );
  }

  async process(thread: Thread, message: MessageLocalEvent): Promise<void> {}
}
