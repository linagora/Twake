import { MessageLocalEvent } from "../../../../types";
import { Thread } from "../../../../entities/threads";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import { getInstance, MessageFileRef } from "../../../../entities/message-file-refs";
import gr from "../../../../../global-resolver";

export class FilesViewProcessor {
  repository: Repository<MessageFileRef>;

  async init() {
    this.repository = await gr.database.getRepository<MessageFileRef>(
      "message_file_refs",
      MessageFileRef,
    );
  }

  async process(thread: Thread, message: MessageLocalEvent): Promise<void> {
    if (!message.resource.ephemeral) {
      for (const file of message.resource.files || []) {
        //For each channel, we add the media
        for (const participant of (thread.participants || []).filter(p => p.type === "channel")) {
          const fileRef = getInstance({
            target_type: "channel",
            target_id: participant.id,
            id: file.id,
            created_at: message.resource.created_at,
            workspace_id: participant.workspace_id,
            channel_id: participant.id,
            thread_id: thread.id,
            message_id: message.resource.id,
            file_id: file.id,
          });
          this.repository.save(fileRef);
        }

        //For the user we add it as uploaded by user
        const fileRef = getInstance({
          target_type: "user_upload",
          target_id: message.resource.user_id,
          id: file.id,
          created_at: message.resource.created_at,
          workspace_id: "",
          channel_id: "",
          thread_id: thread.id,
          message_id: message.resource.id,
          file_id: file.id,
        });
        this.repository.save(fileRef);
      }
    }
  }
}
