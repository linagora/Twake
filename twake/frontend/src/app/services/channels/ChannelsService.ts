import { ChannelResource } from 'app/models/Channel';
import Observable from 'app/services/Observable/Observable';
import { Collection } from '../CollectionsReact/Collections';
import RouterService from '../RouterService';

class _ChannelsService extends Observable {
  private currentChannelCollection: Collection<ChannelResource> | null = null;

  public getCurrentChannelCollection() {
    return this.currentChannelCollection;
  }

  public select(id: string, collection: Collection<ChannelResource>) {
    this.currentChannelCollection = collection;
    RouterService.history.push(RouterService.generateRouteFromState({ channelId: id }));
  }
}

const ChannelsService = new _ChannelsService();
export default ChannelsService;
