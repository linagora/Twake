import RouterService from '../RouterService';
import AppViewService, { ViewConfiguration } from './AppViewService';

class _MainViewService extends AppViewService {
  public getViewType(): 'application' | 'channel' | '' {
    const col: any = this.getViewCollection();
    return col ? (col.useWatcher ? 'channel' : 'application') : '';
  }

  public getViewCollection() {
    return this.getConfiguration().collection;
  }

  public select(id: string, configuration?: ViewConfiguration) {
    if (id !== this.getId()) {
      RouterService.push(RouterService.generateRouteFromState({ channelId: id, tabId: '' }));
    }
    super.select(id, configuration);
  }
}

const MainViewService = new _MainViewService();
export default MainViewService;
