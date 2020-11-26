import { ChannelResource } from 'app/models/Channel';
import Observable from 'app/services/Observable/Observable';
import { Collection } from '../CollectionsReact/Collections';
import RouterService from '../RouterService';

class _ChannelsService extends Observable {
  private currentChannelCollection: Collection<ChannelResource> | null = null;

  public getCurrentChannelType(): 'application' | 'channel' | '' {
    const col: any = this.currentChannelCollection;
    return col ? (col.useWatcher ? 'channel' : 'application') : '';
  }

  public getCurrentChannelCollection() {
    return this.currentChannelCollection;
  }

  public setCurrentChannelCollection(collection: Collection<ChannelResource>) {
    this.currentChannelCollection = collection;
    this.notify();
  }

  public select(id: string) {
    RouterService.history.push(RouterService.generateRouteFromState({ channelId: id }));
  }
}

const ChannelsService = new _ChannelsService();
export default ChannelsService;
