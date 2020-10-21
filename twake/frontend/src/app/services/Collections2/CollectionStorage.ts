import minimongo from 'minimongo';

/**
 * This class is the link between minimongo and our Collections.
 * - It choose the right db to use
 * - It abstract the minimongo internal _id and try to not duplicates objects with same id
 */
export default class CollectionStorage {
  static mongoDb: minimongo.MinimongoDb;

  static async getMongoDb(): Promise<minimongo.MinimongoDb> {
    if (!CollectionStorage.mongoDb) {
      //@ts-ignore typescript doesn't find autoselectLocalDb even if it exists
      minimongo.utils.autoselectLocalDb(
        { namespace: 'twake' },
        (db: any) => {
          CollectionStorage.mongoDb = db;
        },
        () => {
          CollectionStorage.mongoDb = new minimongo.MemoryDb();
        },
      );
    }
    return CollectionStorage.mongoDb;
  }

  static async addCollection(path: string) {
    if (!(await CollectionStorage.getMongoDb()).collections[path]) {
      (await CollectionStorage.getMongoDb()).addCollection(path);
    }
  }

  static upsert(path: string, item: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (!item.id) {
        reject('Every resources must contain an id');
        return;
      }
      await CollectionStorage.addCollection(path);
      CollectionStorage.find(path, { id: item.id })
        .then(async mongoItems => {
          if (mongoItems.length === 1) {
            item._id = mongoItems[0]._id; //Make sure _id are not duplicated
          }
          (await CollectionStorage.getMongoDb()).collections[path].upsert(item, resolve, reject);
        })
        .catch(reject);
    });
  }

  static remove(path: string, item: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await CollectionStorage.addCollection(path);
      CollectionStorage.find(path, item)
        .then(async mongoItems => {
          if (mongoItems.length === 1) {
            const mongoItem = mongoItems[0];
            let mongoId = '';
            if (mongoItem) {
              mongoId = mongoItem._id;
            }
            (await CollectionStorage.getMongoDb()).collections[path].remove(
              mongoId,
              resolve,
              reject,
            );
          } else if (mongoItems.length === 0) {
            console.log('item not found', item);
            resolve();
          } else {
            console.log(mongoItems);
            reject(
              'The remove filter was not precise enough, cannot remove multiple elements at once.',
            );
          }
        })
        .catch(reject);
    });
  }

  static find(path: string, filters: any = {}, options: any = {}): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      await CollectionStorage.addCollection(path);
      (await CollectionStorage.getMongoDb()).collections[path]
        .find(filters, options)
        .fetch(resolve, reject);
    });
  }

  static findOne(path: string, filters: any = {}, options: any = {}): Promise<any> {
    return new Promise(async (resolve, reject) => {
      await CollectionStorage.addCollection(path);
      CollectionStorage.find(path, filters, options)
        .then((items: any[]) => {
          resolve(items[0]);
        })
        .catch(reject);
    });
  }
}
