import ChannelServiceAPI from "../../../channels/provider";
import UserServiceAPI from "../../../user/api";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { MessageServiceAPI, MessageThreadMessagesServiceAPI } from "../../api";
import { ThreadMessagesService } from "./service";
import { FileServiceAPI } from "../../../files/api";
import { ApplicationServiceAPI } from "../../../applications/api";

export function getService(
  databaseService: DatabaseServiceAPI,
  user: UserServiceAPI,
  channel: ChannelServiceAPI,
  files: FileServiceAPI,
  applications: ApplicationServiceAPI,
  service: MessageServiceAPI,
): MessageThreadMessagesServiceAPI {
  return new ThreadMessagesService(databaseService, user, channel, files, applications, service);
}
