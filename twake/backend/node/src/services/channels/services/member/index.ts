import ChannelServiceAPI, { MemberService } from "../../provider";
import { Service } from "./service";
import UserServiceAPI from "../../../user/api";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";

export function getService(
  platformServices: PlatformServicesAPI,
  channelService: ChannelServiceAPI,
  userService: UserServiceAPI,
): MemberService {
  return new Service(platformServices, channelService, userService);
}
