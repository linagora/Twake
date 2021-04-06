import Logger from 'app/services/Logger';
import { MessageLoader } from './MessageLoader';

class MessageLoaderFactory {
  services: Map<string, MessageLoader> = new Map<string, MessageLoader>();
  channelsContextById: { [channelId: string]: { companyId: string; workspaceId: string } } = {};
  logger: Logger.Logger;

  constructor() {
    this.logger = Logger.getLogger('MessageLoaderFactory');
  }

  /**
   * 
   * @param channelId
   * @param collectionKey 
   * @returns 
   */
  getByChannelId(channelId: string, collectionKey: string): MessageLoader | undefined {
    const key = this.getKey(channelId, collectionKey);

    if (this.services.has(key)) {
      return this.services.get(key);
    }
  }

  /**
   * 
   * @param companyId 
   * @param workspaceId 
   * @param channelId 
   * @param threadId 
   * @param collectionKey 
   * @returns 
   */
  get(
    companyId: string,
    workspaceId: string,
    channelId: string,
    threadId: string,
    collectionKey: string,
  ): MessageLoader {
    const key = this.getKey(channelId, collectionKey);
    let service = this.services.get(key);

    if (service) {
      return service;
    }

    this.channelsContextById[channelId] = {
      companyId: companyId,
      workspaceId: workspaceId,
    };

    service = new MessageLoader(
      companyId,
      workspaceId,
      channelId,
      threadId,
      collectionKey,
    );

    this.services.set(key, service);

    return service;
  }

  private getKey(channelId: string, collectionKey: string): string {
    return `${channelId}-${collectionKey}`;
  }
}

const factory = new MessageLoaderFactory();
(window as any).TwakeMessageLoaderFactory = factory;

export default factory;
