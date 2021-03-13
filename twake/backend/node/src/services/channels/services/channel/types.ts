import { merge } from "lodash";
import { Channel } from "../../entities/channel";

export class ChannelObject extends Channel {
  last_activity: number;

  constructor() {
    super();
  }

  static mapTo(channel: Channel, channelLikeObject: Partial<ChannelObject> = {}): ChannelObject {
    return merge(new ChannelObject(), {
      ...{ last_activity: 0 },
      ...channel,
      ...channelLikeObject,
      ...{ members: channel?.members?.length ? channel.members : [] },
    });
  }
}
