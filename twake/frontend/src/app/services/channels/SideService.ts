import Observable from 'app/services/Observable/Observable';

class _SidesService extends Observable {
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
