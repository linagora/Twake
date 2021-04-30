import { MessageLocalEvent, ThreadExecutionContext } from "../../../../types";
import { MessageServiceAPI } from "../../../../api";
import { DatabaseServiceAPI } from "../../../../../../core/platform/services/database/api";
import { Thread } from "../../../../entities/threads";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import {
  MessageUserInboxRef,
  getInstance as getInboxRefInstance,
} from "../../../../entities/message-user-inbox-refs";
import {
  MessageUserInboxThread,
  getInstance as getInboxThreadInstance,
} from "../../../../entities/message-user-inbox-threads";
import { localEventBus } from "../../../../../../core/platform/framework/pubsub";
import {
  RealtimeEntityActionType,
  RealtimeLocalBusEvent,
} from "../../../../../../core/platform/services/realtime/types";
import { ResourcePath } from "../../../../../../core/platform/services/realtime/types";
import { getThreadMessagePath } from "../../../../web/realtime";
import {
  CreateResult,
  UpdateResult,
} from "../../../../../../core/platform/framework/api/crud-service";
import { Message } from "../../../../entities/messages";
import { pairs } from "rxjs";

export class UserInboxViewProcessor {
  repositoryRef: Repository<MessageUserInboxRef>;
  repositoryThread: Repository<MessageUserInboxThread>;

  constructor(readonly database: DatabaseServiceAPI, readonly service: MessageServiceAPI) {}

  async init() {
    this.repositoryRef = await this.database.getRepository<MessageUserInboxRef>(
      "message_user_inbox_refs",
      MessageUserInboxRef,
    );
    this.repositoryThread = await this.database.getRepository<MessageUserInboxThread>(
      "message_user_inbox_threads",
      MessageUserInboxThread,
    );
  }

  async process(thread: Thread, message: MessageLocalEvent): Promise<void> {
    for (const userParticipant of thread.participants.filter(p => p.type === "user")) {
      for (const channelParticipant of thread.participants.filter(p => p.type === "channel")) {
        //Publish message in corresponding channel

        if (message.created) {
          let threadActivityReversed: MessageUserInboxThread = await this.repositoryThread.findOne({
            company_id: channelParticipant.company_id,
            user_id: userParticipant.id,
            thread_id: thread.id,
          });

          let currentRef: MessageUserInboxRef = null;
          if (threadActivityReversed) {
            currentRef = await this.repositoryRef.findOne({
              company_id: channelParticipant.company_id,
              user_id: userParticipant.id,
              thread_id: thread.id,
              last_activity: threadActivityReversed.last_activity,
            });
          } else {
            threadActivityReversed = getInboxThreadInstance({
              company_id: channelParticipant.company_id,
              user_id: userParticipant.id,
              thread_id: thread.id,
              last_activity: 0,
            });
          }

          const ref = getInboxRefInstance({
            user_id: userParticipant.id,
            company_id: channelParticipant.company_id,
            workspace_id: channelParticipant.workspace_id,
            channel_id: channelParticipant.id,
            thread_id: thread.id,
            last_activity: message.resource.created_at,
          });

          if (currentRef) {
            await this.repositoryThread.remove(currentRef);
          }
          await this.repositoryRef.save(ref);
          threadActivityReversed.last_activity = message.resource.created_at;
          await this.repositoryThread.save(threadActivityReversed);
        }

        //Publish message in realtime

        //TODO send a thread object instead of a message object
        const room = `/companies/${channelParticipant.company_id}/users/${userParticipant.id}/inbox`;
        const type = "message";
        const entity = message.resource;
        const context = message.context;
        localEventBus.publish("realtime:publish", {
          topic: message.created
            ? RealtimeEntityActionType.Created
            : RealtimeEntityActionType.Updated,
          event: {
            type: type,
            room: ResourcePath.get(room),
            resourcePath: getThreadMessagePath(context as ThreadExecutionContext) + "/" + entity.id,
            entity: entity,
            result: message.created
              ? new CreateResult<Message>(type, entity)
              : new UpdateResult<Message>(type, entity),
          },
        } as RealtimeLocalBusEvent<Message>);
      }
    }
  }
}
