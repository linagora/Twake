import _ from 'lodash';
import minimongo from 'minimongo';
import semaphore from 'semaphore';

export type MongoItemType = {
  _state: any;
  [key: string]: any;
};

/**
 * This class is the link between minimongo and our Collections.
 * - It choose the right db to use
 * - It abstract the minimongo internal _id and try to not duplicates objects with same id
 */
export default class CollectionStorage {
  static mongoDb: minimongo.MinimongoDb;
  static mongoDbPromises: ((db: minimongo.MinimongoDb) => void)[] = [];
  static semaphores: { [path: string]: semaphore.Semaphore } = {};

  //Ensure unicity of objects in mongo and frontend
  static idKeeper: { [path: string]: { [id: string]: string | true } } = {};

  static async getMongoDb(): Promise<minimongo.MinimongoDb> {
    if (!CollectionStorage.mongoDb) {
      return new Promise(resolve => {
        CollectionStorage.mongoDbPromises.push(resolve);
        if (CollectionStorage.mongoDbPromises.length === 1) {
          if (
            //@ts-ignore
            window.indexedDB ||
            //@ts-ignore
            window.mozIndexedDB ||
            //@ts-ignore
            window.webkitIndexedDB ||
            //@ts-ignore
            window.msIndexedDB
          ) {
            const db = new minimongo.IndexedDb(
              //@ts-ignore typescript doesn't find autoselectLocalDb even if it exists
              { namespace: 'twake' },
              () => {
                const tmp = db;
                CollectionStorage.mongoDbPromises.forEach(c => c(tmp));
                CollectionStorage.mongoDb = tmp;
              },
              () => {
                const tmp = new minimongo.MemoryDb();
                CollectionStorage.mongoDbPromises.forEach(c => c(tmp));
                CollectionStorage.mongoDb = tmp;
              },
            );
          } else {
            const tmp = new minimongo.MemoryDb();
            CollectionStorage.mongoDbPromises.forEach(c => c(tmp));
            CollectionStorage.mongoDb = tmp;
          }
        }
      });
    }

    return CollectionStorage.mongoDb;
  }

  static async addCollection(path: string) {
    CollectionStorage.idKeeper[path] = CollectionStorage.idKeeper[path] || {};
    if (!(await CollectionStorage.getMongoDb()).collections[path]) {
      (await CollectionStorage.getMongoDb()).addCollection(path);
    }
  }

  static upsert(path: string, item: any): Promise<any> {
    this.semaphores[path] = this.semaphores[path] || semaphore(1);
    return new Promise((resolve, reject) => {
      this.semaphores[path].take(async () => {
        new Promise(async (resolve, reject) => {
          if (!item.id) {
            reject('Every resources must contain an id');
            return;
          }
          await CollectionStorage.addCollection(path);

          let exists = false;
          if (
            item.id &&
            CollectionStorage.idKeeper[path] &&
            CollectionStorage.idKeeper[path][item.id]
          ) {
            exists = true;
          }
          CollectionStorage.idKeeper[path][item.id] = true;

          const mongoItems = await CollectionStorage.find(path, { id: item.id });
          if (!mongoItems && exists) {
            //Should have find it in mongo, so this is an error
            resolve();
            return;
          }
          try {
            if (mongoItems && item._id && mongoItems[0]?._id != item._id) {
              await new Promise(async resolve => {
                (await CollectionStorage.getMongoDb()).collections[path].remove(
                  item._id,
                  resolve,
                  resolve,
                );
              });
              item._id = mongoItems[0]?._id;
              item = _.assign(mongoItems[0] || {}, item);
            }
            (await CollectionStorage.getMongoDb()).collections[path].upsert(
              item,
              null,
              item => {
                resolve(item);
              },
              reject,
            );
          } catch (err) {
            reject(err);
          }
        })
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.semaphores[path].leave();
          });
      });
    });
  }

  static remove(path: string, item: any): Promise<any> {
    this.semaphores[path] = this.semaphores[path] || semaphore(1);
    return new Promise((resolve, reject) => {
      this.semaphores[path].take(async () => {
        new Promise(async (resolve, reject) => {
          await CollectionStorage.addCollection(path);

          delete CollectionStorage.idKeeper[path][item.id];

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
                console.log('too many items', mongoItems);
                reject(
                  'The remove filter was not precise enough, cannot remove multiple elements at once.',
                );
              }
            })
            .catch(reject);
        })
          .then(resolve)
          .catch(reject)
          .finally(() => {
            this.semaphores[path].leave();
          });
      });
    });
  }

  static async clear(path: string) {
    await (await CollectionStorage.getMongoDb()).removeCollection(path);
    await CollectionStorage.addCollection(path);
  }

  static find(path: string, filters: any = {}, options: any = {}): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      await CollectionStorage.addCollection(path);
      (await CollectionStorage.getMongoDb()).collections[path]
        .find(filters, options)
        .fetch(results => {
          results.forEach(item => {
            CollectionStorage.idKeeper[path][item.id] = true;
          });
          resolve(results);
        }, reject);
    });
  }

  static findOne(path: string, filters: any = {}, options: any = {}): Promise<any> {
    return new Promise(async (resolve, reject) => {
      await CollectionStorage.addCollection(path);
      CollectionStorage.find(path, filters, options)
        .then((items: any[]) => {
          if (items[0]) CollectionStorage.idKeeper[path][items[0].id] = true;
          resolve(items[0]);
        })
        .catch(reject);
    });
  }
}

(window as any).CollectionStorage = CollectionStorage;
