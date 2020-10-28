import { Channel } from "./entities";
import { ChannelWebsocket } from "./web/types";

export function getWebsocketInformation(channel: Channel): ChannelWebsocket {
  return {
    name: channel.name,
    room: getChannelPath(channel),
    encryption_key: ""
  };
}

export function getChannelPath(channel: Channel): string {
  return `${getChannelsPath()}/${channel.id}`;
}

export function getChannelsPath(): string {
  return "/channels";
}
