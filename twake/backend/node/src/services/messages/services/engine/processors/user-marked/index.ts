import { MessageLocalEvent } from "../../../../types";
import { MessageServiceAPI } from "../../../../api";
import { DatabaseServiceAPI } from "../../../../../../core/platform/services/database/api";
import { Thread } from "../../../../entities/threads";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import { MessageUserMarkedRef } from "../../../../entities/message-user-marked_refs";

export class UserMarkedViewProcessor {
  repository: Repository<MessageUserMarkedRef>;

  constructor(readonly database: DatabaseServiceAPI, readonly service: MessageServiceAPI) {}

  async init() {
    this.repository = await this.database.getRepository<MessageUserMarkedRef>(
      "message_user_marked_refs",
      MessageUserMarkedRef,
    );
  }

  async process(thread: Thread, message: MessageLocalEvent): Promise<void> {}
}
