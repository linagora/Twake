import Channel from "../entity/channel";

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
