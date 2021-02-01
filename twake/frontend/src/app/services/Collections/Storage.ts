import _ from 'lodash';
import minimongo from 'minimongo';
import Logger from '../Logger';
import { v4 as uuidv4 } from 'uuid';

export type MongoItemType = {
  _state: any;
  [key: string]: any;
};

const logger = Logger.getLogger('Collections/Storage');

/**
 * Collection store API
 */
export interface CollectionStore {
  addCollection(type: string): { [id: string]: any };
  upsert(type: string, path: string, item: any): any;
  remove(type: string, path: string, item: any): any;
  clear(type: string, path: string): void;
  find(type: string, path: string, filters?: any, options?: any): any[];
  findOne(type: string, path: string, filters?: any, options?: any): any;
}

/**
 * This class is the link between minimongo and our Collections.
 * - It choose the right db to use
 * - It abstract the minimongo internal _id and try to not duplicates objects with same id
 */
export class CollectionStorage implements CollectionStore {
  private database: { [type: string]: { [id: string]: any } } = {};
  private frontIdToIdTransform: { [frontId: string]: string } = {};

  static miniMongoInstance: minimongo.MinimongoDb;
  public mongoDb: minimongo.MinimongoDb | null = null;

  constructor() {
    (window as any).storage = this;
  }

  addCollection(type: string) {
    this.database[type] = this.database[type] || {};
    return this.database[type];
  }

  upsert(type: string, path: string, item: any): any {
    if (!item.id) {
      logger.log('upsert: ', 'Every resources must contain an id', path, item);
      throw 'Every resources must contain an id';
    }

    const collection = this.addCollection(type);

    if (
      item._frontId &&
      this.frontIdToIdTransform[item._frontId] &&
      this.frontIdToIdTransform[item._frontId] !== item.id
    ) {
      collection[item.id] = collection[this.frontIdToIdTransform[item._frontId]];
      delete collection[this.frontIdToIdTransform[item._frontId]];
    }

    if (!item._frontId) {
      item._frontId = uuidv4();
    }

    collection[item.id] = collection[item.id] || {};

    collection[item.id] = _.assign(collection[item.id] || {}, item);

    !collection[item.id]._paths && (collection[item.id]._paths = []);
    collection[item.id]._paths.indexOf(path) < 0 && collection[item.id]._paths.push(path);

    this.frontIdToIdTransform[item._frontId] = item.id;

    return collection[item.id];
  }

  remove(type: string, path: string, item: any = {}): any {
    const collection = this.addCollection(type);
    const items = this.find(type, path, item);
    for (let item of items) {
      item._paths = item._paths.filter((p: string) => p !== path);
      if (!path || item._paths.length == 0) {
        item.id && collection[item.id] && delete collection[item.id];
      }
    }
    return item;
  }

  clear(type: string, path: string) {
    this.remove(type, path);
    if (!path) {
      delete this.database[type];
    }
  }

  find(type: string, path: string, filters: any = {}, options: any = {}): any[] {
    const collection = this.addCollection(type);
    if (filters.id) {
      return collection[filters.id] ? [collection[filters.id]] : [];
    }

    return Object.values(collection).filter(
      item =>
        Object.keys(filters).every(filter => item[filter] === filters[filter]) &&
        (!path || item._paths.indexOf(path) >= 0),
    );
  }

  findOne(type: string, path: string, filters: any = {}, options: any = {}): any {
    return this.find(type, path, filters, options)[0];
  }
}

const storages: { [key: string]: CollectionStorage } = {};

export default function getStore(key: string): CollectionStore {
  if (!key) {
    throw new Error('Storage key is not set');
  }

  if (storages[key]) {
    return storages[key];
  }

  cleanupOldDatabase(key);

  storages[key] = new CollectionStorage();
  getDB({ namespace: key }).then(mongoDb => {
    storages[key].mongoDb = mongoDb;
  });

  return storages[key];
}

export async function getDB(
  options: { namespace: string } = { namespace: 'twake' },
): Promise<minimongo.MinimongoDb> {
  if (CollectionStorage.miniMongoInstance) {
    return CollectionStorage.miniMongoInstance;
  }

  return new Promise<minimongo.MinimongoDb>(resolve => {
    if (isIndexedDBSupported()) {
      const mongo = new minimongo.IndexedDb(
        //@ts-ignore typescript doesn't find autoselectLocalDb even if it exists
        { namespace: options.namespace },
        () => {
          logger.debug('Mini Mongo is ready');
          resolve(mongo);
        },
        () => resolve(new minimongo.MemoryDb()),
      );
    } else {
      resolve(new minimongo.MemoryDb());
    }
  }).then((db: minimongo.MinimongoDb) => {
    CollectionStorage.miniMongoInstance = db;

    return CollectionStorage.miniMongoInstance;
  });
}

export function clearCurrentDatabase(): void {
  const database = getExistingDatabase();
  removeDatabase(database);
}

function cleanupOldDatabase(userId: string): void {
  const database = getDBName(userId);
  const oldDatabase = getExistingDatabase();

  if (oldDatabase === database) {
    return;
  }

  saveDatabaseName(database);
  removeDatabase(oldDatabase);
}

function removeDatabase(name: string): void {
  if (!name || !isIndexedDBSupported()) {
    return;
  }

  if (window.indexedDB.deleteDatabase) {
    const req = window.indexedDB.deleteDatabase(name);

    req.onerror = () => logger.debug('Error while removing the DB', name);
    req.onblocked = () => logger.debug('DB removal is blocked', name);
    req.onsuccess = () => logger.debug('DB has been removed', name);
    req.onupgradeneeded = () => logger.debug('DB upgrade needed', name);
  }
}

function isIndexedDBSupported(): boolean {
  return 'indexedDB' in window;
}

function getExistingDatabase(): string {
  const database = window.localStorage.getItem('twake-collection-db');
  return database ? JSON.parse(database) : '';
}

function saveDatabaseName(name: string) {
  window.localStorage.setItem('twake-collection-db', JSON.stringify(name));
}

function getDBName(userId: string): string {
  return `IDBWrapper-minimongo_${userId}`;
}
