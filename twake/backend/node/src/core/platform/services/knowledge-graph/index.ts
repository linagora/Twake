import { Consumes, TwakeService } from "../../framework";
import { localEventBus } from "../../framework/pubsub";
import KnowledgeGraphAPI from "./provider";
import Workspace from "../../../../services/workspaces/entities/workspace";
import Company from "../../../../services/user/entities/company";
import User from "../../../../services/user/entities/user";
import { Channel } from "../../../../services/channels/entities";
import { Message } from "../../../../services/messages/entities/messages";
import { KnowledgeGraphGenericEventPayload, KnowledgeGraphEvents } from "./types";

@Consumes([])
export default class KnowledgeGraphService
  extends TwakeService<KnowledgeGraphAPI>
  implements KnowledgeGraphAPI
{
  readonly name = "knowledge-graph";

  readonly version = "1.0.0";

  async doInit(): Promise<this> {
    localEventBus.subscribe<KnowledgeGraphGenericEventPayload<Company>>(
      KnowledgeGraphEvents.COMPANY_CREATED,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      _data => {},
    );

    localEventBus.subscribe<KnowledgeGraphGenericEventPayload<Workspace>>(
      KnowledgeGraphEvents.WORKSPACE_CREATED,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      _data => {},
    );

    localEventBus.subscribe<KnowledgeGraphGenericEventPayload<Channel>>(
      KnowledgeGraphEvents.CHANNEL_CREATED,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      this.onChannelCreated,
    );

    localEventBus.subscribe<KnowledgeGraphGenericEventPayload<Message>>(
      KnowledgeGraphEvents.MESSAGE_CREATED,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      _data => {},
    );

    localEventBus.subscribe<KnowledgeGraphGenericEventPayload<User>>(
      KnowledgeGraphEvents.USER_CREATED,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      _data => {},
    );

    return this;
  }

  onChannelCreated(data: KnowledgeGraphGenericEventPayload<Channel>): void {
    console.log(KnowledgeGraphEvents.CHANNEL_CREATED, data);
    // TODO: Send data to the knowledge graph api
  }

  api(): KnowledgeGraphAPI {
    return this;
  }
}
