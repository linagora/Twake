import AppViewService from './AppViewService';

class _SideViewService extends AppViewService {
  private side = '';

  public getViewType(): 'channel_thread' | '' {
    return '';
  }

  public hasSide() {
    return this.side;
  }

  public select(id: string) {
    this.side = id;
    this.notify();
  }
}

const SideViewService = new _SideViewService();
export default SideViewService;
