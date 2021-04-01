import { MessageLoader } from './MessageLoader';

class MessagesListServerUtilsManager {
  services: { [key: string]: MessageLoader } = {};
  channelsContextById: { [channelId: string]: { companyId: string; workspaceId: string } } = {};

  getByChannelId(channelId: string, _threadId: string, collectionKey: string): MessageLoader | undefined {
    const key = this.getKey(channelId, collectionKey);

    if (this.services[key]) {
      return this.services[key];
    }
  }

  get(
    companyId: string,
    workspaceId: string,
    channelId: string,
    threadId: string,
    collectionKey: string,
  ): MessageLoader {
    const key = this.getKey(channelId, collectionKey);
    let service = this.services[key];

    if (service) {
      //@ts-ignore
      window.MessagesListServerUtils = service;
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

    this.services[key] = service;

    return service;
  }

  private getKey(channelId: string, collectionKey: string): string {
    return `${channelId}-${collectionKey}`;
  }
}

export default new MessagesListServerUtilsManager();
