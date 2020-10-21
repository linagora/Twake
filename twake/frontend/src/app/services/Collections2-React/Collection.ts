import { EventEmitter } from 'events';
import OriginalCollections, {
  Collection as OriginalCollection,
  Resource as OriginalResource,
  EventEmitter as CollectionsEventEmitter,
} from '../Collections2/Collections';
import Observable from '../Observables2/Observable';

export default class Collection<G extends OriginalResource<any>> extends OriginalCollection<G> {
  protected observable: Observable = new Observable();
  protected eventEmitter = new CollectionsEventEmitter(this.observable);

  constructor(path: string = '', type: new (data: any) => G) {
    super(path, type);
  }

  public useWatcher = this.observable.useWatcher;
  public useEvent = this.observable.useWatcher;

  public addWatcher = this.observable.addWatcher;
  public removeWatcher = this.observable.removeWatcher;
  public addEventListener = this.observable.addWatcher;
  public removeEventListener = this.observable.removeWatcher;
}
