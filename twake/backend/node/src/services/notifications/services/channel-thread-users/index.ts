import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { ChannelThreadUsersServiceAPI } from "../../api";
import { ChannelThreadUsersService } from "./service";

export function getService(databaseService: DatabaseServiceAPI): ChannelThreadUsersServiceAPI {
  return new ChannelThreadUsersService(databaseService);
}
