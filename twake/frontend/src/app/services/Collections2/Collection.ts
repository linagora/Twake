import CollectionStorage from './CollectionStorage';
import Resource from './Resource';

/**
 * This is a Collection.
 * A Collection manage a list of Resources in a given path (ex. in the channel defined by the path /channels/{channel_id}/messages)
 * Each action done on this Collection will trigger calls to backend.
 */
export default class Collection<G extends Resource<any>> {
  private resources: { [id: string]: G } = {};

  constructor(private readonly path: string = '', private readonly type: new (data: any) => G) {}

  public insert(item: G): Promise<G> {
    return this.upsert(item);
  }

  public update(item: G): Promise<G> {
    return this.upsert(item);
  }

  public async upsert(item: G): Promise<G> {
    const mongoItem = await CollectionStorage.upsert(this.path, item.data);
    this.updateLocalResource(mongoItem, item);
    return item ? this.resources[mongoItem.id] : item;
  }

  public async remove(filter: any): Promise<void> {
    await CollectionStorage.remove(this.path, filter);
    this.removeLocalResource(filter.id);
    return;
  }

  public async find(filter?: any, options?: any): Promise<G[]> {
    const mongoItems = await CollectionStorage.find(this.path, filter, options);
    mongoItems.forEach(mongoItem => {
      this.updateLocalResource(mongoItem);
    });
    return mongoItems.map(mongoItem => this.resources[mongoItem.id]);
  }

  public async findOne(filter?: any, options?: any): Promise<G> {
    if (typeof filter === 'string') {
      filter = { id: filter };
    }
    const mongoItem = await CollectionStorage.findOne(this.path, filter, options);
    this.updateLocalResource(mongoItem);
    return mongoItem ? this.resources[mongoItem.id] : mongoItem;
  }

  private updateLocalResource(mongoItem: any, item?: G) {
    if (mongoItem) {
      if (!item) {
        item = this.resources[mongoItem.id] || new this.type(mongoItem);
      }
      item.data = mongoItem;
      this.resources[mongoItem.id] = item;
    }
  }

  private removeLocalResource(id: string) {
    if (id) {
      delete this.resources[id];
    }
  }
}
