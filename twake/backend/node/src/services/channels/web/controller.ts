import Channel from "../entity/channel";
import { CreateChannelBody } from "./types";

export async function create(channel: CreateChannelBody): Promise<Channel> {
  return new Channel("1", channel.name, "supersecret");
}

export async function getChannels(): Promise<Channel[]> {
  return [new Channel("1"), new Channel("2")];
}

export async function getChannel(id: string): Promise<Channel> {
  return new Channel(id);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function remove(id: string): Promise<void> {
  return null;
}
