import { MessageLocalEvent, ThreadExecutionContext } from "../../../../types";
import { ParticipantObject, Thread } from "../../../../entities/threads";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import { getInstance, MessageChannelRef } from "../../../../entities/message-channel-refs";
import {
  getInstance as getInstanceReversed,
  MessageChannelRefReversed,
} from "../../../../entities/message-channel-refs-reversed";
import { localEventBus } from "../../../../../../core/platform/framework/event-bus";
import {
  RealtimeEntityActionType,
  RealtimeLocalBusEvent,
  ResourcePath,
} from "../../../../../../core/platform/services/realtime/types";
import { Message } from "../../../../entities/messages";
import {
  CreateResult,
  ExecutionContext,
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

  async process(
    thread: Thread,
    message: MessageLocalEvent,
    context?: ExecutionContext,
  ): Promise<void> {
    let participants: ParticipantObject[] = thread?.participants || [];

    if (participants.length === 0) {
      participants = message.context.channel
        ? [
            {
              type: "channel",
              id: message.context.channel.id,
              workspace_id: message.context.workspace.id,
              company_id: message.context.company.id,
            } as ParticipantObject,
          ]
        : [];
    }

    for (const participant of (participants || []).filter(p => p.type === "channel")) {
      if (!message.resource.ephemeral) {
        //Publish message in corresponding channel
        if (message.created) {
          const pkPrefix = {
            company_id: participant.company_id,
            workspace_id: participant.workspace_id,
            channel_id: participant.id,
          };

          //If a pointer exists it means the message already exists (it was probably moved and so we need to keep everything in place)
          const existingPointer = await this.repository.findOne(
            {
              ...pkPrefix,
              message_id: message.resource.id,
            },
            {},
            context,
          );

          if (!existingPointer) {
            await this.repository.save(
              getInstance({
                ...pkPrefix,
                thread_id: thread.id,
                message_id: message.resource.id,
              }),
              context,
            );

            const reversed = await this.repositoryReversed.findOne(
              {
                ...pkPrefix,
                thread_id: thread.id,
              },
              {},
              context,
            );

            if (reversed) {
              const existingThreadRef = await this.repository.findOne(
                {
                  ...pkPrefix,
                  message_id: reversed.message_id,
                },
                {},
                context,
              );
              if (
                existingThreadRef &&
                `${existingThreadRef.thread_id}` === `${message.resource.thread_id}`
              ) {
                reversed.message_id = message.resource.id;
                await this.repositoryReversed.save(reversed, context);
                await this.repository.remove(existingThreadRef, context);
              }
            } else {
              await this.repositoryReversed.save(
                getInstanceReversed({
                  ...pkPrefix,
                  thread_id: thread.id,
                  message_id: message.resource.id,
                }),
                context,
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
              context,
            );
            await this.repositoryReversed.save(
              getInstanceReversed({
                ...pkPrefix,
                thread_id: thread.id,
                message_id: message.resource.id,
              }),
              context,
            );
          }
        }
      }

      //Publish message in realtime
      publishMessageInRealtime(message, participant);
    }
  }
}
