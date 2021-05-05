import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import ChannelServiceAPI, { MemberService } from "../../provider";
import { Service } from "./service";
import UserServiceAPI from "../../../user/api";

export function getService(
  databaseService: DatabaseServiceAPI,
  channelService: ChannelServiceAPI,
  userService: UserServiceAPI,
): MemberService {
  return new Service(databaseService, channelService, userService);
}
