import ChannelServiceAPI from "../../../channels/provider";
import UserServiceAPI from "../../../user/api";
import { MessageServiceAPI, MessageThreadMessagesServiceAPI } from "../../api";
import { ThreadMessagesService } from "./service";
import { FileServiceAPI } from "../../../files/api";
import { ApplicationServiceAPI } from "../../../applications/api";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";

export function getService(
  platformServices: PlatformServicesAPI,
  user: UserServiceAPI,
  channel: ChannelServiceAPI,
  files: FileServiceAPI,
  applications: ApplicationServiceAPI,
  service: MessageServiceAPI,
): MessageThreadMessagesServiceAPI {
  return new ThreadMessagesService(platformServices, user, channel, files, applications, service);
}
