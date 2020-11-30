import { ChannelResource } from 'app/models/Channel';
import { Collection } from '../CollectionsReact/Collections';
import RouterService from '../RouterService';
import AppViewService from './AppViewService';

class _MainViewService extends AppViewService {
  private currentChannelCollection: Collection<ChannelResource> | null = null;

  public getViewType(): 'application' | 'channel' | '' {
    const col: any = this.currentChannelCollection;
    return col ? (col.useWatcher ? 'channel' : 'application') : '';
  }

  public getViewCollection() {
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

const MainViewService = new _MainViewService();
export default MainViewService;
