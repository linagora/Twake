import { MessageLocalEvent, ThreadExecutionContext } from "../../../../types";
import { Thread } from "../../../../entities/threads";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import {
  getInstance as getInboxRefInstance,
  MessageUserInboxRef,
} from "../../../../entities/message-user-inbox-refs";
import {
  getInstance as getInboxThreadInstance,
  MessageUserInboxRefReversed,
} from "../../../../entities/message-user-inbox-refs-reversed";
import { localEventBus } from "../../../../../../core/platform/framework/event-bus";
import {
  RealtimeEntityActionType,
  RealtimeLocalBusEvent,
  ResourcePath,
} from "../../../../../../core/platform/services/realtime/types";
import { getThreadMessagePath } from "../../../../web/realtime";
import {
  CreateResult,
  ExecutionContext,
  UpdateResult,
} from "../../../../../../core/platform/framework/api/crud-service";
import { Message } from "../../../../entities/messages";
import gr from "../../../../../global-resolver";
import { publishMessageInRealtime } from "../../../utils";

export class UserInboxViewProcessor {
  repositoryRef: Repository<MessageUserInboxRef>;
  repositoryReversed: Repository<MessageUserInboxRefReversed>;

  async init() {
    this.repositoryRef = await gr.database.getRepository<MessageUserInboxRef>(
      "message_user_inbox_refs",
      MessageUserInboxRef,
    );
    this.repositoryReversed = await gr.database.getRepository<MessageUserInboxRefReversed>(
      "message_user_inbox_refs_reversed",
      MessageUserInboxRefReversed,
    );
  }

  async process(
    thread: Thread,
    message: MessageLocalEvent,
    context?: ExecutionContext,
  ): Promise<void> {
    for (const userParticipant of thread.participants.filter(p => p.type === "user")) {
      for (const channelParticipant of thread.participants.filter(p => p.type === "channel")) {
        //Publish message in corresponding channel

        if (!userParticipant.id) {
          continue;
        }

        if (message.created) {
          const commonPk = {
            company_id: channelParticipant.company_id,
            user_id: userParticipant.id,
            thread_id: thread.id,
          };

          let threadActivityReversed = await this.repositoryReversed.findOne(commonPk, {}, context);

          let currentRef: MessageUserInboxRef = null;
          if (threadActivityReversed) {
            currentRef = await this.repositoryRef.findOne(
              {
                ...commonPk,
                last_activity: threadActivityReversed.last_activity,
              },
              {},
              context,
            );
          } else {
            threadActivityReversed = getInboxThreadInstance({
              ...commonPk,
              last_activity: 0,
            });
          }

          const ref = getInboxRefInstance({
            ...commonPk,
            workspace_id: channelParticipant.workspace_id,
            channel_id: channelParticipant.id,
            last_activity: message.resource.created_at,
          });

          if (currentRef) {
            await this.repositoryReversed.remove(currentRef, context);
          }
          await this.repositoryRef.save(ref, context);
          threadActivityReversed.last_activity = message.resource.created_at;
          await this.repositoryReversed.save(threadActivityReversed, context);
        }

        //Publish message in realtime

        //TODO send a thread object instead of a message object
        publishMessageInRealtime(message, channelParticipant);
      }
    }
  }
}
