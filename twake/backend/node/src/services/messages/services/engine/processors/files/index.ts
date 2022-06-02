import { MessageLocalEvent } from "../../../../types";
import { Thread } from "../../../../entities/threads";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import { getInstance, MessageFileRef } from "../../../../entities/message-file-refs";
import gr from "../../../../../global-resolver";
import uuid from "node-uuid";
import { Pagination } from "../../../../../../core/platform/framework/api/crud-service";
import { MessageFile } from "../../../../entities/message-files";

export class FilesViewProcessor {
  repository: Repository<MessageFileRef>;
  messageFileRepository: Repository<MessageFile>;

  async init() {
    this.repository = await gr.database.getRepository<MessageFileRef>(
      "message_file_refs",
      MessageFileRef,
    );
    this.messageFileRepository = await gr.database.getRepository<MessageFile>(
      "message_files",
      MessageFile,
    );
  }

  async processDownloaded(
    userId: string,
    operation: { message_id: string; thread_id: string; message_file_id: string },
  ): Promise<void> {
    const messageFile = await this.messageFileRepository.findOne({
      message_id: operation.message_id,
      id: operation.message_file_id,
    });

    const message = await gr.services.messages.messages.get({
      thread_id: operation.thread_id,
      id: operation.message_id,
    });

    const refs = await this.repository.find(
      { target_type: "user_download", target_id: userId, company_id: messageFile.company_id },
      {
        pagination: new Pagination("", "100"),
      },
    );
    if (refs.getEntities().some(r => r.message_file_id === messageFile.id)) {
      //File already in the recent list
      return;
    }

    //For the user we add it as downloaded by user
    const fileRef = getInstance({
      target_type: "user_download",
      target_id: userId,
      id: uuid.v1(),
      created_at: new Date().getTime(),
      file_id: messageFile?.metadata?.external_id,
      company_id: messageFile.company_id,
      workspace_id: "",
      channel_id: "",
      thread_id: messageFile.thread_id,
      message_id: messageFile.message_id,
      message_file_id: messageFile.id,
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
          workspace_id:
            (thread.participants || []).filter(p => p.type === "channel")[0]?.workspace_id || "",
          channel_id: (thread.participants || []).filter(p => p.type === "channel")[0]?.id || "",
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
