import { MessageLocalEvent, ThreadExecutionContext } from "../../../../types";
import { MessageServiceAPI } from "../../../../api";
import { DatabaseServiceAPI } from "../../../../../../core/platform/services/database/api";
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

export class ChannelViewProcessor {
  repository: Repository<MessageChannelRef>;
  repositoryReversed: Repository<MessageChannelRefReversed>;

  constructor(readonly database: DatabaseServiceAPI, readonly service: MessageServiceAPI) {}

  async init() {
    this.repository = await this.database.getRepository<MessageChannelRef>(
      "message_channel_refs",
      MessageChannelRef,
    );
    this.repositoryReversed = await this.database.getRepository<MessageChannelRefReversed>(
      "message_channel_refs_reversed",
      MessageChannelRefReversed,
    );
  }

  async process(thread: Thread, message: MessageLocalEvent): Promise<void> {
    for (const participant of thread.participants.filter(p => p.type === "channel")) {
      //Publish message in corresponding channel
      if (message.created) {
        const reversed = await this.repositoryReversed.findOne({
          company_id: participant.company_id,
          workspace_id: participant.workspace_id,
          channel_id: participant.id,
          thread_id: thread.id,
        });

        const ref = getInstance({
          company_id: participant.company_id,
          workspace_id: participant.workspace_id,
          channel_id: participant.id,
          thread_id: thread.id,
          message_id: message.resource.id,
        });

        await this.repository.save(ref);

        if (reversed) {
          const existingThreadRef = await this.repository.findOne({
            company_id: participant.company_id,
            workspace_id: participant.workspace_id,
            channel_id: participant.id,
            message_id: reversed.message_id,
          });
          reversed.message_id = message.resource.id;
          await this.repository.save(reversed);
          await this.repository.remove(existingThreadRef);
        }
      }

      //Publish message in realtime
      const room = `/companies/${participant.company_id}/workspaces/${participant.workspace_id}/channels/${participant.id}/feed`;
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
