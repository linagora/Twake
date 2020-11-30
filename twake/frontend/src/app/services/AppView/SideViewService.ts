import AppViewService, { ViewConfiguration } from './AppViewService';

class _SideViewService extends AppViewService {
  public getViewType(): 'channel_thread' | '' {
    return '';
  }

  public select(id: string, configuration?: ViewConfiguration) {
    super.select(id, configuration);
  }
}

const SideViewService = new _SideViewService();
export default SideViewService;
