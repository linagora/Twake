import { ChannelResource } from 'app/models/Channel';
import Observable from 'app/services/Observable/Observable';
import { Collection } from '../CollectionsReact/Collections';
import RouterService from '../RouterService';
import { getMine } from './ChannelCollectionPath';
import LocalStorage from 'app/services/LocalStorage';

class ChannelsBarService extends Observable {
  private callbacks = new Map<string, (state: boolean) => void>();
  private ready = new Map<string, boolean>();

  wait(companyId: string = '', workspaceId: string = '', collection: Collection<ChannelResource>) {
    const callbackId = this.getCallbackId(companyId, workspaceId);

    if (!this.callbacks.has(callbackId)) {
      const callback = (state: boolean) => {
        if (!state) {
          this.collectionIsReady(companyId, workspaceId);
          collection.removeEventListener('http:loading', callback);
        }
      };

      this.callbacks.set(callbackId, callback);

      collection.addEventListener('http:loading', callback);
    }
  }

  collectionIsReady(companyId: string, workspaceId: string, suffix?: string[]): void {
    let callbackId = this.getCallbackId(companyId, workspaceId);

    if (suffix && suffix.length) {
      callbackId = [callbackId, ...suffix].join('+');
    }

    if (!this.ready.has(callbackId)) {
      this.ready.set(callbackId, true);
      this.notify();
    }
  }

  isReady(companyId: string = '', workspaceId: string = '', suffix?: string[]): boolean {
    let key = this.getCallbackId(companyId, workspaceId);

    if (suffix && suffix.length) {
      key = [key, ...suffix].join('+');
    }

    return !!this.ready.get(key);
  }

  updateCurrentChannelId(
    companyId: string = '',
    workspaceId: string = '',
    channelId: string = '',
  ): void {
    LocalStorage.setItem(this.getLocalStorageKey(companyId, workspaceId), channelId);
  }

  async autoSelectChannel(companyId: string = '', workspaceId: string = ''): Promise<void> {
    let channelId = LocalStorage.getItem<string>(this.getLocalStorageKey(companyId, workspaceId));

    if (!channelId) {
      const channelsCollection = Collection.get(getMine(companyId, workspaceId), ChannelResource);
      const channels = await channelsCollection.get({}, { query: { mine: true } });
      if (channels.length > 0) {
        channelId = channels[0].id;
      }
    }

    if (channelId) {
      this.updateCurrentChannelId(companyId, workspaceId);
      RouterService.push(RouterService.generateRouteFromState({ channelId }));
    }
  }

  private getLocalStorageKey(companyId: string, workspaceId: string): string {
    return `${companyId}:${workspaceId}:channel`;
  }

  private getCallbackId(companyId: string, workspaceId: string): string {
    return `${companyId}+${workspaceId}`;
  }
}

export default new ChannelsBarService();
