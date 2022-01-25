import { ChannelResource } from 'app/features/channels/types/channel';
import Observable from 'app/deprecated/Observable/Observable';
import { Collection } from '../../../deprecated/CollectionsReact/Collections';
import RouterService from '../../router/services/router-service';
import { getMine } from '../../../deprecated/channels/ChannelCollectionPath';
import LocalStorage from 'app/features/global/services/local-storage-service';

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
    const callbackId = this.getCallbackId(companyId, workspaceId, suffix);

    if (!this.ready.has(callbackId)) {
      this.ready.set(callbackId, true);
      this.notify();
    }
  }

  isReady(companyId: string = '', workspaceId: string = '', suffix?: string[]): boolean {
    return !!this.ready.get(this.getCallbackId(companyId, workspaceId, suffix));
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

  private getCallbackId(companyId: string, workspaceId: string, suffix?: string[]): string {
    let key = `${companyId}+${workspaceId}`;

    if (suffix && suffix.length) {
      key = [key, ...suffix].join('+');
    }

    return key;
  }
}

export default new ChannelsBarService();
