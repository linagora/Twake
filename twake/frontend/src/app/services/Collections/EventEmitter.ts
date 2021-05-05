import EventListener from 'events';
import { Collection, Resource } from './Collections';

interface AttachedEventEmitterInterface extends EventListener {
  notify: () => void;
}

export default class EventEmitter<G extends Resource<any>> {
  constructor(
    private readonly collection: Collection<G>,
    private attachedEventEmitter: AttachedEventEmitterInterface | null,
  ) {
    this.startListeningEvents();
  }

  startListeningEvents() {
    this.attachedEventEmitter?.on('watcher:exists', () => this.collection.getTransport().start());
    this.attachedEventEmitter?.on('watcher:none', () => this.collection.getTransport().stop());
  }

  public emit(action: string, body: any) {
    this.attachedEventEmitter?.emit(action, body);
  }

  public notify() {
    this.attachedEventEmitter?.notify();
  }
}
