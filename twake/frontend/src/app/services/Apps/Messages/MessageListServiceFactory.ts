import { ChannelResource } from 'app/features/channels/types/channel';
import { MessageListService } from './MessageListService';

class MessageListServiceFactory {
  services: Map<string, MessageListService> = new Map<string, MessageListService>();

  /**
   * Get a new service, or existing one
   * If trying to get the service from key only, it will return it if it exists and will not try to create it.
   * If trying to get the service from key and channel, it will instanciate a new service with the given channel resource if it does not exists.
   *
   * @param collectionKey Unique key linked to the service.
   * @param channel optional channel resource to create service for.
   * @returns
   */
  get(collectionKey: string, channel?: ChannelResource): MessageListService {
    let service = this.services.get(collectionKey);

    if (service) {
      return service;
    }

    if (!channel) {
      throw new Error(`Can not find service for collection ${collectionKey}, create it first`);
    }

    service = new MessageListService(collectionKey, channel);

    this.services.set(collectionKey, service);

    return service;
  }

  destroy(service: MessageListService): void {
    this.services.delete(service.key);
  }
}

const factory = new MessageListServiceFactory();
(window as any).TwakeMessageListFactory = factory;

export default factory;
