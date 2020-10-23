import Collections, { Collection, Resource } from '../Collections';

export default class CollectionTransport<G extends Resource<any>> {
  constructor(private readonly collection: Collection<G>) {}

  /**
   * This collection is visible, transport must start
   */
  start() {
    console.log('start listening to collection', this.collection.getPath());
  }

  /**
   * This collection is not visible / used anymore, transport can stop
   */
  stop() {
    console.log('stop listening to collection', this.collection.getPath());
  }
}
