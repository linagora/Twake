import UserServiceAPI from "../../../user/api";
import ChannelServiceAPI, { ChannelService } from "../../provider";
import { Service } from "./service";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";

export function getService(
  platformServices: PlatformServicesAPI,
  channelService: ChannelServiceAPI,
  userService: UserServiceAPI,
): ChannelService {
  return new Service(platformServices, channelService, userService);
}
