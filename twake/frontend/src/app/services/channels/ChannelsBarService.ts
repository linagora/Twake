import { ChannelResource } from 'app/models/Channel';
import Observable from 'app/services/Observable/Observable';
import { constant } from 'lodash';
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

  async autoSelectChannel(companyId: string, workspaceId: string) {
    let channelId = localStorage.getItem(companyId + ':' + workspaceId + ':channel');

    if (!channelId) {
      const url: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/::mine`;
      const channelsCollection = Collection.get(url, ChannelResource);
      const channels = await channelsCollection.get({}, { query: { mine: true } });
      console.log('TRY TO SELECT A CHANNEL FROM HERE', channels);
      if (channels.length > 0) {
        channelId = channels[0].id;
      }
    }

    if (channelId) {
      this.updateCurrentChannelId(companyId, workspaceId, '');
      RouterService.push(RouterService.generateRouteFromState({ channelId: channelId }));
    }
  }
}

export default new ChannelsBarService();
