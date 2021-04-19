import { ChannelResource } from 'app/models/Channel';
import { MessageLoader } from './MessageLoader';

class MessageLoaderFactory {
  private loaders: Map<string, MessageLoader> = new Map<string, MessageLoader>();
  channelsContextById: { [channelId: string]: { companyId?: string; workspaceId?: string | null | undefined } } = {};

  get(collectionKey: string, channel: ChannelResource, threadId?: string): MessageLoader {
    const key = this.getKey(channel, collectionKey, threadId);
    let loader = this.loaders.get(key);

    if (loader) {
      return loader;
    }

    if (channel.data.id) {
      this.channelsContextById[channel.data.id] = {
        companyId: channel.data.company_id,
        workspaceId: channel.data.workspace_id,
      };
    }

    loader = new MessageLoader(collectionKey, channel, threadId);

    this.loaders.set(key, loader);

    return loader;
  }

  private getKey(channel: ChannelResource, collectionKey: string, threadId?: string): string {
    return `channel:${channel.data.id}/collection:${collectionKey}/thread:${threadId}`;
  }
}

const factory = new MessageLoaderFactory();
(window as any).TwakeMessageLoaderFactory = factory;

export default factory;
