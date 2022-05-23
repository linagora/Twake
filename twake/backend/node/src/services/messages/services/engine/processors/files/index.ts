import { MessageLocalEvent } from "../../../../types";
import { Thread } from "../../../../entities/threads";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import { getInstance, MessageFileRef } from "../../../../entities/message-file-refs";
import gr from "../../../../../global-resolver";
import uuid from "node-uuid";
import { Pagination } from "../../../../../../core/platform/framework/api/crud-service";

export class FilesViewProcessor {
  repository: Repository<MessageFileRef>;

  async init() {
    this.repository = await gr.database.getRepository<MessageFileRef>(
      "message_file_refs",
      MessageFileRef,
    );
  }

  async processDownloaded(
    userId: string,
    file: { id: string; company_id: string; user_id: string },
  ): Promise<void> {
    if (file.user_id === userId) {
      //Do not same for my own uploaded files
      return;
    }

    const refs = await this.repository.find(
      { target_type: "user_download", target_id: userId, company_id: file.company_id },
      {
        pagination: new Pagination("", "100"),
      },
    );

    if (refs.getEntities().some(r => r.message_file_id === file.id)) {
      //File already in the recent list
      return;
    }

    //For the user we add it as downloaded by user
    const fileRef = getInstance({
      target_type: "user_download",
      target_id: userId,
      id: uuid.v1(),
      created_at: new Date().getTime(),
      file_id: file.id,
      company_id: file.company_id,
      workspace_id: "",
      channel_id: "",
      thread_id: null,
      message_id: null,
      message_file_id: "",
    });
    this.repository.save(fileRef);
  }

  async process(thread: Thread, message: MessageLocalEvent): Promise<void> {
    if (!message.resource.ephemeral) {
      for (const file of message.resource.files || []) {
        //For each channel, we add the media
        for (const participant of (thread.participants || []).filter(p => p.type === "channel")) {
          const fileRef = getInstance({
            target_type: "channel",
            target_id: participant.id,
            id: uuid.v1(),
            created_at: message.resource.created_at,
            workspace_id: participant.workspace_id,
            channel_id: participant.id,
            thread_id: thread.id,
            message_id: message.resource.id,
            message_file_id: file.id,
            company_id: file.company_id,
            file_id: file.metadata.external_id,
          });
          this.repository.save(fileRef);
        }

        //For the user we add it as uploaded by user
        const fileRef = getInstance({
          target_type: "user_upload",
          target_id: message.resource.user_id,
          id: uuid.v1(),
          created_at: message.resource.created_at,
          workspace_id: "",
          channel_id: "",
          thread_id: thread.id,
          message_id: message.resource.id,
          message_file_id: file.id,
          company_id: file.company_id,
          file_id: file.metadata.external_id,
        });
        this.repository.save(fileRef);
      }
    }
  }
}
