import Observable from 'app/services/Observable/Observable';

type NodeType = React.RefObject<HTMLDivElement | ChildNode> | React.MutableRefObject<any> | any;

type BeaconRef = {
  node: NodeType;
  top: number;
};

type ScrollerRef = {
  node: NodeType | undefined;
  top: number | undefined;
};

type InstanceType = { [key: string]: HiddenNotificationService };

class HiddenNotificationService extends Observable {
  beacons: BeaconRef[] = [];
  scroller: ScrollerRef = { node: undefined, top: undefined };
  state: any = {
    beaconTop: [],
    beaconBottom: [],
  };

  constructor() {
    super();
    this.detectHiddenBeacons = this.detectHiddenBeacons.bind(this);
    (window as any).HiddenNotificationService = this;
  }

  public addBeacon(node: NodeType) {
    this.removeBeacon(node);

    this.beacons.push({
      node,
      top: 0,
    });

    if (this.scroller && this.scroller.top) {
      this.setBeaconsTop(this.scroller);
    }
    this.detectHiddenBeacons();
  }

  public removeBeacon(node: NodeType) {
    this.beacons = this.beacons.filter(element => node !== element.node);
    this.detectHiddenBeacons();
  }

  private setBeaconsTop(scroller: ScrollerRef) {
    this.beacons.map((beacon: BeaconRef) => {
      beacon.top =
        beacon.node.current.getBoundingClientRect().y -
        (scroller.node.getBoundingClientRect().y || 0) +
        scroller.node.scrollTop;
    });
  }

  public setScroller(node: NodeType) {
    this.scroller = { node, top: node.getBoundingClientRect().y };

    node.addEventListener('scroll', this.detectHiddenBeacons, { passive: true });

    this.setBeaconsTop(this.scroller);
    this.detectHiddenBeacons();
  }

  private detectHiddenBeacons(evt: any = null) {
    if (!this.scroller.node) return;

    setTimeout(() => {
      const hidden: any = {
        beaconTop: [],
        beaconBottom: [],
      };

      const visibleHeight = this.scroller.node.getBoundingClientRect().height;
      const scrollerTop = this.scroller.node.getBoundingClientRect().y || 0;

      this.beacons.forEach((beacon: BeaconRef) => {
        const top = beacon.node.current.getBoundingClientRect().y - scrollerTop;
        if (top > visibleHeight) {
          hidden.beaconBottom.push(beacon);
        }
        if (top < 0) {
          hidden.beaconTop.push(beacon);
        }
      });

      this.state = hidden;
      this.notify();
    }, 500);
  }

  public removeScroller() {
    this.scroller = { node: undefined, top: undefined };
    if (this.scroller.node) {
      this.scroller.node.removeEventListener('scroll', this.detectHiddenBeacons.bind(this));
    }
  }
}

export default class HiddenNotificationServiceManager {
  static instances: InstanceType = {};

  public static get(tag: string) {
    if (!this.instances[tag]) {
      this.instances[tag] = new HiddenNotificationService();
    }

    return this.instances[tag];
  }
}
