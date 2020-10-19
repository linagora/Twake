import CollectionStorage from './CollectionStorage';
import Resource from './Resource';

/**
 * This is a Collection.
 * A Collection manage a list of Resources in a given path (ex. in the channel defined by the path /channels/{channel_id}/messages)
 * Each action done on this Collection will trigger calls to backend.
 */
export default class Collection<G extends Resource<any>> {
  private type: new (data: any) => G;
  private path: string = '';
  private resources: { [id: string]: G } = {};

  constructor(path: string, type: new (data: any) => G) {
    this.path = path;
    this.type = type;
  }

  public insert(item: G): Promise<G> {
    return this.upsert(item);
  }

  public update(item: G): Promise<G> {
    return this.upsert(item);
  }

  public upsert(item: G): Promise<G> {
    return CollectionStorage.upsert(this.path, item.data).then(
      mongoItem =>
        new Promise(resolve => {
          this.updateLocalResource(mongoItem, item);
          resolve(item ? this.resources[mongoItem.id] : item);
        }),
    );
  }

  public remove(filter: any): Promise<any> {
    return CollectionStorage.remove(this.path, filter).then(() => {
      return new Promise(resolve => {
        this.removeLocalResource(filter.id);
        resolve();
      });
    });
  }

  public find(filter?: any, options?: any): Promise<G[]> {
    return CollectionStorage.find(this.path, filter, options).then(
      mongoItems =>
        new Promise(resolve => {
          mongoItems.forEach(mongoItem => {
            this.updateLocalResource(mongoItem);
          });
          resolve(mongoItems.map(mongoItem => this.resources[mongoItem.id]));
        }),
    );
  }

  public findOne(filter?: any, options?: any): Promise<G> {
    if (typeof filter === 'string') {
      filter = { id: filter };
    }
    return CollectionStorage.findOne(this.path, filter, options).then(
      mongoItem =>
        new Promise(resolve => {
          this.updateLocalResource(mongoItem);
          resolve(mongoItem ? this.resources[mongoItem.id] : mongoItem);
        }),
    );
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
