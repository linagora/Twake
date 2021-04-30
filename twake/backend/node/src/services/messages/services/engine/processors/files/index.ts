import { MessageLocalEvent } from "../../../../types";
import { MessageServiceAPI } from "../../../../api";
import { DatabaseServiceAPI } from "../../../../../../core/platform/services/database/api";
import { Thread } from "../../../../entities/threads";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import { MessageFileRef } from "../../../../entities/message-file-refs";

export class FilesViewProcessor {
  repository: Repository<MessageFileRef>;

  constructor(readonly database: DatabaseServiceAPI, readonly service: MessageServiceAPI) {}

  async init() {
    this.repository = await this.database.getRepository<MessageFileRef>(
      "message_file_refs",
      MessageFileRef,
    );
  }

  async process(thread: Thread, message: MessageLocalEvent): Promise<void> {}
}
