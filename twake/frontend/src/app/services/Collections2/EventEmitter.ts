interface AttachedEventEmitterInterface {
  notify: () => void;
}

export default class EventEmitter {
  constructor(private attachedEventEmitter: AttachedEventEmitterInterface | null) {}

  attachEventEmitter(eventEmitter: AttachedEventEmitterInterface) {
    this.attachedEventEmitter = eventEmitter;
  }

  getEventEmitter() {
    return this.attachedEventEmitter;
  }

  public notify() {
    if (this.attachedEventEmitter) {
      this.attachedEventEmitter.notify();
    }
  }
}
