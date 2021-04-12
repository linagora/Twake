import { MessageList } from './MessageList';
import { MessageLoader } from './MessageLoader';

class MessageListFactory {
  services: Map<string, MessageList> = new Map<string, MessageList>();

  get(key: string, loader: MessageLoader): MessageList {
    let service = this.services.get(key);

    if (service) {
      return service;
    }

    service = new MessageList(key, loader);

    this.services.set(key, service);

    return service;
  }

  destroy(service: MessageList): void {
    this.services.delete(service.key);
  }
}

const factory = new MessageListFactory();
(window as any).TwakeMessageListFactory = factory;

export default factory;
