import { Channel } from "../../../services/channels/entities";
import { fileIsMedia } from "../../../services/files/utils";
import { UserObject } from "../../../services/user/web/types";
import { formatUser } from "../../../utils/users";
import { Initializable } from "../../../core/platform/framework";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import gr from "../../../services/global-resolver";
import { MessageFileRef, TYPE as TYPERef } from "../entities/message-file-refs";
import { MessageFile, TYPE } from "../entities/message-files";
import { Message } from "../entities/messages";
import _ from "lodash";

export class MessagesFilesService implements Initializable {
  version: "1";
  msgFilesRepository: Repository<MessageFile>;
  msgFilesRefRepository: Repository<MessageFileRef>;

  constructor() {}

  async init() {
    this.msgFilesRepository = await gr.database.getRepository(TYPE, MessageFile);
    this.msgFilesRefRepository = await gr.database.getRepository(TYPERef, MessageFileRef);
    return this;
  }

  /**
   * Delete a message file and test this files belongs to the right user
   * @param message_id
   * @param id
   * @param user_id
   * @returns
   */
  async deleteMessageFile(message_id: string, id: string, user_id: string) {
    const msgFile = await this.getMessageFile(message_id, id);
    if (!msgFile) return null;

    if (msgFile.message.user_id !== user_id) return null;

    await this.msgFilesRepository.remove(msgFile);

    for (const target_type of ["channel_media", "channel_file", "channel"]) {
      const ref = await this.msgFilesRefRepository.findOne({
        target_type,
        company_id: msgFile.channel.company_id,
        target_id: msgFile.channel.id,
        id: msgFile.id,
      });
      if (ref) await this.msgFilesRefRepository.remove(ref);
    }

    return msgFile;
  }

  /**
   * Get a message file and returns more contextual data
   * @param message_id
   * @param id
   * @returns
   */
  async getMessageFile(
    message_id: string,
    id: string,
  ): Promise<
    MessageFile & {
      user: UserObject;
      message: Message;
      channel: Channel;
      navigation: { next: Partial<MessageFile>; previous: Partial<MessageFile> };
    }
  > {
    const msgFile = await this.msgFilesRepository.findOne({ message_id, id });
    if (!msgFile) return null;

    const message = await gr.services.messages.messages.get({
      thread_id: msgFile.thread_id,
      id: message_id,
    });
    const channel = await gr.services.channels.channels.get({
      company_id: message.cache.company_id,
      workspace_id: message.cache.workspace_id,
      id: message.cache.channel_id,
    });
    const user = await formatUser(await gr.services.users.get({ id: message.user_id }));

    const navigationPk = {
      target_type: fileIsMedia(msgFile) ? "channel_media" : "channel_file",
      company_id: channel.company_id,
      target_id: channel.id,
    };
    const { previous, next } = await this.getMessageFileNavigation(navigationPk, msgFile.id);

    return {
      ...msgFile,
      user,
      message,
      channel,
      navigation: {
        next: next
          ? {
              id: next.message_file_id,
              message_id: next.message_id,
            }
          : null,
        previous: previous
          ? {
              id: previous.message_file_id,
              message_id: previous.message_id,
            }
          : null,
      },
    };
  }

  /**
   * Message file references are ordered with an id based on the time the file was uploaded
   * We cannot get this specific ID directly from the message file right now
   */
  private async getMessageFileNavigation(
    navigationPk: { target_type: string; company_id: string; target_id: string },
    id: string,
  ) {
    const list = [
      ...(
        await this.msgFilesRefRepository.find(navigationPk, {
          pagination: {
            page_token: null,
            limitStr: "5",
            reversed: false,
          },
          $gte: [["id", id]],
        })
      ).getEntities(),
      ...(
        await this.msgFilesRefRepository.find(navigationPk, {
          pagination: {
            page_token: null,
            limitStr: "5",
            reversed: true,
          },
          $lte: [["id", id]],
        })
      ).getEntities(),
    ];
    const offsetRef = list.find(a => a.message_file_id === id) || null;

    let next = (
      await this.msgFilesRefRepository.find(navigationPk, {
        pagination: {
          page_token: null,
          limitStr: "2",
          reversed: true,
        },
        $gte: [["id", offsetRef?.id || id]],
      })
    )
      .getEntities()
      .filter(a => a.message_file_id !== id)?.[0];
    let previous = (
      await this.msgFilesRefRepository.find(navigationPk, {
        pagination: {
          page_token: null,
          limitStr: "2",
          reversed: false,
        },
        $lte: [["id", offsetRef?.id || id]],
      })
    )
      .getEntities()
      .filter(a => a.message_file_id !== id)?.[0];

    return { previous, next };
  }
}
