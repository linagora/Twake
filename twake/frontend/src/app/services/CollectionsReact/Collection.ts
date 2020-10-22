import { EventEmitter } from 'events';
import OriginalCollections, {
  Collection as OriginalCollection,
  Resource as OriginalResource,
  EventEmitter as CollectionsEventEmitter,
} from '../Collections/Collections';
import Observable from '../Observable/Observable';

export default class Collection<G extends OriginalResource<any>> extends OriginalCollection<G> {
  protected observable: Observable = new Observable();
  protected eventEmitter = new CollectionsEventEmitter(this.observable);

  constructor(path: string = '', type: new (data: any) => G) {
    super(path, type);
  }

  public useWatcher = this.observable.useWatcher.bind(this.observable);
  public useEvent = this.observable.useWatcher.bind(this.observable);

  public addWatcher = this.observable.addWatcher.bind(this.observable);
  public removeWatcher = this.observable.removeWatcher.bind(this.observable);
  public addEventListener = this.observable.addWatcher.bind(this.observable);
  public removeEventListener = this.observable.removeWatcher.bind(this.observable);
}
