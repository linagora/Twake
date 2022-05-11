import Company from "../../../../services/user/entities/company";
import { Channel } from "../../../../services/channels/entities";
import { TwakeServiceProvider } from "../../framework";
import { KnowledgeGraphGenericEventPayload } from "./types";
import Workspace from "../../../../services/workspaces/entities/workspace";
import { Message } from "../../../../services/messages/entities/messages";
import User from "../../../../services/user/entities/user";

export default interface KnowledgeGraphAPI extends TwakeServiceProvider {
  onCompanyCreated(data: KnowledgeGraphGenericEventPayload<Company>): void;
  onWorkspaceCreated(data: KnowledgeGraphGenericEventPayload<Workspace>): void;
  onChannelCreated(data: KnowledgeGraphGenericEventPayload<Channel>): void;
  onMessageCreated(data: KnowledgeGraphGenericEventPayload<Message>): void;
  onUserCreated(data: KnowledgeGraphGenericEventPayload<User>): void;
}
