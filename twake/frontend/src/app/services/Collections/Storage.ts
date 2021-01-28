import _ from 'lodash';
import minimongo from 'minimongo';
import semaphore from 'semaphore';
import Logger from '../Logger';

export type MongoItemType = {
  _state: any;
  [key: string]: any;
};

const logger = Logger.getLogger("Collections/Storage");

/**
 * Collection store API
 */
export interface CollectionStore {
  addCollection(path: string): Promise<void>;
  upsert(path: string, item: any): Promise<any>;
  remove(path: string, item: any): Promise<any>;
  clear(path: string): Promise<void>;
  find(path: string, filters?: any, options?: any): Promise<any[]>;
  findOne(path: string, filters?: any, options?: any): Promise<any>;
}

/**
 * This class is the link between minimongo and our Collections.
 * - It choose the right db to use
 * - It abstract the minimongo internal _id and try to not duplicates objects with same id
 */
class CollectionStorage implements CollectionStore {
  static miniMongoInstance: minimongo.MinimongoDb;

  private semaphores: { [path: string]: semaphore.Semaphore } = {};

  //Ensure unicity of objects in mongo and frontend
  private idKeeper: { [path: string]: { [id: string]: string | true } } = {};

  constructor(readonly mongoDb: minimongo.MinimongoDb) {}

  async addCollection(path: string) {
    this.idKeeper[path] = this.idKeeper[path] || {};
    if (!await this.mongoDb.collections[path]) {
      await this.mongoDb.addCollection(path);
    }
  }

  upsert(path: string, item: any): Promise<any> {
    this.semaphores[path] = this.semaphores[path] || semaphore(1);
    return new Promise((resolve, reject) => {
      this.semaphores[path].take(async () => {
        new Promise(async (resolve, reject) => {
          if (!item.id) {
            reject('Every resources must contain an id');
            return;
          }
          await this.addCollection(path);

          let exists = false;
          if (
            item.id &&
            this.idKeeper[path] &&
            this.idKeeper[path][item.id]
          ) {
            exists = true;
          }
          this.idKeeper[path][item.id] = true;

          const mongoItems = await this.find(path, { id: item.id });
          if (!mongoItems && exists) {
            //Should have find it in mongo, so this is an error
            resolve();
            return;
          }
          try {
            if (mongoItems && mongoItems[0]?._id && mongoItems[0]?._id != item._id) {
              if (item._id) {
                await new Promise(async resolve => {
                  await this.mongoDb.collections[path].remove(
                    item._id,
                    resolve,
                    resolve,
                  );
                });
              }
              item._id = mongoItems[0]?._id;
              item = _.assign(mongoItems[0] || {}, item);
            }
            await this.mongoDb.collections[path].upsert(
              item,
              null,
              resolve,
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

  remove(path: string, item: any): Promise<any> {
    this.semaphores[path] = this.semaphores[path] || semaphore(1);
    return new Promise((resolve, reject) => {
      this.semaphores[path].take(async () => {
        new Promise(async (resolve, reject) => {
          await this.addCollection(path);

          delete this.idKeeper[path][item.id];

          this.find(path, item)
            .then(async mongoItems => {
              if (mongoItems.length === 1) {
                const mongoItem = mongoItems[0];
                let mongoId = '';
                if (mongoItem) {
                  mongoId = mongoItem._id;
                }
                await this.mongoDb.collections[path].remove(
                  mongoId,
                  resolve,
                  reject,
                );
              } else if (mongoItems.length === 0) {
                resolve();
              } else {
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

  async clear(path: string) {
    await this.mongoDb.removeCollection(path);
    await this.addCollection(path);
  }

  find(path: string, filters: any = {}, options: any = {}): Promise<any[]> {
    //Fixme: we need to keep only string / number parameters
    //This hack is when whe search using the resource itself as filter, some field make the find not work
    if (filters.id) {
      filters = { id: filters.id };
    }

    return new Promise(async (resolve, reject) => {
      await this.addCollection(path);
      await this.mongoDb.collections[path]
        .find(filters, options)
        .fetch(results => {
          //Tofix right now we need this to avoid some duplications...
          results
            .filter((e, index) => index !== results.map(e => e.id).indexOf(e.id))
            .forEach(async e => {
              await this.mongoDb.collections[path].remove(
                e._id,
                resolve,
                reject,
              );
            });
          results = results.filter((e, index) => index === results.map(e => e.id).indexOf(e.id));

          results.forEach(item => {
            this.idKeeper[path][item.id] = true;
          });
          resolve(results);
        }, reject);
    });
  }

  findOne(path: string, filters: any = {}, options: any = {}): Promise<any> {
    //Fixme: we need to keep only string / number parameters
    //This hack is when whe search using the resource itself as filter, some field make the find not work
    if (filters.id) {
      filters = { id: filters.id };
    }

    return new Promise(async (resolve, reject) => {
      await this.addCollection(path);
      this.find(path, filters, options)
        .then((items: any[]) => {
          if (items[0]) this.idKeeper[path][items[0].id] = true;
          resolve(items[0]);
        })
        .catch(reject);
    });
  }
}

async function getDB(options: { namespace: string } = { namespace: "twake"}): Promise<minimongo.MinimongoDb> {
  if (CollectionStorage.miniMongoInstance) {
    return CollectionStorage.miniMongoInstance;
  }

  return new Promise<minimongo.MinimongoDb>(resolve => {
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
      const mongo = new minimongo.IndexedDb(
        //@ts-ignore typescript doesn't find autoselectLocalDb even if it exists
        { namespace: options.namespace },
        () => {
          logger.debug("Mini Mongo is ready");
          resolve(mongo);
        },
        () => resolve(new minimongo.MemoryDb())
      );
    } else {
      resolve(new minimongo.MemoryDb());
    }
  })
  .then((db: minimongo.MinimongoDb) => {
    CollectionStorage.miniMongoInstance = db;

    return CollectionStorage.miniMongoInstance;
  });
}

export default async function getStore(options: { namespace: string } = { namespace: "twake"}): Promise<CollectionStore> {
  // TODO: Save storages in Map based on options. If not created, create it...
  const mongoDb = await getDB(options);
  return new CollectionStorage(mongoDb);
}
