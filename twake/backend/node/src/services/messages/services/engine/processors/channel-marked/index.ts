import { MessageLocalEvent } from "../../../../types";
import { MessageServiceAPI } from "../../../../api";
import { DatabaseServiceAPI } from "../../../../../../core/platform/services/database/api";
import { Thread } from "../../../../entities/threads";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import { MessageChannelMarkedRef } from "../../../../entities/message-channel-marked-refs";

export class ChannelMarkedViewProcessor {
  repository: Repository<MessageChannelMarkedRef>;

  constructor(readonly database: DatabaseServiceAPI, readonly service: MessageServiceAPI) {}

  async init() {
    this.repository = await this.database.getRepository<MessageChannelMarkedRef>(
      "message_channel_marked_refs",
      MessageChannelMarkedRef,
    );
  }

  async process(thread: Thread, message: MessageLocalEvent): Promise<void> {}
}
