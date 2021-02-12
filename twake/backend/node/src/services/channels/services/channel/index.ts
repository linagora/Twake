import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import ChannelServiceAPI, { ChannelService } from "../../provider";
import { Service } from "./service";

export function getService(
  databaseService: DatabaseServiceAPI,
  channelService: ChannelServiceAPI,
): ChannelService {
  return new Service(channelService, databaseService);
}
