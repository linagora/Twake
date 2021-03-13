import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { ChannelMemberPreferencesServiceAPI } from "../../api";
import { ChannelMemberPreferencesService } from "./service";

export function getService(
  databaseService: DatabaseServiceAPI,
): ChannelMemberPreferencesServiceAPI {
  return new ChannelMemberPreferencesService(databaseService);
}
