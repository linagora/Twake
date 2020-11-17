import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import ChannelServiceAPI from "../provider";
import { getService as getChannelService } from "./channel";
import { getService as getMemberService } from "./member";

export function getService(databaseService: DatabaseServiceAPI): ChannelServiceAPI {
  return getServiceInstance(databaseService);
}

function getServiceInstance(databaseService: DatabaseServiceAPI): ChannelServiceAPI {
  return {
    version: "1",
    channels: getChannelService(databaseService),
    members: getMemberService(databaseService),
  };
}
