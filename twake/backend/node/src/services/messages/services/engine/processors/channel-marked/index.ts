import { MessageLocalEvent } from "../../../../types";
import { MessageServiceAPI } from "../../../../api";
import { DatabaseServiceAPI } from "../../../../../../core/platform/services/database/api";
import { Thread } from "../../../../entities/threads";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import {
  MessageChannelMarkedRef,
  getInstance,
} from "../../../../entities/message-channel-marked-refs";

export class ChannelMarkedViewProcessor {
  repository: Repository<MessageChannelMarkedRef>;

  constructor(readonly database: DatabaseServiceAPI, readonly service: MessageServiceAPI) {}

  async init() {
    this.repository = await this.database.getRepository<MessageChannelMarkedRef>(
      "message_channel_marked_refs",
      MessageChannelMarkedRef,
    );
  }

  async process(thread: Thread, message: MessageLocalEvent): Promise<void> {
    for (const participant of thread.participants.filter(p => p.type === "channel")) {
      //Thread messages
      if (message.created) {
        const threadRef = getInstance({
          company_id: participant.company_id,
          workspace_id: participant.workspace_id,
          channel_id: participant.id,
          thread_id: thread.id,
          message_id: null,
          type: "thread",
          created_at: message.resource.created_at,
          created_by: message.resource.user_id,
        });
        this.repository.save(threadRef);
      }

      //Pinned messages
      const pinRef = getInstance({
        company_id: participant.company_id,
        workspace_id: participant.workspace_id,
        channel_id: participant.id,
        thread_id: thread.id,
        message_id: message.resource.id,
        type: "pinned",
        created_at: message.resource.pinned_info?.pinned_at || 0,
        created_by: message.resource.pinned_info?.pinned_by || "",
      });
      if (message.resource.pinned_info) {
        this.repository.save(pinRef);
      } else if (!message.created) {
        this.repository.remove(pinRef);
      }

      //TODO add realtime
    }
  }
}
