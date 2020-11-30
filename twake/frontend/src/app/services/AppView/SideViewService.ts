import AppViewService from './AppViewService';

class _SidesService extends AppViewService {
  private side = '';

  public hasSide() {
    return this.side;
  }

  public select(id: string) {
    this.side = id;
    this.notify();
  }
}

const SidesService = new _SidesService();
export default SidesService;
