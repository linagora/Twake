import { MessageLocalEvent, ThreadExecutionContext } from "../../../../types";
import { Thread } from "../../../../entities/threads";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import { getInstance, MessageChannelRef } from "../../../../entities/message-channel-refs";
import {
  getInstance as getInstanceReversed,
  MessageChannelRefReversed,
} from "../../../../entities/message-channel-refs-reversed";
import { localEventBus } from "../../../../../../core/platform/framework/pubsub";
import {
  RealtimeEntityActionType,
  RealtimeLocalBusEvent,
  ResourcePath,
} from "../../../../../../core/platform/services/realtime/types";
import { Message } from "../../../../entities/messages";
import {
  CreateResult,
  UpdateResult,
} from "../../../../../../core/platform/framework/api/crud-service";
import { getThreadMessagePath } from "../../../../web/realtime";
import gr from "../../../../../global-resolver";
import { publishMessageInRealtime } from "../../../utils";

export class ChannelViewProcessor {
  repository: Repository<MessageChannelRef>;
  repositoryReversed: Repository<MessageChannelRefReversed>;

  async init() {
    this.repository = await gr.database.getRepository<MessageChannelRef>(
      "message_channel_refs",
      MessageChannelRef,
    );
    this.repositoryReversed = await gr.database.getRepository<MessageChannelRefReversed>(
      "message_channel_refs_reversed",
      MessageChannelRefReversed,
    );
  }

  async process(thread: Thread, message: MessageLocalEvent): Promise<void> {
    for (const participant of (thread.participants || []).filter(p => p.type === "channel")) {
      if (!message.resource.ephemeral) {
        //Publish message in corresponding channel
        if (message.created) {
          const pkPrefix = {
            company_id: participant.company_id,
            workspace_id: participant.workspace_id,
            channel_id: participant.id,
          };

          //If a pointer exists it means the message already exists (it was probably moved and so we need to keep everything in place)
          const existingPointer = await this.repository.findOne({
            ...pkPrefix,
            message_id: message.resource.id,
          });

          if (!existingPointer) {
            await this.repository.save(
              getInstance({
                ...pkPrefix,
                thread_id: thread.id,
                message_id: message.resource.id,
              }),
            );

            const reversed = await this.repositoryReversed.findOne({
              ...pkPrefix,
              thread_id: thread.id,
            });

            if (reversed) {
              const existingThreadRef = await this.repository.findOne({
                ...pkPrefix,
                message_id: reversed.message_id,
              });
              if (
                existingThreadRef &&
                `${existingThreadRef.thread_id}` === `${message.resource.thread_id}`
              ) {
                reversed.message_id = message.resource.id;
                await this.repositoryReversed.save(reversed);
                await this.repository.remove(existingThreadRef);
              }
            } else {
              await this.repositoryReversed.save(
                getInstanceReversed({
                  ...pkPrefix,
                  thread_id: thread.id,
                  message_id: message.resource.id,
                }),
              );
            }
          }

          //Message moved to it own thread
          if (existingPointer && message.resource.thread_id === message.resource.id) {
            await this.repository.save(
              getInstance({
                ...pkPrefix,
                thread_id: thread.id,
                message_id: message.resource.id,
              }),
            );
            await this.repositoryReversed.save(
              getInstanceReversed({
                ...pkPrefix,
                thread_id: thread.id,
                message_id: message.resource.id,
              }),
            );
          }
        }
      }

      //Publish message in realtime
      publishMessageInRealtime(message, participant);
    }
  }
}
