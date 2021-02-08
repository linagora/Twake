import { ChannelResource } from 'app/models/Channel';
import Observable from 'app/services/Observable/Observable';
import { Collection } from '../CollectionsReact/Collections';

class ChannelsBarService extends Observable {
  constructor() {
    super();
  }

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
}

export default new ChannelsBarService();
