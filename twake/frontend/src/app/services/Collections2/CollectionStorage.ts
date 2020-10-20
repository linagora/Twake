import minimongo from 'minimongo';

/**
 * This class is the link between minimongo and our Collections.
 * - It choose the right db to use
 * - It abstract the minimongo internal _id and try to not duplicates objects with same id
 */
export default class CollectionStorage {
  static mongoDb: minimongo.MinimongoDb;

  static getMongoDb(): minimongo.MinimongoDb {
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

  static addCollection(path: string) {
    if (!CollectionStorage.getMongoDb().collections[path]) {
      CollectionStorage.getMongoDb().addCollection(path);
    }
  }

  static upsert(path: string, item: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!item.id) {
        reject('Every resources must contain an id');
        return;
      }
      CollectionStorage.addCollection(path);
      CollectionStorage.find(path, { id: item.id })
        .then(mongoItems => {
          if (mongoItems.length === 1) {
            item._id = mongoItems[0]._id; //Make sure _id are not duplicated
          }
          CollectionStorage.getMongoDb().collections[path].upsert(item, resolve, reject);
        })
        .catch(reject);
    });
  }

  static remove(path: string, item: any): Promise<void> {
    return new Promise((resolve, reject) => {
      CollectionStorage.addCollection(path);
      CollectionStorage.find(path, item)
        .then(mongoItems => {
          if (mongoItems.length === 1) {
            const mongoItem = mongoItems[0];
            let mongoId = '';
            if (mongoItem) {
              mongoId = mongoItem._id;
            }
            CollectionStorage.getMongoDb().collections[path].remove(mongoId, resolve, reject);
          } else if (mongoItems.length === 0) {
            resolve();
          } else {
            reject(
              'The remove filter was not precise enough, cannot remove multiple elements at once.',
            );
          }
        })
        .catch(reject);
    });
  }

  static find(path: string, filters: any = {}, options: any = {}): Promise<any[]> {
    CollectionStorage.addCollection(path);
    return new Promise((resolve, reject) => {
      CollectionStorage.getMongoDb()
        .collections[path].find(filters, options)
        .fetch(resolve, reject);
    });
  }

  static findOne(path: string, filters: any = {}, options: any = {}): Promise<any> {
    CollectionStorage.addCollection(path);
    return new Promise((resolve, reject) => {
      CollectionStorage.find(path, filters, options)
        .then((items: any[]) => {
          resolve(items[0]);
        })
        .catch(reject);
    });
  }
}
