import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import ChannelServiceAPI, { MemberService } from "../../provider";
import { Service } from "./service";

export function getService(
  databaseService: DatabaseServiceAPI,
  channelService: ChannelServiceAPI,
): MemberService {
  return new Service(databaseService, channelService);
}
