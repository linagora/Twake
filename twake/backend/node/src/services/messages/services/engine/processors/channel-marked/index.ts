import { MessageLocalEvent } from "../../../../types";
import { Thread } from "../../../../entities/threads";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import {
  getInstance,
  MessageChannelMarkedRef,
} from "../../../../entities/message-channel-marked-refs";
import gr from "../../../../../global-resolver";

export class ChannelMarkedViewProcessor {
  repository: Repository<MessageChannelMarkedRef>;

  async init() {
    this.repository = await gr.database.getRepository<MessageChannelMarkedRef>(
      "message_channel_marked_refs",
      MessageChannelMarkedRef,
    );
  }

  async process(thread: Thread, message: MessageLocalEvent): Promise<void> {
    for (const participant of thread.participants.filter(p => p.type === "channel")) {
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
