import { merge } from "lodash";
import { Channel } from "../../entities/channel";
import { ChannelActivity } from "../../entities/channel-activity";

export type NewUserInWorkspaceNotification = {
  user_id: string;
  company_id: string;
  workspace_id: string;
};

export class ChannelObject extends Channel {
  last_activity?: ChannelActivity["last_activity"];
  last_message?: ChannelActivity["last_message"];

  constructor() {
    super();
  }

  static mapTo(channel: Channel, channelLikeObject: Partial<ChannelObject> = {}): ChannelObject {
    if (!channel) {
      return null;
    }

    return merge(new ChannelObject(), {
      ...{ last_activity: 0 },
      ...channel,
      ...channelLikeObject,
      ...{ members: channel?.members?.length ? channel.members : [] },
    });
  }
}
