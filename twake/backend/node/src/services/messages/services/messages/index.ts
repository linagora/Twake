import ChannelServiceAPI from "../../../channels/provider";
import UserServiceAPI from "../../../user/api";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { MessageServiceAPI, MessageThreadMessagesServiceAPI } from "../../api";
import { ThreadMessagesService } from "./service";

export function getService(
  databaseService: DatabaseServiceAPI,
  user: UserServiceAPI,
  channel: ChannelServiceAPI,
  service: MessageServiceAPI,
): MessageThreadMessagesServiceAPI {
  return new ThreadMessagesService(databaseService, user, channel, service);
}
