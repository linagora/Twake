import { ChannelResource } from 'app/models/Channel';
import Observable from 'app/services/Observable/Observable';
import MainViewService from '../AppView/MainViewService';
import { Collection } from '../CollectionsReact/Collections';
import RouterService from '../RouterService';
import ChannelsService from './channels';
class ChannelsBarService extends Observable {
  callbacks: any = {};
  ready: any = {};

  wait(companyId: string, workspaceId: string, collection: Collection<ChannelResource>) {
    if (!this.callbacks[companyId + '+' + workspaceId]) {
      this.callbacks[companyId + '+' + workspaceId] = ((state: boolean) => {
        if (!state) {
          this.collectionIsReady(companyId, workspaceId);
          collection.removeEventListener(
            'http:loading',
            this.callbacks[companyId + '+' + workspaceId],
          );
        }
      }).bind(this);

      collection.addEventListener('http:loading', this.callbacks[companyId + '+' + workspaceId]);
    }
  }

  collectionIsReady(companyId: string, workspaceId: string) {
    if (!this.ready[companyId + '+' + workspaceId]) {
      this.ready[companyId + '+' + workspaceId] = true;
      this.notify();
    }
  }

  updateCurrentChannelId(companyId: string, workspaceId: string, channelId: string) {
    localStorage.setItem(companyId + ':' + workspaceId + ':channel', channelId);
  }

  autoSelectChannel(companyId: string, workspaceId: string) {
    const channelId = localStorage.getItem(companyId + ':' + workspaceId + ':channel');
    if (channelId) {
      this.updateCurrentChannelId(companyId, workspaceId, '');
      RouterService.push(RouterService.generateRouteFromState({ channelId: channelId }));
    }
  }
}

export default new ChannelsBarService();
