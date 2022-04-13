import { Channel } from "../../../../services/channels/entities";
import { TwakeServiceProvider } from "../../framework";
import { KnowledgeGraphGenericEventPayload } from "./types";

export default interface KnowledgeGraphAPI extends TwakeServiceProvider {
  onChannelCreated(data: KnowledgeGraphGenericEventPayload<Channel>): void;
}
